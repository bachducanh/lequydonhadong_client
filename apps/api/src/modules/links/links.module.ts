import { Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LinkPosition, Prisma } from '@prisma/client';
import { Public, Staff } from '../../common/decorators';
import { insensitive } from '../../common/pagination';
import { ReorderDto } from '../../common/reorder.dto';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { CreateLinkDto, LinkQueryDto, UpdateLinkDto } from './links.dto';

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  publicList(position?: LinkPosition) {
    return this.cache.wrap(`links:${position ?? 'all'}`, 300, () =>
      this.prisma.link.findMany({
        where: { visible: true, ...(position ? { position } : {}) },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, url: true, sub: true, icon: true, position: true, openNewTab: true },
      }),
    );
  }

  async adminList(query: LinkQueryDto) {
    const where: Prisma.LinkWhereInput = {};
    if (query.position) where.position = query.position;
    if (query.q) where.name = insensitive(query.q);
    return { data: await this.prisma.link.findMany({ where, orderBy: { order: 'asc' } }) };
  }

  get(id: string) {
    return this.prisma.link.findUniqueOrThrow({ where: { id } });
  }

  async create(dto: CreateLinkDto) {
    const last = await this.prisma.link.aggregate({ _max: { order: true } });
    return this.prisma.link.create({ data: { order: (last._max.order ?? 0) + 1, ...dto } });
  }

  update(id: string, dto: UpdateLinkDto) {
    return this.prisma.link.update({ where: { id }, data: dto });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(ids.map((id, i) => this.prisma.link.update({ where: { id }, data: { order: i + 1 } })));
    return { ok: true };
  }

  async remove(id: string) {
    await this.prisma.link.delete({ where: { id } });
    return { ok: true };
  }
}

@ApiTags('Liên kết')
@Public()
@Controller('links')
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Get()
  list(@Query() query: LinkQueryDto) {
    return this.links.publicList(query.position);
  }
}

@ApiTags('Quản trị · Liên kết')
@ApiBearerAuth()
@Staff()
@Controller('admin/links')
export class AdminLinksController {
  constructor(private readonly links: LinksService) {}

  @Get()
  list(@Query() query: LinkQueryDto) {
    return this.links.adminList(query);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.links.reorder(dto.ids);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.links.get(id);
  }

  @Post()
  create(@Body() dto: CreateLinkDto) {
    return this.links.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLinkDto) {
    return this.links.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.links.remove(id);
  }
}

@Module({
  controllers: [LinksController, AdminLinksController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}
