import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientIp, Public, RateLimit, Staff } from '../../common/decorators';
import { CommentQueryDto, CreateCommentDto, UpdateCommentDto } from './comments.dto';
import { CommentsService } from './comments.service';

@ApiTags('Phản hồi bài viết')
@Public()
@Controller('posts/:slug/comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  /** Phản hồi đã duyệt của bài viết */
  @Get()
  list(@Param('slug') slug: string) {
    return this.comments.publicList(slug);
  }

  /** Gửi phản hồi (chờ duyệt) */
  @RateLimit(5, 600)
  @Post()
  create(@Param('slug') slug: string, @Body() dto: CreateCommentDto, @ClientIp() ip: string) {
    return this.comments.create(slug, dto, ip);
  }
}

@ApiTags('Quản trị · Phản hồi bài viết')
@ApiBearerAuth()
@Staff()
@Controller('admin/comments')
export class AdminCommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  list(@Query() query: CommentQueryDto) {
    return this.comments.adminList(query);
  }

  /** Duyệt / đánh dấu spam */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return this.comments.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.comments.remove(id);
  }
}
