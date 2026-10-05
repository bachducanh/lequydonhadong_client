/**
 * Gọi API từ trình duyệt qua BFF /api/bff/* (route handler gắn token từ cookie httpOnly,
 * tự làm mới token khi hết hạn). Trình duyệt không bao giờ thấy JWT.
 */
import type { UploadResult } from './types';

export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function messageOf(data: unknown, status: number) {
  const m = (data as { message?: unknown } | null)?.message;
  if (Array.isArray(m)) return m.join('. ');
  if (typeof m === 'string') return m;
  if (status === 413) return 'Tệp quá lớn';
  if (status >= 500) return 'Máy chủ đang gặp sự cố, vui lòng thử lại sau';
  return 'Đã có lỗi xảy ra';
}

export async function api<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; query?: Query; signal?: AbortSignal } = {},
): Promise<T> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  const res = await fetch(`/api/bff${path}${qs ? `?${qs}` : ''}`, {
    method: init.method ?? 'GET',
    headers: init.body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: init.signal,
    credentials: 'same-origin',
  });
  if (res.status === 401 && path.startsWith('/admin') && typeof window !== 'undefined') {
    window.location.href = `/dang-nhap?next=${encodeURIComponent(window.location.pathname)}`;
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ClientApiError(res.status, messageOf(data, res.status));
  return data as T;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/bff/admin/uploads', { method: 'POST', body: form, credentials: 'same-origin' });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ClientApiError(res.status, messageOf(data, res.status));
  return data as UploadResult;
}

/** Bỏ chuỗi rỗng trước khi gửi biểu mẫu công khai (API coi trường vắng là không bắt buộc). */
export function compact<T extends Record<string, unknown>>(values: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (typeof v === 'string') {
      if (v.trim() !== '') out[k] = v.trim();
    } else if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}
