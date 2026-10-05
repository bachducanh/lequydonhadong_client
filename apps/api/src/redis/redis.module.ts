import { Global, Inject, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';
import { REDIS } from './redis.constants';

export { REDIS };

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('Redis');
        const client = new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
          maxRetriesPerRequest: 1,
        });
        let lastLog = 0;
        client.on('error', (err) => {
          // Tránh spam log khi Redis tạm mất kết nối; API vẫn chạy, chỉ mất cache
          if (Date.now() - lastLog > 60_000) {
            lastLog = Date.now();
            logger.warn(`Không kết nối được Redis: ${err.message}`);
          }
        });
        client.on('ready', () => logger.log('Đã kết nối Redis'));
        return client;
      },
    },
    CacheService,
  ],
  exports: [REDIS, CacheService],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onApplicationShutdown() {
    await this.redis.quit().catch(() => undefined);
  }
}
