import { Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FeedbackStatus, Prisma } from '@prisma/client';
import { ClientIp, Public, RateLimit, Staff } from '../../common/decorators';
import { countsBy, insensitive, pageArgs, paged } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.module';
import { CreateFeedbackDto, FeedbackQueryDto, UpdateFeedbackDto } from './feedbacks.dto';

@Injectable()
export class FeedbacksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFeedbackDto, ip: string) {
    await this.prisma.feedback.create({ data: { ...dto, phone: dto.phone || null, ip } });
    return { ok: true, message: 'Cảm ơn bạn đã góp ý. Nhà trường sẽ phản hồi trong 5 ngày làm việc.' };
  }

  async adminList(query: FeedbackQueryDto) {
    const { page, limit, skip, take } = pageArgs(query);
    const base: Prisma.FeedbackWhereInput = {};
    if (query.role) base.role = query.role;
    if (query.q) base.OR = [{ title: insensitive(query.q) }, { content: insensitive(query.q) }, { name: insensitive(query.q) }];
    const where = { ...base, ...(query.status ? { status: query.status } : {}) };
    const [data, total, groups] = await this.prisma.$transaction([
      this.prisma.feedback.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.feedback.count({ where }),
      this.prisma.feedback.groupBy({ by: ['status'], where: base, _count: { _all: true }, orderBy: { status: 'asc' } }),
    ]);
    return paged(data, total, page, limit, { counts: countsBy(groups, (g) => g.status) });
  }

  /** Mở xem góp ý mới thì tự chuyển sang "Đã xem". */
  async get(id: string) {
    const item = await this.prisma.feedback.findUniqueOrThrow({ where: { id } });
    if (item.status === FeedbackStatus.NEW) {
      return this.prisma.feedback.update({ where: { id }, data: { status: FeedbackStatus.SEEN } });
    }
    return item;
  }

  update(id: string, dto: UpdateFeedbackDto) {
    return this.prisma.feedback.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.feedback.delete({ where: { id } });
    return { ok: true };
  }
}

@ApiTags('Góp ý')
@Public()
@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacks: FeedbacksService) {}

  @RateLimit(3, 600)
  @Post()
  create(@Body() dto: CreateFeedbackDto, @ClientIp() ip: string) {
    return this.feedbacks.create(dto, ip);
  }
}

@ApiTags('Quản trị · Góp ý')
@ApiBearerAuth()
@Staff()
@Controller('admin/feedbacks')
export class AdminFeedbacksController {
  constructor(private readonly feedbacks: FeedbacksService) {}

  @Get()
  list(@Query() query: FeedbackQueryDto) {
    return this.feedbacks.adminList(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.feedbacks.get(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFeedbackDto) {
    return this.feedbacks.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feedbacks.remove(id);
  }
}

@Module({
  controllers: [FeedbacksController, AdminFeedbacksController],
  providers: [FeedbacksService],
})
export class FeedbacksModule {}
