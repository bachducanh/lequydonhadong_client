import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS } from './redis.constants';

/**
 * Lớp bọc Redis: cache dữ liệu công khai, đếm giới hạn tần suất, lưu refresh token.
 *
 * Cache dùng "phiên bản" chung: mọi thao tác ghi ở /admin tăng `cache:version`,
 * nên toàn bộ khoá cũ tự hết hiệu lực mà không phải xoá từng khoá.
 * Nếu Redis không sẵn sàng, cache bị bỏ qua và dữ liệu đọc thẳng từ Postgres.
 */
@Injectable()
export class CacheService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  private get ready() {
    return this.redis.status === 'ready';
  }

  async wrap<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    if (!this.ready) return fn();
    let fullKey: string | null = null;
    try {
      const version = (await this.redis.get('cache:version')) ?? '0';
      fullKey = `cache:${version}:${key}`;
      const hit = await this.redis.get(fullKey);
      if (hit) return JSON.parse(hit) as T;
    } catch {
      return fn();
    }
    const value = await fn();
    if (fullKey) this.redis.set(fullKey, JSON.stringify(value), 'EX', ttlSeconds).catch(() => undefined);
    return value;
  }

  async bump() {
    if (!this.ready) return;
    await this.redis.incr('cache:version').catch(() => undefined);
  }

  /** Tăng bộ đếm trong cửa sổ thời gian; trả về 0 nếu Redis lỗi (không chặn người dùng). */
  async hit(key: string, windowSeconds: number): Promise<number> {
    if (!this.ready) return 0;
    try {
      const n = await this.redis.incr(key);
      if (n === 1) await this.redis.expire(key, windowSeconds);
      return n;
    } catch {
      return 0;
    }
  }

  /** Đặt khoá nếu chưa tồn tại — dùng để chống đếm trùng lượt xem. */
  async once(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.ready) return true;
    try {
      return (await this.redis.set(key, '1', 'EX', ttlSeconds, 'NX')) === 'OK';
    } catch {
      return true;
    }
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.redis.set(key, value, 'EX', ttlSeconds);
  }

  async del(key: string) {
    await this.redis.del(key);
  }

  async ping() {
    try {
      return (await this.redis.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
