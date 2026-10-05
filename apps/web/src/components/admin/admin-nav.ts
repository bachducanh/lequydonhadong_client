/** Menu quản trị — dùng được cả ở Server và Client Component. */
import type { IconName } from '@/components/ui/icon';
import type { Role } from '@/lib/types';

export type AdminKey =
  | 'dashboard' | 'tin-bai' | 'chuyen-muc' | 'phan-hoi' | 'van-ban' | 'chu-chay' | 'anh-gioi-thieu' | 'albums'
  | 'thu-vien' | 'kieu-thu-vien' | 'download' | 'hoi-dap' | 'gop-y' | 'clb' | 'banner' | 'lien-ket' | 'nguoi-dung';

/** Menu quản trị nhóm theo Nội dung · Thư viện & tệp · Tương tác · Giao diện & hệ thống. */
export const ADMIN_NAV: { group: string | null; items: { key: AdminKey; label: string; icon: IconName; roles?: Role[] }[] }[] = [
  { group: null, items: [{ key: 'dashboard', label: 'Trang chủ', icon: 'dashboard' }] },
  {
    group: 'Nội dung',
    items: [
      { key: 'tin-bai', label: 'Quản lý tin bài', icon: 'fileText', roles: ['ADMIN', 'EDITOR', 'TEACHER'] },
      { key: 'chuyen-muc', label: 'Quản lý chuyên mục', icon: 'folder' },
      { key: 'phan-hoi', label: 'DS phản hồi bài viết', icon: 'message' },
      { key: 'van-ban', label: 'Văn bản pháp quy', icon: 'scale' },
      { key: 'chu-chay', label: 'Quản lý chữ chạy', icon: 'megaphone' },
    ],
  },
  {
    group: 'Thư viện & tệp',
    items: [
      { key: 'anh-gioi-thieu', label: 'Ảnh giới thiệu (slider)', icon: 'images' },
      { key: 'albums', label: 'Albums', icon: 'image' },
      { key: 'thu-vien', label: 'Quản lý thư viện', icon: 'layers', roles: ['ADMIN', 'EDITOR', 'TEACHER'] },
      { key: 'kieu-thu-vien', label: 'Kiểu thư viện', icon: 'grid' },
      { key: 'download', label: 'Quản lý file Download', icon: 'download', roles: ['ADMIN', 'EDITOR', 'TEACHER'] },
    ],
  },
  {
    group: 'Tương tác',
    items: [
      { key: 'hoi-dap', label: 'Hỏi đáp', icon: 'help' },
      { key: 'gop-y', label: 'Thông tin góp ý', icon: 'inbox' },
      { key: 'clb', label: 'Câu lạc bộ kết bạn', icon: 'heart' },
    ],
  },
  {
    group: 'Giao diện & hệ thống',
    items: [
      { key: 'banner', label: 'Banner quảng cáo', icon: 'megaphone' },
      { key: 'lien-ket', label: 'Các liên kết', icon: 'link' },
      { key: 'nguoi-dung', label: 'Quản lý người dùng', icon: 'users', roles: ['ADMIN'] },
    ],
  },
];

export const ROLE_LABEL: Record<Role, string> = { ADMIN: 'Quản trị viên', EDITOR: 'Biên tập viên', TEACHER: 'Giáo viên' };
const DEFAULT_ROLES: Role[] = ['ADMIN', 'EDITOR'];

export const canAccess = (key: AdminKey, role?: Role) => {
  if (key === 'dashboard') return true;
  const item = ADMIN_NAV.flatMap((g) => g.items).find((i) => i.key === key);
  return !!role && (item?.roles ?? DEFAULT_ROLES).includes(role);
};
