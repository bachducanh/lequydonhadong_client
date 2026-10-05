import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminResourcePage } from '@/components/admin/admin-pages';
import { ADMIN_NAV } from '@/components/admin/admin-nav';

type Props = { params: Promise<{ resource: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { resource } = await params;
  const item = ADMIN_NAV.flatMap((g) => g.items).find((i) => i.key === resource);
  return { title: item?.label ?? 'Quản trị' };
}

export default async function AdminResource({ params }: Props) {
  const { resource } = await params;
  return (
    <Suspense>
      <AdminResourcePage resource={resource} />
    </Suspense>
  );
}
