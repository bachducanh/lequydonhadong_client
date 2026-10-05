import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, Staff } from '../../common/decorators';
import { ReorderDto } from '../../common/reorder.dto';
import { CreateTickerDto, UpdateTickerDto } from './tickers.dto';
import { TickersService } from './tickers.service';

@ApiTags('Chữ chạy')
@Public()
@Controller('tickers')
export class TickersController {
  constructor(private readonly tickers: TickersService) {}

  /** Các dòng đang chạy (tối đa 5) */
  @Get()
  list() {
    return this.tickers.publicList();
  }
}

@ApiTags('Quản trị · Chữ chạy')
@ApiBearerAuth()
@Staff()
@Controller('admin/tickers')
export class AdminTickersController {
  constructor(private readonly tickers: TickersService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.tickers.adminList(q);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.tickers.reorder(dto.ids);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.tickers.get(id);
  }

  @Post()
  create(@Body() dto: CreateTickerDto) {
    return this.tickers.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTickerDto) {
    return this.tickers.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tickers.remove(id);
  }
}
