import { Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, Staff } from '../../common/decorators';
import { ReorderDto } from '../../common/reorder.dto';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { CreateSlideDto, UpdateSlideDto } from './slides.dto';

@Injectable()
export class SlidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  publicList() {
    return this.cache.wrap('slides', 120, () =>
      this.prisma.slide.findMany({ where: { visible: true }, orderBy: { order: 'asc' }, take: 6 }),
    );
  }

  async adminList() {
    return { data: await this.prisma.slide.findMany({ orderBy: { order: 'asc' } }) };
  }

  get(id: string) {
    return this.prisma.slide.findUniqueOrThrow({ where: { id } });
  }

  async create(dto: CreateSlideDto) {
    const last = await this.prisma.slide.aggregate({ _max: { order: true } });
    return this.prisma.slide.create({ data: { order: (last._max.order ?? 0) + 1, ...dto } });
  }

  update(id: string, dto: UpdateSlideDto) {
    return this.prisma.slide.update({ where: { id }, data: dto });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(ids.map((id, i) => this.prisma.slide.update({ where: { id }, data: { order: i + 1 } })));
    return { ok: true };
  }

  async remove(id: string) {
    await this.prisma.slide.delete({ where: { id } });
    return { ok: true };
  }
}

@ApiTags('Ảnh giới thiệu (slider)')
@Public()
@Controller('slides')
export class SlidesController {
  constructor(private readonly slides: SlidesService) {}

  @Get()
  list() {
    return this.slides.publicList();
  }
}

@ApiTags('Quản trị · Ảnh giới thiệu')
@ApiBearerAuth()
@Staff()
@Controller('admin/slides')
export class AdminSlidesController {
  constructor(private readonly slides: SlidesService) {}

  @Get()
  list() {
    return this.slides.adminList();
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.slides.reorder(dto.ids);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.slides.get(id);
  }

  @Post()
  create(@Body() dto: CreateSlideDto) {
    return this.slides.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSlideDto) {
    return this.slides.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.slides.remove(id);
  }
}

@Module({
  controllers: [SlidesController, AdminSlidesController],
  providers: [SlidesService],
  exports: [SlidesService],
})
export class SlidesModule {}
