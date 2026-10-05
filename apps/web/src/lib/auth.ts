import type { NextResponse } from 'next/server';

export const ACCESS_COOKIE = 'lqd_at';
export const REFRESH_COOKIE = 'lqd_rt';
export const REMEMBER_COOKIE = 'lqd_rm';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

/** Chỉ bật cờ Secure khi website chạy HTTPS (chạy Docker trên http://localhost vẫn đăng nhập được). */
const secure = () => (process.env.SITE_URL ?? '').startsWith('https://');

export function setAuthCookies(res: NextResponse, tokens: TokenPair, remember: boolean) {
  const base = { httpOnly: true, sameSite: 'lax' as const, secure: secure(), path: '/' };
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...base, maxAge: tokens.expiresIn });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, remember ? { ...base, maxAge: tokens.refreshExpiresIn } : base);
  res.cookies.set(REMEMBER_COOKIE, remember ? '1' : '0', remember ? { ...base, maxAge: tokens.refreshExpiresIn } : base);
}

export function clearAuthCookies(res: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, REMEMBER_COOKIE]) {
    res.cookies.set(name, '', { path: '/', maxAge: 0 });
  }
}
