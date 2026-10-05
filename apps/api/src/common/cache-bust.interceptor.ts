import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { concatMap } from 'rxjs';
import { CacheService } from '../redis/cache.service';

/** Sau mỗi thao tác ghi thành công ở /admin, làm mới toàn bộ cache dữ liệu công khai. */
@Injectable()
export class CacheBustInterceptor implements NestInterceptor {
  constructor(private readonly cache: CacheService) {}

  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest<Request>();
    const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.path.includes('/admin/');
    return next.handle().pipe(
      concatMap(async (value: unknown) => {
        if (mutating) await this.cache.bump();
        return value;
      }),
    );
  }
}
