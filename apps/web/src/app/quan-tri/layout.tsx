import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth';

export const metadata: Metadata = { title: { default: 'Quản trị', template: '%s · Quản trị LQĐ Hà Đông' }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  if (!store.get(REFRESH_COOKIE) && !store.get(ACCESS_COOKIE)) redirect('/dang-nhap?next=/quan-tri');
  return <AdminShell>{children}</AdminShell>;
}
