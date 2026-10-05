import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';

@ApiTags('Hệ thống')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Get()
  async check() {
    const db = await this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
    const redis = await this.cache.ping();
    const body = { status: db ? 'ok' : 'error', db, redis, time: new Date().toISOString() };
    if (!db) throw new ServiceUnavailableException(body);
    return body;
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
