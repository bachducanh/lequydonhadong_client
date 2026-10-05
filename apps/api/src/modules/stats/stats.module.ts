import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClubStatus, CommentStatus, FeedbackStatus, PostStatus, QuestionStatus, Role } from '@prisma/client';
import { Roles } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.module';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async badges() {
    const [comments, questions, feedbacks] = await Promise.all([
      this.prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
      this.prisma.question.count({ where: { status: QuestionStatus.PENDING } }),
      this.prisma.feedback.count({ where: { status: FeedbackStatus.NEW } }),
    ]);
    return { 'phan-hoi': comments, 'hoi-dap': questions, 'gop-y': feedbacks };
  }

  async dashboard() {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const [published, publishedWeek, pendingPosts, comments, questions, oldestQuestion, feedbacks, club, recentPosts] =
      await Promise.all([
        this.prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
        this.prisma.post.count({ where: { status: PostStatus.PUBLISHED, publishedAt: { gte: weekAgo } } }),
        this.prisma.post.count({ where: { status: PostStatus.PENDING } }),
        this.prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
        this.prisma.question.count({ where: { status: QuestionStatus.PENDING } }),
        this.prisma.question.findFirst({ where: { status: QuestionStatus.PENDING }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
        this.prisma.feedback.count({ where: { status: FeedbackStatus.NEW } }),
        this.prisma.clubMember.count({ where: { status: ClubStatus.PENDING } }),
        this.prisma.post.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: { id: true, title: true, slug: true, status: true, publishedAt: true, updatedAt: true, thumbnail: true },
        }),
      ]);
    return {
      posts: { published, publishedWeek, pending: pendingPosts },
      pending: { comments, questions, feedbacks, club, posts: pendingPosts },
      oldestQuestionAt: oldestQuestion?.createdAt ?? null,
      recentPosts,
    };
  }
}

@ApiTags('Quản trị · Thống kê')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.EDITOR, Role.TEACHER)
@Controller('admin/stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  /** Số liệu bảng điều khiển */
  @Get()
  dashboard() {
    return this.stats.dashboard();
  }

  /** Số việc chờ xử lý hiển thị trên menu quản trị */
  @Get('badges')
  badges() {
    return this.stats.badges();
  }
}

@Module({
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
