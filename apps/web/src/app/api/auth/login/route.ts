import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';
import { setAuthCookies, type TokenPair } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password, remember } = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
    remember?: boolean;
  };
  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(req.headers.get('x-forwarded-for') ? { 'x-forwarded-for': req.headers.get('x-forwarded-for')! } : {}),
      },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'Không kết nối được máy chủ API' }, { status: 502 });
  }
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });
  const { user, ...tokens } = data as TokenPair & { user: unknown };
  const res = NextResponse.json({ user });
  setAuthCookies(res, tokens, remember !== false);
  return res;
}
