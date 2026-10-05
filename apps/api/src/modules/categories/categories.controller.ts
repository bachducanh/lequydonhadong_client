import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, Staff } from '../../common/decorators';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { CategoriesService } from './categories.service';

@ApiTags('Chuyên mục')
@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  /** Cây chuyên mục (danh sách phẳng, có depth) */
  @Get()
  list() {
    return this.categories.publicList();
  }
}

@ApiTags('Quản trị · Chuyên mục')
@ApiBearerAuth()
@Staff()
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.categories.adminList(q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.categories.get(id);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}
