import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query, Redirect } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma, Role } from '@prisma/client';
import { Public, Roles, Staff } from '../../common/decorators';
import { insensitive, pageArgs, paged } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { CreateDownloadDto, DownloadQueryDto, UpdateDownloadDto } from './downloads.dto';

@Injectable()
export class DownloadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private async list(query: DownloadQueryDto, base: Prisma.DownloadFileWhereInput) {
    const { page, limit, skip, take } = pageArgs(query);
    const where: Prisma.DownloadFileWhereInput = { ...base };
    if (query.category) where.category = query.category;
    if (query.ext) where.fileName = { endsWith: `.${query.ext.toLowerCase()}`, mode: 'insensitive' };
    if (query.q) where.OR = [{ name: insensitive(query.q) }, { fileName: insensitive(query.q) }];
    const [data, total, categories] = await this.prisma.$transaction([
      this.prisma.downloadFile.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.downloadFile.count({ where }),
      this.prisma.downloadFile.findMany({ distinct: ['category'], select: { category: true }, where: base, orderBy: { category: 'asc' } }),
    ]);
    return paged(data, total, page, limit, { categories: categories.map((c) => c.category) });
  }

  publicList(query: DownloadQueryDto) {
    return this.cache.wrap(`downloads:${JSON.stringify(query)}`, 120, () => this.list(query, { visible: true }));
  }

  adminList(query: DownloadQueryDto) {
    return this.list(query, {});
  }

  /** Tăng lượt tải và trả về đường dẫn tệp. */
  async hit(id: string) {
    const file = await this.prisma.downloadFile.findFirst({ where: { id, visible: true } });
    if (!file?.fileUrl) throw new NotFoundException('Tệp không tồn tại');
    await this.prisma.downloadFile.update({ where: { id }, data: { downloads: { increment: 1 } } });
    return file.fileUrl;
  }

  get(id: string) {
    return this.prisma.downloadFile.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateDownloadDto) {
    return this.prisma.downloadFile.create({ data: dto });
  }

  update(id: string, dto: UpdateDownloadDto) {
    return this.prisma.downloadFile.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.downloadFile.delete({ where: { id } });
    return { ok: true };
  }
}

@ApiTags('Tài liệu tải về')
@Public()
@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloads: DownloadsService) {}

  @Get()
  list(@Query() query: DownloadQueryDto) {
    return this.downloads.publicList(query);
  }

  /** Chuyển hướng tới tệp và tăng lượt tải */
  @Get(':id/file')
  @Redirect()
  async file(@Param('id') id: string) {
    return { url: await this.downloads.hit(id), statusCode: 302 };
  }
}

@ApiTags('Quản trị · File download')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.EDITOR, Role.TEACHER)
@Controller('admin/downloads')
export class AdminDownloadsController {
  constructor(private readonly downloads: DownloadsService) {}

  @Get()
  list(@Query() query: DownloadQueryDto) {
    return this.downloads.adminList(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.downloads.get(id);
  }

  @Post()
  create(@Body() dto: CreateDownloadDto) {
    return this.downloads.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDownloadDto) {
    return this.downloads.update(id, dto);
  }

  @Staff()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.downloads.remove(id);
  }
}

@Module({
  controllers: [DownloadsController, AdminDownloadsController],
  providers: [DownloadsService],
  exports: [DownloadsService],
})
export class DownloadsModule {}
