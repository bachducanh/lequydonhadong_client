import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { LoginForm } from '@/components/site/forms';
import { LanguageSwitcher } from '@/components/site/language-switcher';
import { REFRESH_COOKIE } from '@/lib/auth';
import { getI18n } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.login.metaTitle, robots: { index: false } };
}

export default async function LoginPage() {
  if ((await cookies()).get(REFRESH_COOKIE)) redirect('/quan-tri');
  return (
    <main className="lqd-login-page">
      <div className="lqd-login-lang">
        <LanguageSwitcher inverse align="end" />
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
