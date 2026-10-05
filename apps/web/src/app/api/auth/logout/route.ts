import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';
import { clearAuthCookies, REFRESH_COOKIE } from '@/lib/auth';

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    }).catch(() => undefined);
  }
  const res = new NextResponse(null, { status: 204 });
  clearAuthCookies(res);
  return res;
}
