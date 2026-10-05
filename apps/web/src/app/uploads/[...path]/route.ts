/** Phục vụ tệp tải lên (/uploads/...) từ API để website chỉ cần một tên miền. */
import { NextRequest } from 'next/server';
import { API_URL } from '@/lib/api';

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const upstream = await fetch(`${API_URL}/uploads/${path.map(encodeURIComponent).join('/')}`, {
    headers: req.headers.get('range') ? { range: req.headers.get('range')! } : undefined,
    cache: 'no-store',
  }).catch(() => null);
  if (!upstream || !upstream.ok) return new Response('Không tìm thấy tệp', { status: 404 });
  const headers = new Headers();
  for (const name of ['content-type', 'content-length', 'last-modified', 'etag', 'accept-ranges', 'content-range']) {
    const v = upstream.headers.get(name);
    if (v) headers.set(name, v);
  }
  headers.set('cache-control', 'public, max-age=604800');
  return new Response(upstream.body, { status: upstream.status, headers });
}
