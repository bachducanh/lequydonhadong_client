import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /** Từ khoá tìm kiếm */
  @IsOptional()
  @IsString()
  q?: string;
}

export function pageArgs(query: PageQueryDto, defaultLimit = 20) {
  const page = query.page ?? 1;
  const limit = query.limit ?? defaultLimit;
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export interface Paged<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number; [key: string]: unknown };
}

export function paged<T>(data: T[], total: number, page: number, limit: number, extra: Record<string, unknown> = {}): Paged<T> {
  return { data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), ...extra } };
}

/** Chuyển kết quả groupBy thành { ALL, <giá trị>: số lượng } cho các tab lọc. */
export function countsBy<R extends { _count?: unknown }>(rows: R[], key: (row: R) => string | null) {
  const counts: Record<string, number> = { ALL: 0 };
  for (const row of rows) {
    const n = (row._count as { _all?: number } | undefined)?._all ?? 0;
    counts[key(row) ?? 'NONE'] = n;
    counts.ALL += n;
  }
  return counts;
}

/** Query string "true"/"false" -> boolean (không dùng ép kiểu ngầm vì "false" sẽ thành true). */
export const ToBoolean = () =>
  Transform(({ value }) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return value;
  });

export const insensitive = (q: string) => ({ contains: q.trim(), mode: 'insensitive' as const });
