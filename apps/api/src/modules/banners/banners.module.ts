import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BannerPosition, Prisma } from '@prisma/client';
import { Public, RateLimit, Staff } from '../../common/decorators';
import { insensitive, pageArgs, paged } from '../../common/pagination';
import { toDate } from '../../common/text';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { activeWindow, scheduleState } from '../tickers/tickers.service';
import { BannerQueryDto, CreateBannerDto, UpdateBannerDto } from './banners.dto';

@Injectable()
export class BannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /** Banner đang hiển thị tại một vị trí (bật + trong thời gian chạy). */
  active(position?: BannerPosition) {
    return this.cache.wrap(`banners:${position ?? 'all'}`, 120, () =>
      this.prisma.banner.findMany({
        where: { visible: true, ...(position ? { position } : {}), ...activeWindow() },
        orderBy: { createdAt: 'desc' },
        select: { id: true, eyebrow: true, title: true, description: true, ctaLabel: true, link: true, image: true, position: true, name: true },
      }),
    );
  }

  async click(id: string) {
    await this.prisma.banner.update({ where: { id }, data: { clicks: { increment: 1 } } }).catch(() => undefined);
    return { ok: true };
  }

  async adminList(query: BannerQueryDto) {
    const { page, limit, skip, take } = pageArgs(query);
    const where: Prisma.BannerWhereInput = {};
    if (query.position) where.position = query.position;
    if (query.q) where.name = insensitive(query.q);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.banner.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.banner.count({ where }),
    ]);
    return paged(rows.map((b) => ({ ...b, state: scheduleState(b) })), total, page, limit);
  }

  get(id: string) {
    return this.prisma.banner.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateBannerDto) {
    return this.prisma.banner.create({ data: { ...dto, startAt: toDate(dto.startAt), endAt: toDate(dto.endAt) } });
  }

  update(id: string, dto: UpdateBannerDto) {
    return this.prisma.banner.update({ where: { id }, data: { ...dto, startAt: toDate(dto.startAt), endAt: toDate(dto.endAt) } });
  }

  async remove(id: string) {
    await this.prisma.banner.delete({ where: { id } });
    return { ok: true };
  }
}

@ApiTags('Banner quảng cáo')
@Public()
@Controller('banners')
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  list(@Query() query: BannerQueryDto) {
    return this.banners.active(query.position);
  }

  @RateLimit(30, 60)
  @Post(':id/click')
  @HttpCode(200)
  click(@Param('id') id: string) {
    return this.banners.click(id);
  }
}

@ApiTags('Quản trị · Banner')
@ApiBearerAuth()
@Staff()
@Controller('admin/banners')
export class AdminBannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  list(@Query() query: BannerQueryDto) {
    return this.banners.adminList(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.banners.get(id);
  }

  @Post()
  create(@Body() dto: CreateBannerDto) {
    return this.banners.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.banners.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.banners.remove(id);
  }
}

@Module({
  controllers: [BannersController, AdminBannersController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
