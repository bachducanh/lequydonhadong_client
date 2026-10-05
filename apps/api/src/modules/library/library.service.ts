import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { countsBy, insensitive, pageArgs, paged } from '../../common/pagination';
import { uniqueSlug } from '../../common/text';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import {
  CreateLibraryItemDto,
  CreateLibraryTypeDto,
  LibraryItemQueryDto,
  UpdateLibraryItemDto,
  UpdateLibraryTypeDto,
} from './library.dto';

@Injectable()
export class LibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /* ---------- Kiểu thư viện ---------- */

  publicTypes() {
    return this.cache.wrap('library:types', 300, async () => {
      const types = await this.prisma.libraryType.findMany({
        where: { visible: true },
        orderBy: { order: 'asc' },
        include: { _count: { select: { items: { where: { visible: true } } } } },
      });
      return types.map(({ _count, ...t }) => ({ ...t, itemCount: _count.items }));
    });
  }

  async adminTypes(q?: string) {
    const types = await this.prisma.libraryType.findMany({
      where: q ? { name: insensitive(q) } : {},
      orderBy: { order: 'asc' },
      include: { _count: { select: { items: true } } },
    });
    return { data: types.map(({ _count, ...t }) => ({ ...t, itemCount: _count.items })) };
  }

  getType(id: string) {
    return this.prisma.libraryType.findUniqueOrThrow({ where: { id } });
  }

  async createType(dto: CreateLibraryTypeDto) {
    const slug = await uniqueSlug(dto.slug || dto.name, async (s) => !!(await this.prisma.libraryType.findUnique({ where: { slug: s } })));
    return this.prisma.libraryType.create({ data: { ...dto, slug } });
  }

  async updateType(id: string, dto: UpdateLibraryTypeDto) {
    const slug = dto.slug
      ? await uniqueSlug(dto.slug, async (s) => {
          const found = await this.prisma.libraryType.findUnique({ where: { slug: s } });
          return !!found && found.id !== id;
        })
      : undefined;
    return this.prisma.libraryType.update({ where: { id }, data: { ...dto, slug } });
  }

  async removeType(id: string) {
    await this.prisma.libraryType.delete({ where: { id } });
    return { ok: true };
  }

  /* ---------- Mục thư viện ---------- */

  private async items(query: LibraryItemQueryDto, base: Prisma.LibraryItemWhereInput) {
    const { page, limit, skip, take } = pageArgs(query, 12);
    if (query.q) base = { ...base, title: insensitive(query.q) };
    const where: Prisma.LibraryItemWhereInput = { ...base };
    if (query.typeId) where.typeId = query.typeId;
    if (query.type) where.type = { slug: query.type };
    const [data, total, groups] = await this.prisma.$transaction([
      this.prisma.libraryItem.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { type: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.libraryItem.count({ where }),
      this.prisma.libraryItem.groupBy({ by: ['typeId'], where: base, _count: { _all: true }, orderBy: { typeId: 'asc' } }),
    ]);
    return paged(data, total, page, limit, { counts: countsBy(groups, (g) => g.typeId) });
  }

  publicItems(query: LibraryItemQueryDto) {
    return this.cache.wrap(`library:items:${JSON.stringify(query)}`, 120, () =>
      this.items(query, { visible: true, type: { visible: true } }),
    );
  }

  adminItems(query: LibraryItemQueryDto) {
    return this.items(query, {});
  }

  getItem(id: string) {
    return this.prisma.libraryItem.findUniqueOrThrow({ where: { id }, include: { type: true } });
  }

  createItem(dto: CreateLibraryItemDto) {
    return this.prisma.libraryItem.create({ data: dto });
  }

  updateItem(id: string, dto: UpdateLibraryItemDto) {
    return this.prisma.libraryItem.update({ where: { id }, data: dto });
  }

  async removeItem(id: string) {
    await this.prisma.libraryItem.delete({ where: { id } });
    return { ok: true };
  }
}
