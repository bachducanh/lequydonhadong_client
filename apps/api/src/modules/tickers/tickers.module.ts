import { Module } from '@nestjs/common';
import { AdminTickersController, TickersController } from './tickers.controller';
import { TickersService } from './tickers.service';

@Module({
  controllers: [TickersController, AdminTickersController],
  providers: [TickersService],
  exports: [TickersService],
})
export class TickersModule {}
