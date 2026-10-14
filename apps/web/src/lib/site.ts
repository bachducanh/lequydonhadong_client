import type { IconName } from '@/components/ui/icon';
import { dict, type Lang } from './i18n';

export const SCHOOL = {
  phone: '(0433) 525.618',
  phoneHref: 'tel:0433525618',
  email: 'c3lequydon-hadong@hanoiedu.vn',
};

const NAV_ITEMS = [
  { key: 'gioi-thieu', href: '/gioi-thieu' },
  { key: 'tin-tuc', href: '/tin-tuc' },
  { key: 'van-ban', href: '/van-ban' },
  { key: 'thu-vien', href: '/thu-vien' },
  { key: 'hoi-dap', href: '/hoi-dap' },
] as const;

/** Menu chính — tối đa 5 mục (theo thiết kế kiểu edX) */
export const navItems = (lang: Lang) => NAV_ITEMS.map((n) => ({ ...n, label: dict(lang).nav.items[n.key] }));

export function footerColumns(lang: Lang): { title: string; links: { label: string; href: string }[] }[] {
  const f = dict(lang).footer;
  return [
    {
      title: f.school,
      links: [
        { label: f.about, href: '/gioi-thieu' },
        { label: f.board, href: '/tin-tuc?chuyen-muc=ban-giam-hieu' },
        { label: f.departments, href: '/gioi-thieu#to-chuyen-mon' },
        { label: f.clubs, href: '/cau-lac-bo' },
        { label: f.admissions, href: '/tuyen-sinh' },
      ],
    },
    {
      title: f.learning,
      links: [
        { label: f.news, href: '/tin-tuc' },
        { label: f.regulations, href: '/van-ban' },
        { label: f.downloads, href: '/van-ban#tai-lieu' },
        { label: f.gallery, href: '/thu-vien' },
      ],
    },
    {
      title: f.connect,
      links: [
        { label: f.qa, href: '/hoi-dap' },
        { label: f.feedback, href: '/hoi-dap#gui-cau-hoi' },
        { label: f.links, href: '/#lien-ket' },
        { label: f.login, href: '/dang-nhap' },
      ],
    },
  ];
}

const DEPT_ICONS: IconName[] = ['globe', 'calc', 'flask', 'book'];

export const departments = (lang: Lang) =>
  dict(lang).departments.map((d, i) => ({ ...d, icon: DEPT_ICONS[i], meta: dict(lang).grades, href: '/tin-tuc?chuyen-muc=to-chuyen-mon' }));

/** Từ khoá tìm nhiều: luôn tìm bằng tiếng Việt (nội dung nhập bằng tiếng Việt), nhãn theo ngôn ngữ. */
export const SEARCH_CHIPS = [
  { q: 'Lịch thi', en: 'Exam schedule' },
  { q: 'Tuyển sinh lớp 10', en: 'Grade 10 admissions' },
  { q: 'Thời khoá biểu', en: 'Timetable' },
  { q: 'Biểu mẫu', en: 'Forms' },
];

/* Giá trị lưu trong CSDL (tiếng Việt) — nhãn tiếng Anh xem label() trong lib/i18n */
export const QA_TOPICS = ['Học tập', 'Thủ tục', 'Tuyển sinh', 'Khác'];
export const ASKER_ROLES = ['Phụ huynh', 'Học sinh', 'Cựu học sinh', 'Khác'];
export const CLUB_LANGUAGES = ['Tiếng Anh', 'Tiếng Pháp', 'Tiếng Nhật', 'Tiếng Hàn', 'Tiếng Trung', 'Tiếng Đức'];
export const DOC_TYPES = ['Luật', 'Nghị định', 'Thông tư', 'Quyết định', 'Công văn', 'Kế hoạch'];
