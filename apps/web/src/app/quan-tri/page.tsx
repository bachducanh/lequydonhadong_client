import type { Metadata } from 'next';
import { Dashboard } from '@/components/admin/admin-pages';

export const metadata: Metadata = { title: 'Bảng điều khiển' };

export default function AdminHome() {
  return <Dashboard />;
}
