import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthUser, ClientIp, CurrentUser, Public, RateLimit, Roles } from '../../common/decorators';
import { AdminPostQueryDto, CreatePostDto, PostQueryDto, UpdatePostDto } from './posts.dto';
import { PostsService } from './posts.service';

@ApiTags('Tin bài')
@Public()
@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  /** Danh sách bài đã đăng; lọc theo chuyên mục, từ khoá, nổi bật; sắp xếp mới nhất/xem nhiều. */
  @Get()
  list(@Query() query: PostQueryDto) {
    return this.posts.publicList(query);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.posts.publicDetail(slug);
  }

  @Get(':slug/related')
  related(@Param('slug') slug: string) {
    return this.posts.related(slug);
  }

  @RateLimit(60, 60)
  @Post(':slug/view')
  @HttpCode(200)
  view(@Param('slug') slug: string, @ClientIp() ip: string) {
    return this.posts.view(slug, ip);
  }
}

@ApiTags('Quản trị · Tin bài')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.EDITOR, Role.TEACHER)
@Controller('admin/posts')
export class AdminPostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  list(@Query() query: AdminPostQueryDto, @CurrentUser() user: AuthUser) {
    return this.posts.adminList(query, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.adminGet(id, user);
  }

  @Post()
  create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
    return this.posts.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto, @CurrentUser() user: AuthUser) {
    return this.posts.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.remove(id, user);
  }
}
