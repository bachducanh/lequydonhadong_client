import { cookies } from 'next/headers';
import { Footer } from '@/components/site/footer';
import { Navbar } from '@/components/site/navbar';
import { apiSafe } from '@/lib/api';
import { REFRESH_COOKIE } from '@/lib/auth';
import type { LinkItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [store, footerLinks] = await Promise.all([cookies(), apiSafe<LinkItem[]>('/links', { position: 'FOOTER' }, [])]);
  return (
    <>
      <a href="#noi-dung" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-surface-raised focus:px-4 focus:py-2">
        Bỏ qua đến nội dung chính
      </a>
      <Navbar loggedIn={!!store.get(REFRESH_COOKIE)} />
      <main id="noi-dung">{children}</main>
      <Footer extraLinks={footerLinks} />
    </>
  );
}
