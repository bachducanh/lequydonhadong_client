import type { ApiTone, Tone } from './types';

const TZ = 'Asia/Ho_Chi_Minh';

const dateFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
const partsFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: 'numeric', year: 'numeric' });

/** 05/10/2026 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return dateFmt.format(new Date(value));
}

/** 05/10/2026 08:12 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return `${dateFmt.format(d)} ${timeFmt.format(d)}`;
}

/** { day: '05', month: 'Th10' } cho ô ngày của danh sách thông báo */
export function dayMonth(value: string | null | undefined) {
  if (!value) return { day: '--', month: '' };
  const parts = partsFmt.formatToParts(new Date(value));
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  return { day, month: `Th${month}` };
}

/** Giá trị cho <input type="date"> theo giờ Việt Nam */
export function toDateInput(value: string | null | undefined): string {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
  return parts;
}

/** Giá trị cho <input type="datetime-local"> theo giờ Việt Nam */
export function toDateTimeInput(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  return `${toDateInput(value)}T${new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)}`;
}

/** "2026-10-05" hoặc "2026-10-05T08:00" (giờ Việt Nam) -> ISO */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  return new Date(value.length <= 10 ? `${value}T00:00:00+07:00` : `${value}:00+07:00`).toISOString();
}

export function formatNumber(n: number | null | undefined): string {
  return new Intl.NumberFormat('vi-VN').format(n ?? 0);
}

export function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

export function fileExt(name: string | null | undefined): string {
  const m = name?.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : 'FILE';
}

export function toTone(tone: ApiTone | null | undefined, fallback: Tone = 'brand'): Tone {
  return tone ? (tone.toLowerCase() as Tone) : fallback;
}

/** Chọn mẫu ảnh giữ chỗ ổn định theo id */
export function seedOf(id: string | undefined, mod = 4): number {
  let n = 0;
  for (const ch of id ?? '') n = (n + ch.charCodeAt(0)) % 997;
  return n % mod;
}

export function isExternal(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');
}
