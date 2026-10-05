/**
 * Gọi API từ máy chủ Next.js (Server Components). Không import vào Client Component.
 * Dữ liệu công khai đã được API cache bằng Redis nên ở đây luôn lấy bản mới (no-store).
 */
import { notFound } from 'next/navigation';

export const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export async function apiGet<T>(path: string, query?: Query): Promise<T> {
  const url = new URL(`/api/v1${path}`, API_URL);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(res.status, body?.message ?? res.statusText);
  }
  return (await res.json()) as T;
}

/** Trả về dữ liệu dự phòng khi API lỗi để trang vẫn hiển thị được. */
export async function apiSafe<T>(path: string, query: Query | undefined, fallback: T): Promise<T> {
  try {
    return await apiGet<T>(path, query);
  } catch (e) {
    console.error(`[api] ${path}:`, e instanceof Error ? e.message : e);
    return fallback;
  }
}

/** Dùng cho trang chi tiết: 404 từ API -> trang không tìm thấy. */
export async function apiOr404<T>(path: string, query?: Query): Promise<T> {
  try {
    return await apiGet<T>(path, query);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export const emptyPage = <T,>() => ({ data: [] as T[], meta: { page: 1, limit: 12, total: 0, totalPages: 1 } });

export function pick(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = searchParams[key];
  return Array.isArray(v) ? v[0] : v;
}

export function pageOf(searchParams: Record<string, string | string[] | undefined>): number {
  const n = Number(pick(searchParams, 'trang'));
  return Number.isInteger(n) && n > 0 ? n : 1;
}
