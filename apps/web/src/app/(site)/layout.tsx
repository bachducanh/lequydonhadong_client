import { cookies } from 'next/headers';
import { Footer } from '@/components/site/footer';
import { Navbar } from '@/components/site/navbar';
import { apiSafe } from '@/lib/api';
import { REFRESH_COOKIE } from '@/lib/auth';
import { getI18n } from '@/lib/i18n-server';
import type { LinkItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [store, { lang, t }, footerLinks] = await Promise.all([cookies(), getI18n(), apiSafe<LinkItem[]>('/links', { position: 'FOOTER' }, [])]);
  return (
    <>
      <a href="#noi-dung" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-surface-raised focus:px-4 focus:py-2">
        {t.common.skipToContent}
      </a>
      <Navbar loggedIn={!!store.get(REFRESH_COOKIE)} />
      <main id="noi-dung">{children}</main>
      <Footer lang={lang} extraLinks={footerLinks} />
    </>
  );
}
