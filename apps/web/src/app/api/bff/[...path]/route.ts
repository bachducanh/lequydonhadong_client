/**
 * Backend-for-frontend: chuyển tiếp /api/bff/* -> API /api/v1/*.
 * - Gắn Bearer token lấy từ cookie httpOnly (trình duyệt không giữ JWT).
 * - Token hết hạn: tự dùng refresh token lấy cặp mới rồi gọi lại một lần.
 * App di động gọi thẳng API bằng Bearer token, không đi qua lớp này.
 */
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';
import { ACCESS_COOKIE, clearAuthCookies, clientIpHeaders, REFRESH_COOKIE, REMEMBER_COOKIE, setAuthCookies, type TokenPair } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PASS_HEADERS = ['content-type', 'content-disposition', 'location', 'cache-control', 'retry-after'];

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = `${API_URL}/api/v1/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  let accessToken = store.get(ACCESS_COOKIE)?.value;

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer();
  const headers = new Headers({ accept: req.headers.get('accept') ?? 'application/json' });
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  for (const [k, v] of Object.entries(clientIpHeaders(req.headers))) headers.set(k, v);

  const send = () => {
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    return fetch(target, { method: req.method, headers, body, redirect: 'manual', cache: 'no-store' });
  };

  let upstream: Response;
  let renewed: TokenPair | null = null;
  let sessionExpired = false;
  try {
    // Không có access token nhưng còn refresh token: làm mới trước khi gọi route cần đăng nhập
    const needsAuth = path[0] === 'admin' || path[0] === 'auth';
    if (!accessToken && refreshToken && needsAuth) {
      renewed = await refresh(refreshToken);
      if (renewed) accessToken = renewed.accessToken;
      else sessionExpired = true;
    }
    upstream = await send();
    if (upstream.status === 401 && refreshToken && !renewed && !sessionExpired) {
      renewed = await refresh(refreshToken);
      if (renewed) {
        accessToken = renewed.accessToken;
        upstream = await send();
      } else sessionExpired = true;
    }
  } catch {
    return NextResponse.json({ message: 'Không kết nối được máy chủ API' }, { status: 502 });
  }

  const resHeaders = new Headers();
  for (const name of PASS_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) resHeaders.set(name, value);
  }
  const res = new NextResponse(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: resHeaders });
  if (renewed) setAuthCookies(res, renewed, store.get(REMEMBER_COOKIE)?.value !== '0');
  if (sessionExpired) clearAuthCookies(res);
  return res;
}

async function refresh(refreshToken: string): Promise<TokenPair | null> {
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });
  return res.ok ? ((await res.json()) as TokenPair) : null;
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
