import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { LoginForm } from '@/components/site/forms';
import { REFRESH_COOKIE } from '@/lib/auth';

export const metadata: Metadata = { title: 'Đăng nhập quản trị', robots: { index: false } };

export default async function LoginPage() {
  if ((await cookies()).get(REFRESH_COOKIE)) redirect('/quan-tri');
  return (
    <main style={{ minHeight: '100vh', display: 'grid', background: 'var(--surface-inverse)' }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
