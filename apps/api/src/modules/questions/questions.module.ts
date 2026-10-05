import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma, QuestionStatus } from '@prisma/client';
import { AuthUser, ClientIp, CurrentUser, Public, RateLimit, Staff } from '../../common/decorators';
import { countsBy, insensitive, pageArgs, paged } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { AnswerQuestionDto, AskQuestionDto, QuestionQueryDto } from './questions.dto';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  publicList(query: QuestionQueryDto) {
    return this.cache.wrap(`questions:${JSON.stringify(query)}`, 120, async () => {
      const { page, limit, skip, take } = pageArgs(query, 10);
      const base: Prisma.QuestionWhereInput = { status: QuestionStatus.ANSWERED };
      if (query.q) base.OR = [{ question: insensitive(query.q) }, { answer: insensitive(query.q) }];
      const where = { ...base, ...(query.topic ? { topic: query.topic } : {}) };
      const [data, total, groups] = await this.prisma.$transaction([
        this.prisma.question.findMany({
          where,
          skip,
          take,
          orderBy: { answeredAt: 'desc' },
          select: { id: true, question: true, askerName: true, topic: true, answer: true, answeredBy: true, answeredAt: true, createdAt: true },
        }),
        this.prisma.question.count({ where }),
        this.prisma.question.groupBy({ by: ['topic'], where: base, _count: { _all: true }, orderBy: { topic: 'asc' } }),
      ]);
      return paged(data, total, page, limit, { counts: countsBy(groups, (g) => g.topic) });
    });
  }

  async ask(dto: AskQuestionDto, ip: string) {
    await this.prisma.question.create({
      data: {
        askerName: dto.askerName.trim(),
        askerRole: dto.askerRole?.trim() || null,
        askerEmail: dto.askerEmail?.trim() || null,
        topic: dto.topic,
        question: dto.question.trim(),
        ip,
      },
    });
    return { ok: true, message: 'Nhà trường đã nhận câu hỏi và sẽ trả lời trong thời gian sớm nhất.' };
  }

  async adminList(query: QuestionQueryDto) {
    const { page, limit, skip, take } = pageArgs(query);
    const base: Prisma.QuestionWhereInput = {};
    if (query.topic) base.topic = query.topic;
    if (query.q) base.OR = [{ question: insensitive(query.q) }, { askerName: insensitive(query.q) }];
    const where = { ...base, ...(query.status ? { status: query.status } : {}) };
    const [data, total, groups] = await this.prisma.$transaction([
      this.prisma.question.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.question.count({ where }),
      this.prisma.question.groupBy({ by: ['status'], where: base, _count: { _all: true }, orderBy: { status: 'asc' } }),
    ]);
    return paged(data, total, page, limit, { counts: countsBy(groups, (g) => g.status) });
  }

  get(id: string) {
    return this.prisma.question.findUniqueOrThrow({ where: { id } });
  }

  async answer(id: string, dto: AnswerQuestionDto, user: AuthUser) {
    const data: Prisma.QuestionUpdateInput = { ...dto };
    if (dto.status === QuestionStatus.ANSWERED) {
      const current = await this.prisma.question.findUniqueOrThrow({ where: { id } });
      const answer = dto.answer ?? current.answer;
      if (!answer?.trim()) throw new BadRequestException('Vui lòng nhập câu trả lời trước khi xuất bản');
      data.answeredAt = current.answeredAt ?? new Date();
      data.answeredBy = dto.answeredBy || current.answeredBy || user.name;
    }
    return this.prisma.question.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.question.delete({ where: { id } });
    return { ok: true };
  }
}

@ApiTags('Hỏi đáp')
@Public()
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  /** Câu hỏi đã được trả lời */
  @Get()
  list(@Query() query: QuestionQueryDto) {
    return this.questions.publicList(query);
  }

  /** Gửi câu hỏi mới (chờ trả lời) */
  @RateLimit(5, 600)
  @Post()
  ask(@Body() dto: AskQuestionDto, @ClientIp() ip: string) {
    return this.questions.ask(dto, ip);
  }
}

@ApiTags('Quản trị · Hỏi đáp')
@ApiBearerAuth()
@Staff()
@Controller('admin/questions')
export class AdminQuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  list(@Query() query: QuestionQueryDto) {
    return this.questions.adminList(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.questions.get(id);
  }

  /** Trả lời / đổi chủ đề / xuất bản (status = ANSWERED) */
  @Patch(':id')
  answer(@Param('id') id: string, @Body() dto: AnswerQuestionDto, @CurrentUser() user: AuthUser) {
    return this.questions.answer(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questions.remove(id);
  }
}

@Module({
  controllers: [QuestionsController, AdminQuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}
