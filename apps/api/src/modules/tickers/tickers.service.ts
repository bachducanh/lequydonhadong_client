import { Injectable } from '@nestjs/common';
import { Prisma, TickerItem } from '@prisma/client';
import { insensitive } from '../../common/pagination';
import { orNull, toDate } from '../../common/text';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { CreateTickerDto, UpdateTickerDto } from './tickers.dto';

export type ScheduleState = 'RUNNING' | 'SCHEDULED' | 'EXPIRED';

export function scheduleState(item: { startAt: Date | null; endAt: Date | null }, now = new Date()): ScheduleState {
  if (item.startAt && item.startAt > now) return 'SCHEDULED';
  if (item.endAt && item.endAt < now) return 'EXPIRED';
  return 'RUNNING';
}

export const activeWindow = (now = new Date()) => ({
  AND: [
    { OR: [{ startAt: null }, { startAt: { lte: now } }] },
    { OR: [{ endAt: null }, { endAt: { gte: now } }] },
  ],
});

@Injectable()
export class TickersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  publicList() {
    return this.cache.wrap('tickers', 60, () =>
      this.prisma.tickerItem.findMany({
        where: activeWindow(),
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        take: 5,
        select: { id: true, text: true, link: true },
      }),
    );
  }

  async adminList(q?: string) {
    const where: Prisma.TickerItemWhereInput = q ? { text: insensitive(q) } : {};
    const items = await this.prisma.tickerItem.findMany({ where, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
    return { data: items.map((t: TickerItem) => ({ ...t, state: scheduleState(t) })) };
  }

  get(id: string) {
    return this.prisma.tickerItem.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateTickerDto) {
    return this.prisma.tickerItem.create({
      data: { ...dto, link: orNull(dto.link), startAt: toDate(dto.startAt), endAt: toDate(dto.endAt) },
    });
  }

  update(id: string, dto: UpdateTickerDto) {
    return this.prisma.tickerItem.update({
      where: { id },
      data: { ...dto, link: orNull(dto.link), startAt: toDate(dto.startAt), endAt: toDate(dto.endAt) },
    });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(ids.map((id, order) => this.prisma.tickerItem.update({ where: { id }, data: { order } })));
    return { ok: true };
  }

  async remove(id: string) {
    await this.prisma.tickerItem.delete({ where: { id } });
    return { ok: true };
  }
}
