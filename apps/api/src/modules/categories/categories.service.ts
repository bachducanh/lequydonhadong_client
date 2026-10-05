import { BadRequestException, Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { orNull, slugify, uniqueSlug } from '../../common/text';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

type CategoryWithCount = Category & { _count: { posts: number } };

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /** Danh sách phẳng theo thứ tự cây: cha trước, con lùi vào (depth). */
  private flatten(all: CategoryWithCount[]) {
    const byParent = new Map<string | null, CategoryWithCount[]>();
    for (const c of all) {
      const list = byParent.get(c.parentId) ?? [];
      list.push(c);
      byParent.set(c.parentId, list);
    }
    const ids = new Set(all.map((c) => c.id));
    const roots = all.filter((c) => !c.parentId || !ids.has(c.parentId));
    const out: (CategoryWithCount & { depth: number; parentName: string | null })[] = [];
    const walk = (nodes: CategoryWithCount[], depth: number, parentName: string | null) => {
      for (const n of nodes.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'vi'))) {
        out.push({ ...n, depth, parentName });
        walk(byParent.get(n.id) ?? [], depth + 1, n.name);
      }
    };
    walk(roots, 0, null);
    return out;
  }

  private loadAll() {
    return this.prisma.category.findMany({ include: { _count: { select: { posts: true } } } });
  }

  publicList() {
    return this.cache.wrap('categories', 300, async () =>
      this.flatten(await this.loadAll()).map(({ id, name, slug, parentId, depth, showInMenu, order, description }) => ({
        id, name, slug, parentId, depth, showInMenu, order, description,
      })),
    );
  }

  async adminList(q?: string) {
    const rows = this.flatten(await this.loadAll());
    if (!q) return { data: rows };
    const needle = q.toLowerCase();
    return { data: rows.filter((r) => r.name.toLowerCase().includes(needle) || r.slug.includes(needle)) };
  }

  /** Id của chuyên mục theo slug cùng mọi chuyên mục con cháu. */
  async descendantIds(slug: string): Promise<string[]> {
    const all = await this.cache.wrap('categories:tree', 300, () =>
      this.prisma.category.findMany({ select: { id: true, slug: true, parentId: true } }),
    );
    const root = all.find((c) => c.slug === slug);
    if (!root) return [];
    const ids = [root.id];
    for (let i = 0; i < ids.length; i++) {
      for (const c of all) if (c.parentId === ids[i]) ids.push(c.id);
    }
    return ids;
  }

  get(id: string) {
    return this.prisma.category.findUniqueOrThrow({ where: { id } });
  }

  async create(dto: CreateCategoryDto) {
    const slug = await uniqueSlug(dto.slug || dto.name, async (s) => !!(await this.prisma.category.findUnique({ where: { slug: s } })));
    return this.prisma.category.create({
      data: { ...dto, slug, parentId: orNull(dto.parentId), description: orNull(dto.description) },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const parentId = orNull(dto.parentId);
    if (parentId && (await this.descendantIdsById(id)).includes(parentId)) {
      throw new BadRequestException('Không thể chọn chuyên mục con làm chuyên mục cha');
    }
    let slug: string | undefined;
    if (dto.slug !== undefined) {
      const wanted = slugify(dto.slug || dto.name || 'chuyen-muc');
      slug = await uniqueSlug(wanted, async (s) => {
        const found = await this.prisma.category.findUnique({ where: { slug: s } });
        return !!found && found.id !== id;
      });
    }
    return this.prisma.category.update({
      where: { id },
      data: { ...dto, slug, parentId, description: orNull(dto.description) },
    });
  }

  async remove(id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  private async descendantIdsById(id: string) {
    const all = await this.prisma.category.findMany({ select: { id: true, parentId: true } });
    const ids = [id];
    for (let i = 0; i < ids.length; i++) for (const c of all) if (c.parentId === ids[i]) ids.push(c.id);
    return ids;
  }
}
