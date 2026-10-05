import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus, Prisma, Role } from '@prisma/client';
import { AuthUser } from '../../common/decorators';
import { countsBy, insensitive, pageArgs, paged } from '../../common/pagination';
import { orNull, sanitizeContent, slugify, toDate, uniqueSlug } from '../../common/text';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { CategoriesService } from '../categories/categories.service';
import { AdminPostQueryDto, CreatePostDto, PostQueryDto, UpdatePostDto } from './posts.dto';

/** Trường dùng cho thẻ tin (danh sách, trang chủ, tin liên quan). */
export const postCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  thumbnail: true,
  publishedAt: true,
  views: true,
  featured: true,
  badge: true,
  badgeTone: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.PostSelect;

export const publishedWhere = (): Prisma.PostWhereInput => ({
  status: PostStatus.PUBLISHED,
  publishedAt: { lte: new Date() },
});

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly categories: CategoriesService,
  ) {}

  /* ---------- Công khai ---------- */

  publicList(query: PostQueryDto) {
    return this.cache.wrap(`posts:${JSON.stringify(query)}`, 60, async () => {
      const { page, limit, skip, take } = pageArgs(query, 12);
      const where: Prisma.PostWhereInput = publishedWhere();
      const and: Prisma.PostWhereInput[] = [];
      if (query.category) and.push({ categoryId: { in: await this.categories.descendantIds(query.category) } });
      if (query.exclude) {
        const ids = await this.categories.descendantIds(query.exclude);
        if (ids.length) and.push({ OR: [{ categoryId: null }, { categoryId: { notIn: ids } }] });
      }
      if (query.q) and.push({ OR: [{ title: insensitive(query.q) }, { excerpt: insensitive(query.q) }] });
      if (query.featured !== undefined) where.featured = query.featured;
      if (and.length) where.AND = and;
      const orderBy: Prisma.PostOrderByWithRelationInput[] =
        query.sort === 'popular' ? [{ views: 'desc' }, { publishedAt: 'desc' }] : [{ publishedAt: 'desc' }];
      const [data, total] = await this.prisma.$transaction([
        this.prisma.post.findMany({ where, skip, take, orderBy, select: postCardSelect }),
        this.prisma.post.count({ where }),
      ]);
      return paged(data, total, page, limit);
    });
  }

  async publicDetail(slug: string) {
    const post = await this.cache.wrap(`post:${slug}`, 60, () =>
      this.prisma.post.findFirst({
        where: { slug, ...publishedWhere() },
        select: {
          ...postCardSelect,
          content: true,
          imageCaption: true,
          allowComments: true,
          authorName: true,
          updatedAt: true,
          author: { select: { fullName: true } },
          category: { select: { id: true, name: true, slug: true, parent: { select: { name: true, slug: true } } } },
        },
      }),
    );
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    const { author, authorName, ...rest } = post;
    return { ...rest, authorName: authorName || author?.fullName || 'Nhà trường' };
  }

  related(slug: string, limit = 3) {
    return this.cache.wrap(`post:${slug}:related`, 120, async () => {
      const post = await this.prisma.post.findUnique({ where: { slug }, select: { id: true, categoryId: true } });
      if (!post) return [];
      return this.prisma.post.findMany({
        where: { ...publishedWhere(), id: { not: post.id }, ...(post.categoryId ? { categoryId: post.categoryId } : {}) },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        select: postCardSelect,
      });
    });
  }

  /** Đếm lượt xem; mỗi IP chỉ tính 1 lần / giờ / bài. */
  async view(slug: string, ip: string) {
    const post = await this.prisma.post.findUnique({ where: { slug }, select: { id: true } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (await this.cache.once(`view:${post.id}:${ip}`, 3600)) {
      await this.prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
    }
    return { ok: true };
  }

  /* ---------- Quản trị ---------- */

  async adminList(query: AdminPostQueryDto, user: AuthUser) {
    const { page, limit, skip, take } = pageArgs(query);
    const base: Prisma.PostWhereInput = {};
    if (user.role === Role.TEACHER) base.authorId = user.id;
    else if (query.authorId) base.authorId = query.authorId;
    if (query.categoryId) base.categoryId = query.categoryId;
    if (query.q) base.OR = [{ title: insensitive(query.q) }, { slug: insensitive(query.q) }];
    const where = { ...base, ...(query.status ? { status: query.status } : {}) };
    const [data, total, groups] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip,
        take,
        orderBy: [{ updatedAt: 'desc' }],
        select: {
          ...postCardSelect,
          status: true,
          authorName: true,
          updatedAt: true,
          createdAt: true,
          author: { select: { id: true, fullName: true } },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.post.count({ where }),
      this.prisma.post.groupBy({ by: ['status'], where: base, _count: { _all: true }, orderBy: { status: 'asc' } }),
    ]);
    return paged(data, total, page, limit, { counts: countsBy(groups, (g) => g.status) });
  }

  async adminGet(id: string, user: AuthUser) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true } }, author: { select: { id: true, fullName: true } } },
    });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    this.assertCanEdit(post.authorId, user);
    return post;
  }

  async create(dto: CreatePostDto, user: AuthUser) {
    const status = this.allowedStatus(dto.status ?? PostStatus.DRAFT, user);
    const slug = await this.uniquePostSlug(dto.slug || dto.title);
    const { pushToTicker, ...data } = dto;
    const post = await this.prisma.post.create({
      data: {
        ...data,
        slug,
        status,
        content: sanitizeContent(dto.content ?? ''),
        categoryId: orNull(dto.categoryId),
        publishedAt: toDate(dto.publishedAt) ?? (status === PostStatus.PUBLISHED ? new Date() : null),
        authorId: user.id,
        authorName: orNull(dto.authorName),
      },
    });
    if (pushToTicker) await this.pushToTicker(post.title, post.slug);
    return post;
  }

  async update(id: string, dto: UpdatePostDto, user: AuthUser) {
    const current = await this.prisma.post.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Không tìm thấy bài viết');
    this.assertCanEdit(current.authorId, user);
    const status = dto.status ? this.allowedStatus(dto.status, user) : undefined;
    let slug: string | undefined;
    if (dto.slug !== undefined && slugify(dto.slug || current.title) !== current.slug) {
      slug = await this.uniquePostSlug(dto.slug || current.title, id);
    }
    // Bài đã đăng luôn có ngày đăng (giữ ngày cũ nếu ô ngày bị xoá trống)
    let publishedAt = toDate(dto.publishedAt);
    if ((status ?? current.status) === PostStatus.PUBLISHED && !publishedAt) {
      publishedAt = publishedAt === undefined && current.publishedAt ? undefined : (current.publishedAt ?? new Date());
    }
    const { pushToTicker, ...data } = dto;
    const post = await this.prisma.post.update({
      where: { id },
      data: {
        ...data,
        slug,
        status,
        publishedAt,
        content: dto.content !== undefined ? sanitizeContent(dto.content) : undefined,
        categoryId: orNull(dto.categoryId),
        authorName: orNull(dto.authorName),
      },
    });
    if (pushToTicker) await this.pushToTicker(post.title, post.slug);
    return post;
  }

  async remove(id: string, user: AuthUser) {
    const current = await this.prisma.post.findUnique({ where: { id }, select: { authorId: true } });
    if (!current) throw new NotFoundException('Không tìm thấy bài viết');
    this.assertCanEdit(current.authorId, user);
    await this.prisma.post.delete({ where: { id } });
    return { ok: true };
  }

  /** Giáo viên chỉ gửi bài chờ duyệt, không tự đăng. */
  private allowedStatus(status: PostStatus, user: AuthUser) {
    if (user.role === Role.TEACHER && status === PostStatus.PUBLISHED) return PostStatus.PENDING;
    return status;
  }

  private assertCanEdit(authorId: string | null, user: AuthUser) {
    if (user.role === Role.TEACHER && authorId !== user.id) {
      throw new ForbiddenException('Giáo viên chỉ được sửa bài viết của mình');
    }
  }

  private uniquePostSlug(base: string, ignoreId?: string) {
    return uniqueSlug(
      base,
      async (s) => {
        const found = await this.prisma.post.findUnique({ where: { slug: s }, select: { id: true } });
        return !!found && found.id !== ignoreId;
      },
      'bai-viet',
    );
  }

  private async pushToTicker(title: string, slug: string) {
    const link = `/tin-tuc/${slug}`;
    const exists = await this.prisma.tickerItem.findFirst({ where: { link } });
    if (exists) return;
    const now = new Date();
    await this.prisma.tickerItem.create({
      data: { text: title.slice(0, 80), link, startAt: now, endAt: new Date(now.getTime() + 14 * 86_400_000), order: -1 },
    });
  }
}
