import type { Metadata } from 'next';
import { AdminDetailPage } from '@/components/admin/admin-pages';

type Props = { params: Promise<{ resource: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { resource, id } = await params;
  if (resource === 'tin-bai') return { title: id === 'moi' ? 'Viết bài mới' : 'Sửa bài viết' };
  return { title: 'Quản lý ảnh album' };
}

export default async function AdminDetail({ params }: Props) {
  const { resource, id } = await params;
  return <AdminDetailPage resource={resource} id={id} />;
}
