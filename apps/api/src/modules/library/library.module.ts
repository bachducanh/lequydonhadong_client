import { Body, Controller, Delete, Get, Module, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public, Roles, Staff } from '../../common/decorators';
import {
  CreateLibraryItemDto,
  CreateLibraryTypeDto,
  LibraryItemQueryDto,
  UpdateLibraryItemDto,
  UpdateLibraryTypeDto,
} from './library.dto';
import { LibraryService } from './library.service';

@ApiTags('Thư viện')
@Public()
@Controller()
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  @Get('library-types')
  types() {
    return this.library.publicTypes();
  }

  @Get('library-items')
  items(@Query() query: LibraryItemQueryDto) {
    return this.library.publicItems(query);
  }
}

@ApiTags('Quản trị · Kiểu thư viện')
@ApiBearerAuth()
@Staff()
@Controller('admin/library-types')
export class AdminLibraryTypesController {
  constructor(private readonly library: LibraryService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.library.adminTypes(q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.library.getType(id);
  }

  @Post()
  create(@Body() dto: CreateLibraryTypeDto) {
    return this.library.createType(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLibraryTypeDto) {
    return this.library.updateType(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.library.removeType(id);
  }
}

@ApiTags('Quản trị · Thư viện')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.EDITOR, Role.TEACHER)
@Controller('admin/library-items')
export class AdminLibraryItemsController {
  constructor(private readonly library: LibraryService) {}

  @Get()
  list(@Query() query: LibraryItemQueryDto) {
    return this.library.adminItems(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.library.getItem(id);
  }

  @Post()
  create(@Body() dto: CreateLibraryItemDto) {
    return this.library.createItem(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLibraryItemDto) {
    return this.library.updateItem(id, dto);
  }

  @Staff()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.library.removeItem(id);
  }
}

@Module({
  controllers: [LibraryController, AdminLibraryTypesController, AdminLibraryItemsController],
  providers: [LibraryService],
})
export class LibraryModule {}
