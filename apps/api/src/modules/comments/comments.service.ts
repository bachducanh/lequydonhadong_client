import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentStatus, Prisma } from '@prisma/client';
import { countsBy, insensitive, pageArgs, paged } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { publishedWhere } from '../posts/posts.service';
import { CommentQueryDto, CreateCommentDto, UpdateCommentDto } from './comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  publicList(slug: string) {
    return this.cache.wrap(`comments:${slug}`, 60, () =>
      this.prisma.comment.findMany({
        where: { status: CommentStatus.APPROVED, post: { slug } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, name: true, content: true, createdAt: true },
      }),
    );
  }

  async create(slug: string, dto: CreateCommentDto, ip: string) {
    const post = await this.prisma.post.findFirst({ where: { slug, ...publishedWhere() }, select: { id: true, allowComments: true } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (!post.allowComments) throw new BadRequestException('Bài viết này không nhận phản hồi');
    await this.prisma.comment.create({
      data: { postId: post.id, name: dto.name.trim(), email: dto.email?.trim() || null, content: dto.content.trim(), ip },
    });
    return { ok: true, message: 'Cảm ơn bạn. Phản hồi sẽ hiển thị sau khi nhà trường duyệt.' };
  }

  async adminList(query: CommentQueryDto) {
    const { page, limit, skip, take } = pageArgs(query);
    const base: Prisma.CommentWhereInput = {};
    if (query.postId) base.postId = query.postId;
    if (query.q) base.OR = [{ content: insensitive(query.q) }, { name: insensitive(query.q) }, { email: insensitive(query.q) }];
    const where = { ...base, ...(query.status ? { status: query.status } : {}) };
    const [data, total, groups, posts] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { post: { select: { id: true, title: true, slug: true } } },
      }),
      this.prisma.comment.count({ where }),
      this.prisma.comment.groupBy({ by: ['status'], where: base, _count: { _all: true }, orderBy: { status: 'asc' } }),
      this.prisma.post.findMany({
        where: { comments: { some: {} } },
        select: { id: true, title: true },
        orderBy: { publishedAt: 'desc' },
        take: 50,
      }),
    ]);
    return paged(data, total, page, limit, { counts: countsBy(groups, (g) => g.status), posts });
  }

  update(id: string, dto: UpdateCommentDto) {
    return this.prisma.comment.update({ where: { id }, data: { status: dto.status } });
  }

  async remove(id: string) {
    await this.prisma.comment.delete({ where: { id } });
    return { ok: true };
  }
}
