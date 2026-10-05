import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, Staff } from '../../common/decorators';
import { CreateLegalDocDto, LegalDocQueryDto, UpdateLegalDocDto } from './legal-documents.dto';
import { LegalDocumentsService } from './legal-documents.service';

@ApiTags('Văn bản pháp quy')
@Public()
@Controller('legal-documents')
export class LegalDocumentsController {
  constructor(private readonly docs: LegalDocumentsService) {}

  @Get()
  list(@Query() query: LegalDocQueryDto) {
    return this.docs.publicList(query);
  }
}

@ApiTags('Quản trị · Văn bản pháp quy')
@ApiBearerAuth()
@Staff()
@Controller('admin/legal-documents')
export class AdminLegalDocumentsController {
  constructor(private readonly docs: LegalDocumentsService) {}

  @Get()
  list(@Query() query: LegalDocQueryDto) {
    return this.docs.adminList(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.docs.get(id);
  }

  @Post()
  create(@Body() dto: CreateLegalDocDto) {
    return this.docs.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLegalDocDto) {
    return this.docs.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.docs.remove(id);
  }
}
