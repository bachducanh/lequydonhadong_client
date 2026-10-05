import type { IconName } from '@/components/ui/icon';

export const SCHOOL = {
  name: 'Trường THPT Lê Quý Đôn – Hà Đông',
  shortName: 'LQĐ Hà Đông',
  address: '04 Nhuệ Giang, phường Hà Đông, Hà Nội',
  phone: '(0433) 525.618',
  phoneHref: 'tel:0433525618',
  email: 'c3lequydon-hadong@hanoiedu.vn',
};

/** Menu chính — tối đa 5 mục (theo thiết kế kiểu edX) */
export const NAV = [
  { key: 'gioi-thieu', label: 'Giới thiệu', href: '/gioi-thieu' },
  { key: 'tin-tuc', label: 'Tin tức – Thông báo', href: '/tin-tuc' },
  { key: 'van-ban', label: 'Văn bản', href: '/van-ban' },
  { key: 'thu-vien', label: 'Thư viện', href: '/thu-vien' },
  { key: 'hoi-dap', label: 'Hỏi đáp', href: '/hoi-dap' },
] as const;

export const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Nhà trường',
    links: [
      { label: 'Giới thiệu', href: '/gioi-thieu' },
      { label: 'Ban giám hiệu', href: '/tin-tuc?chuyen-muc=ban-giam-hieu' },
      { label: 'Tổ chuyên môn', href: '/gioi-thieu#to-chuyen-mon' },
      { label: 'Câu lạc bộ', href: '/cau-lac-bo' },
      { label: 'Tuyển sinh', href: '/tuyen-sinh' },
    ],
  },
  {
    title: 'Học tập',
    links: [
      { label: 'Tin tức – Thông báo', href: '/tin-tuc' },
      { label: 'Văn bản pháp quy', href: '/van-ban' },
      { label: 'Tài liệu tải về', href: '/van-ban#tai-lieu' },
      { label: 'Thư viện ảnh', href: '/thu-vien' },
    ],
  },
  {
    title: 'Kết nối',
    links: [
      { label: 'Hỏi đáp', href: '/hoi-dap' },
      { label: 'Góp ý', href: '/hoi-dap#gui-cau-hoi' },
      { label: 'Liên kết hữu ích', href: '/#lien-ket' },
      { label: 'Đăng nhập', href: '/dang-nhap' },
    ],
  },
];

export const DEPARTMENTS: { icon: IconName; title: string; description: string; meta: string; href: string }[] = [
  { icon: 'globe', title: 'Ngoại ngữ', description: 'Tiếng Anh, IELTS, giao lưu quốc tế.', meta: 'Khối 10–12', href: '/tin-tuc?chuyen-muc=to-chuyen-mon' },
  { icon: 'calc', title: 'Toán – Tin', description: 'Toán học, Tin học, CLB lập trình.', meta: 'Khối 10–12', href: '/tin-tuc?chuyen-muc=to-chuyen-mon' },
  { icon: 'flask', title: 'Khoa học tự nhiên', description: 'Vật lý, Hoá học, Sinh học, STEM.', meta: 'Khối 10–12', href: '/tin-tuc?chuyen-muc=to-chuyen-mon' },
  { icon: 'book', title: 'Khoa học xã hội', description: 'Ngữ văn, Lịch sử, Địa lý, GDKT&PL.', meta: 'Khối 10–12', href: '/tin-tuc?chuyen-muc=to-chuyen-mon' },
];

export const SEARCH_CHIPS = ['Lịch thi', 'Tuyển sinh lớp 10', 'Thời khoá biểu', 'Biểu mẫu'];

export const QA_TOPICS = ['Học tập', 'Thủ tục', 'Tuyển sinh', 'Khác'];
export const ASKER_ROLES = ['Phụ huynh', 'Học sinh', 'Cựu học sinh', 'Khác'];
export const CLUB_LANGUAGES = ['Tiếng Anh', 'Tiếng Pháp', 'Tiếng Nhật', 'Tiếng Hàn', 'Tiếng Trung', 'Tiếng Đức'];
export const DOC_TYPES = ['Luật', 'Nghị định', 'Thông tư', 'Quyết định', 'Công văn', 'Kế hoạch'];
