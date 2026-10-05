'use client';

/**
 * Cấu hình các màn hình quản trị dạng danh sách (theo LQD.AdminScreen của bản thiết kế).
 * Mỗi mục: endpoint API, tab lọc theo trạng thái, bộ lọc, cột bảng hoặc thẻ lưới, biểu mẫu thêm/sửa.
 */
import { Ticker } from '@/components/site/blocks';
import { HeroSlider } from '@/components/site/hero-slider';
import { DOC_TYPES, ASKER_ROLES, CLUB_LANGUAGES } from '@/lib/site';
import { fileExt, formatDate, formatDateTime, formatNumber, formatSize } from '@/lib/format';
import type { Slide, TickerItem, Tone } from '@/lib/types';
import type { Row } from './data-table';
import { DEFAULT_ACTIONS, type ResourceConfig } from './resource-screen';
import type { FieldDef } from './resource-form';

type T = { label: string; tone: Tone };
const tag = (map: Record<string, T>) => (v: string | null | undefined) => (v ? (map[v] ?? { label: v, tone: 'neutral' as Tone }) : null);
const neutral = (v: string | null | undefined) => (v ? { label: v, tone: 'neutral' as Tone } : null);

const POST_STATUS = tag({ PUBLISHED: { label: 'Đã đăng', tone: 'success' }, PENDING: { label: 'Chờ duyệt', tone: 'warning' }, DRAFT: { label: 'Nháp', tone: 'neutral' } });
const COMMENT_STATUS = tag({ APPROVED: { label: 'Đã duyệt', tone: 'success' }, PENDING: { label: 'Chờ duyệt', tone: 'warning' }, SPAM: { label: 'Spam', tone: 'danger' } });
const FEEDBACK_STATUS = tag({ NEW: { label: 'Mới', tone: 'brand' }, SEEN: { label: 'Đã xem', tone: 'neutral' }, RESOLVED: { label: 'Đã xử lý', tone: 'success' } });
const CLUB_STATUS = tag({ PENDING: { label: 'Chờ duyệt', tone: 'warning' }, APPROVED: { label: 'Thành viên', tone: 'success' }, REJECTED: { label: 'Từ chối', tone: 'neutral' } });
const STATE = tag({ RUNNING: { label: 'Đang chạy', tone: 'success' }, SCHEDULED: { label: 'Lên lịch', tone: 'brand' }, EXPIRED: { label: 'Hết hạn', tone: 'neutral' } });
const USER_STATUS = tag({ ACTIVE: { label: 'Hoạt động', tone: 'success' }, LOCKED: { label: 'Bị khoá', tone: 'danger' } });
const ROLE = tag({ ADMIN: { label: 'Quản trị', tone: 'brand' }, EDITOR: { label: 'Biên tập', tone: 'neutral' }, TEACHER: { label: 'Giáo viên', tone: 'neutral' } });
const POSITION_LABEL: Record<string, string> = { HOME: 'Trang chủ', SIDEBAR: 'Cột bên trang tin', FOOTER: 'Chân trang' };

const opts = (list: string[]) => list.map((v) => ({ value: v, label: v }));
const yearOptions = () => {
  const y = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, i) => String(y - i)).map((v) => ({ value: v, label: v }));
};

/* ---------- Trường dùng lại ---------- */

const fileFields = (label = 'Tệp đính kèm', required = false): FieldDef[] => [
  { name: 'fileUrl', label, type: 'file', required, fileName: 'fileName', fileSize: 'fileSize', accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt' },
];

export const RESOURCES: Record<string, ResourceConfig> = {
  /* ---------- Tin bài ---------- */
  'tin-bai': {
    title: 'Quản lý tin bài',
    description: 'Soạn, duyệt và xuất bản tin tức, thông báo lên website.',
    endpoint: '/admin/posts',
    createLabel: 'Viết bài mới',
    createHref: '/quan-tri/tin-bai/moi',
    loaders: { categories: '/admin/categories' },
    search: 'Tìm theo tiêu đề…',
    tabs: () => [
      { label: 'Tất cả', query: {}, countKey: 'ALL' },
      { label: 'Đã đăng', query: { status: 'PUBLISHED' }, countKey: 'PUBLISHED' },
      { label: 'Chờ duyệt', query: { status: 'PENDING' }, countKey: 'PENDING' },
      { label: 'Nháp', query: { status: 'DRAFT' }, countKey: 'DRAFT' },
    ],
    filters: ({ loaded }) => [
      {
        name: 'categoryId',
        label: 'Tất cả chuyên mục',
        options: ((loaded.categories as Row[]) ?? []).map((c) => ({ value: c.id, label: `${'— '.repeat(c.depth)}${c.name}` })),
      },
    ],
    columns: [
      { key: 'title', label: 'Bài viết', type: 'title', thumb: (r) => r.thumbnail, sub: (r) => `/tin-tuc/${r.slug}` },
      { key: 'category', label: 'Chuyên mục', type: 'tag', tag: (r) => neutral(r.category?.name) },
      { key: 'author', label: 'Tác giả', type: 'muted', get: (r) => r.authorName || r.author?.fullName },
      { key: 'publishedAt', label: 'Ngày đăng', type: 'muted', get: (r) => formatDate(r.publishedAt) },
      { key: 'status', label: 'Trạng thái', type: 'tag', tag: (r) => POST_STATUS(r.status) },
      { key: 'featured', label: 'Nổi bật', type: 'star' },
    ],
    actions: (ctx) => [
      { key: 'eye', icon: 'eye', label: 'Xem trên website', show: (r) => r.status === 'PUBLISHED', href: (r) => `/tin-tuc/${r.slug}` },
      { key: 'edit', icon: 'edit', label: 'Sửa', href: (r) => `/quan-tri/tin-bai/${r.id}` },
      { key: 'trash', icon: 'trash', label: 'Xoá', tone: 'danger', run: ctx.remove },
    ],
  },

  /* ---------- Chuyên mục ---------- */
  'chuyen-muc': {
    title: 'Quản lý chuyên mục',
    description: 'Cấu trúc chuyên mục quyết định menu và đường dẫn bài viết.',
    endpoint: '/admin/categories',
    createLabel: 'Thêm chuyên mục',
    search: 'Tìm chuyên mục…',
    paginated: false,
    loaders: { categories: '/admin/categories' },
    columns: [
      { key: 'name', label: 'Tên chuyên mục', type: 'title', indent: (r) => r.depth, sub: (r) => `/${r.slug}` },
      { key: 'parentName', label: 'Thuộc', type: 'muted', get: (r) => r.parentName ?? '—' },
      { key: 'posts', label: 'Số bài', type: 'num', align: 'right', get: (r) => r._count?.posts ?? 0 },
      { key: 'order', label: 'Thứ tự', type: 'num', align: 'right' },
      { key: 'showInMenu', label: 'Hiện trên menu', type: 'toggle' },
    ],
    fields: ({ loaded }) => [
      { name: 'name', label: 'Tên chuyên mục', type: 'text', required: true },
      { name: 'slug', label: 'Đường dẫn', type: 'text', hint: 'Để trống để tạo tự động từ tên', placeholder: 'thong-bao' },
      {
        name: 'parentId',
        label: 'Chuyên mục cha',
        type: 'select',
        options: ((loaded.categories as Row[]) ?? []).map((c) => ({ value: c.id, label: `${'— '.repeat(c.depth)}${c.name}` })),
      },
      { name: 'order', label: 'Thứ tự', type: 'number', half: true },
      { name: 'showInMenu', label: 'Hiện trên menu', type: 'toggle' },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
    ],
  },

  /* ---------- Phản hồi bài viết ---------- */
  'phan-hoi': {
    title: 'Danh sách phản hồi bài viết',
    description: 'Duyệt phản hồi của bạn đọc trước khi hiển thị dưới bài viết.',
    endpoint: '/admin/comments',
    search: 'Tìm theo nội dung, người gửi…',
    tabs: () => [
      { label: 'Chờ duyệt', query: { status: 'PENDING' }, countKey: 'PENDING' },
      { label: 'Đã duyệt', query: { status: 'APPROVED' }, countKey: 'APPROVED' },
      { label: 'Spam', query: { status: 'SPAM' }, countKey: 'SPAM' },
    ],
    filters: ({ meta }) => [{ name: 'postId', label: 'Mọi bài viết', options: ((meta.posts as Row[]) ?? []).map((p) => ({ value: p.id, label: p.title })) }],
    rowClass: (r) => (r.status === 'PENDING' && Date.now() - new Date(r.createdAt).getTime() < 86_400_000 ? 'is-new' : undefined),
    columns: [
      { key: 'name', label: 'Người gửi', type: 'title', avatar: true, sub: (r) => r.email },
      { key: 'content', label: 'Nội dung', type: 'clamp', width: '34%' },
      { key: 'post', label: 'Bài viết', type: 'link', get: (r) => r.post?.title, href: (r) => (r.post ? `/tin-tuc/${r.post.slug}#phan-hoi` : null) },
      { key: 'createdAt', label: 'Ngày gửi', type: 'muted', get: (r) => formatDateTime(r.createdAt) },
      { key: 'status', label: 'Trạng thái', type: 'tag', tag: (r) => COMMENT_STATUS(r.status) },
    ],
    actions: (ctx) => [
      { key: 'check', icon: 'check', label: 'Duyệt', tone: 'ok', show: (r) => r.status !== 'APPROVED', run: (r) => ctx.patch(r, { status: 'APPROVED' }, 'Đã duyệt phản hồi') },
      { key: 'x', icon: 'x', label: 'Đánh dấu spam', tone: 'danger', show: (r) => r.status !== 'SPAM', run: (r) => ctx.patch(r, { status: 'SPAM' }, 'Đã chuyển vào spam') },
      { key: 'trash', icon: 'trash', label: 'Xoá', tone: 'danger', run: ctx.remove },
    ],
  },

  /* ---------- Văn bản pháp quy ---------- */
  'van-ban': {
    title: 'Văn bản pháp quy',
    description: 'Văn bản của Bộ, Sở GD&ĐT và nhà trường công khai trên website.',
    endpoint: '/admin/legal-documents',
    createLabel: 'Thêm văn bản',
    search: 'Tìm theo số hiệu, trích yếu…',
    filters: ({ meta }) => [
      { name: 'type', label: 'Tất cả loại', options: opts(DOC_TYPES) },
      { name: 'issuer', label: 'Mọi cơ quan', options: opts((meta.issuers as string[]) ?? []) },
      { name: 'year', label: 'Năm ban hành', options: yearOptions() },
    ],
    columns: [
      { key: 'code', label: 'Số hiệu', type: 'num', get: (r) => r.code ?? '—' },
      { key: 'title', label: 'Trích yếu', type: 'title', sub: (r) => r.issuer },
      { key: 'type', label: 'Loại', type: 'tag', tag: (r) => neutral(r.type) },
      { key: 'issuedAt', label: 'Ban hành', type: 'muted', get: (r) => formatDate(r.issuedAt) },
      { key: 'effective', label: 'Hiệu lực', type: 'tag', tag: (r) => (r.effective ? { label: 'Hiệu lực', tone: 'success' } : { label: 'Hết hiệu lực', tone: 'neutral' }) },
      { key: 'visible', label: 'Hiển thị', type: 'toggle' },
    ],
    actions: (ctx) => [{ key: 'download', icon: 'download', label: 'Tải về', show: (r) => !!r.fileUrl, href: (r) => r.fileUrl }, ...DEFAULT_ACTIONS(ctx)],
    fields: ({ meta }) => [
      { name: 'title', label: 'Trích yếu', type: 'textarea', required: true, rows: 2 },
      { name: 'code', label: 'Số hiệu', type: 'text', placeholder: '29/2024/TT-BGDĐT', half: true },
      { name: 'type', label: 'Loại văn bản', type: 'select', required: true, options: opts(DOC_TYPES), half: true },
      { name: 'issuer', label: 'Cơ quan ban hành', type: 'text', required: true, suggestions: ['Bộ GD&ĐT', 'Sở GD&ĐT Hà Nội', 'Nhà trường', ...((meta.issuers as string[]) ?? [])], half: true },
      { name: 'issuedAt', label: 'Ngày ban hành', type: 'date', half: true },
      ...fileFields('Tệp văn bản'),
      { name: 'effective', label: 'Còn hiệu lực', type: 'toggle' },
      { name: 'visible', label: 'Hiển thị trên website', type: 'toggle' },
    ],
  },

  /* ---------- Chữ chạy ---------- */
  'chu-chay': {
    title: 'Quản lý chữ chạy',
    description: 'Dòng tin nhanh chạy ngang dưới thanh điều hướng trang chủ (tối đa 5 dòng đang chạy).',
    endpoint: '/admin/tickers',
    createLabel: 'Thêm dòng chữ',
    search: 'Tìm nội dung…',
    paginated: false,
    reorder: true,
    preview: (rows) => <Ticker items={rows.filter((r) => r.state === 'RUNNING').slice(0, 5) as unknown as TickerItem[]} />,
    columns: [
      { key: 'text', label: 'Nội dung', type: 'drag', width: '40%' },
      { key: 'link', label: 'Liên kết tới', type: 'link', href: (r) => r.link },
      { key: 'startAt', label: 'Bắt đầu', type: 'muted', get: (r) => formatDate(r.startAt) },
      { key: 'endAt', label: 'Kết thúc', type: 'muted', get: (r) => formatDate(r.endAt) },
      { key: 'state', label: 'Trạng thái', type: 'tag', tag: (r) => STATE(r.state) },
    ],
    fields: () => [
      { name: 'text', label: 'Nội dung', type: 'text', required: true, hint: 'Tối đa 80 ký tự để hiển thị gọn trên một dòng' },
      { name: 'link', label: 'Liên kết tới', type: 'text', placeholder: '/tin-tuc/lich-kiem-tra-giua-ky' },
      { name: 'startAt', label: 'Bắt đầu', type: 'datetime', half: true },
      { name: 'endAt', label: 'Kết thúc', type: 'datetime', half: true },
    ],
  },

  /* ---------- Ảnh giới thiệu (slider) ---------- */
  'anh-gioi-thieu': {
    title: 'Ảnh giới thiệu (slider trang chủ)',
    description: 'Mỗi ảnh là một slide trên trang chủ; tối đa 6 slide đang hiển thị, sắp xếp theo thứ tự.',
    endpoint: '/admin/slides',
    createLabel: 'Thêm slide',
    view: 'grid',
    paginated: false,
    preview: (rows) => (
      <div className="lqd-preview-scale">
        <HeroSlider slides={rows.filter((r) => r.visible) as unknown as Slide[]} autoplay={false} />
      </div>
    ),
    card: (r) => ({
      title: r.title,
      meta: [r.ctaLabel && `Nút: ${r.ctaLabel}`, r.eyebrow].filter(Boolean).join(' · '),
      thumb: r.image,
      badge: r.visible ? 'Đang hiển thị' : null,
      order: r.order,
      toggleField: 'visible',
    }),
    fields: () => [
      { name: 'image', label: 'Ảnh (4:3, tối thiểu 1200px)', type: 'image' },
      { name: 'imageAlt', label: 'Mô tả ảnh (cho trình đọc màn hình)', type: 'text' },
      { name: 'eyebrow', label: 'Dòng nhỏ phía trên', type: 'text', placeholder: 'Năm học 2026–2027', half: true },
      { name: 'caption', label: 'Chú thích ảnh', type: 'text', half: true },
      { name: 'title', label: 'Tiêu đề', type: 'text', required: true },
      { name: 'lead', label: 'Đoạn dẫn', type: 'textarea', rows: 2 },
      { name: 'ctaLabel', label: 'Nút chính', type: 'text', half: true },
      { name: 'ctaHref', label: 'Liên kết nút chính', type: 'text', half: true, placeholder: '/tuyen-sinh' },
      { name: 'secondaryLabel', label: 'Nút phụ', type: 'text', half: true },
      { name: 'secondaryHref', label: 'Liên kết nút phụ', type: 'text', half: true },
      { name: 'order', label: 'Thứ tự', type: 'number', half: true },
      { name: 'visible', label: 'Hiển thị', type: 'toggle' },
    ],
  },

  /* ---------- Albums ---------- */
  albums: {
    title: 'Albums',
    description: 'Album ảnh hoạt động hiển thị ở mục Thư viện ảnh.',
    endpoint: '/admin/albums',
    createLabel: 'Tạo album',
    view: 'grid',
    search: 'Tìm album…',
    filters: ({ meta }) => [{ name: 'year', label: 'Mọi năm học', options: opts(((meta.years as string[]) ?? []).filter(Boolean)) }],
    card: (r) => ({ title: r.title, meta: `${r.photoCount} ảnh · ${formatDate(r.eventDate)}`, thumb: r.coverUrl, badge: r.schoolYear, toggleField: 'visible' }),
    actions: (ctx) => [
      { key: 'photos', icon: 'images', label: 'Quản lý ảnh', href: (r) => `/quan-tri/albums/${r.id}` },
      ...DEFAULT_ACTIONS(ctx),
    ],
    fields: () => [
      { name: 'title', label: 'Tên album', type: 'text', required: true },
      { name: 'eventDate', label: 'Ngày sự kiện', type: 'date', half: true },
      { name: 'schoolYear', label: 'Năm học', type: 'text', placeholder: '2026–2027', half: true, suggestions: ['2026–2027', '2025–2026', '2024–2025'] },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
      { name: 'coverUrl', label: 'Ảnh bìa', type: 'image', hint: 'Để trống: dùng ảnh đầu tiên của album' },
      { name: 'visible', label: 'Hiển thị', type: 'toggle' },
    ],
  },

  /* ---------- Thư viện ---------- */
  'thu-vien': {
    title: 'Quản lý thư viện',
    description: 'Ảnh, video, bài giảng và tài liệu dùng chung cho toàn website.',
    endpoint: '/admin/library-items',
    createLabel: 'Tải lên',
    view: 'grid',
    search: 'Tìm theo tên…',
    loaders: { types: '/admin/library-types' },
    tabs: ({ loaded }) => [
      { label: 'Tất cả', query: {}, countKey: 'ALL' },
      ...((loaded.types as Row[]) ?? []).map((t) => ({ label: t.name, query: { typeId: t.id }, countKey: t.id })),
    ],
    card: (r) => ({
      title: r.title,
      meta: [r.type?.name, r.fileName && fileExt(r.fileName), r.fileSize && formatSize(r.fileSize), r.externalUrl && 'Liên kết ngoài'].filter(Boolean).join(' · '),
      thumb: r.thumbnail,
      badge: r.type?.name,
      toggleField: 'visible',
    }),
    actions: (ctx) => [{ key: 'open', icon: 'external', label: 'Mở', show: (r) => !!(r.fileUrl || r.externalUrl), href: (r) => r.fileUrl || r.externalUrl }, ...DEFAULT_ACTIONS(ctx)],
    fields: ({ loaded }) => [
      { name: 'title', label: 'Tiêu đề', type: 'text', required: true },
      { name: 'typeId', label: 'Kiểu thư viện', type: 'select', required: true, options: ((loaded.types as Row[]) ?? []).map((t) => ({ value: t.id, label: t.name })) },
      {
        name: 'fileUrl',
        label: 'Tệp',
        type: 'file',
        fileName: 'fileName',
        fileSize: 'fileSize',
        mimeType: 'mimeType',
        onUpload: (r, v) => ({ ...v, thumbnail: r.mimeType.startsWith('image/') ? r.url : v.thumbnail }),
      },
      { name: 'externalUrl', label: 'Hoặc liên kết ngoài (YouTube, Google Drive…)', type: 'text', placeholder: 'https://' },
      { name: 'thumbnail', label: 'Ảnh đại diện', type: 'image' },
      { name: 'description', label: 'Mô tả', type: 'textarea', rows: 2 },
      { name: 'visible', label: 'Hiển thị', type: 'toggle' },
    ],
  },

  /* ---------- Kiểu thư viện ---------- */
  'kieu-thu-vien': {
    title: 'Kiểu thư viện',
    description: 'Phân loại nội dung trong thư viện; quyết định bộ lọc ở trang Thư viện công khai.',
    endpoint: '/admin/library-types',
    createLabel: 'Thêm kiểu',
    search: 'Tìm kiểu…',
    paginated: false,
    columns: [
      { key: 'name', label: 'Tên kiểu', type: 'title', sub: (r) => r.description },
      { key: 'allowedFormats', label: 'Định dạng cho phép', type: 'muted' },
      { key: 'itemCount', label: 'Số mục', type: 'num', align: 'right', get: (r) => formatNumber(r.itemCount) },
      { key: 'order', label: 'Thứ tự', type: 'num', align: 'right' },
      { key: 'visible', label: 'Hiển thị', type: 'toggle' },
    ],
    fields: () => [
      { name: 'name', label: 'Tên kiểu', type: 'text', required: true, half: true },
      { name: 'slug', label: 'Đường dẫn', type: 'text', half: true, hint: 'Để trống để tạo tự động' },
      { name: 'description', label: 'Mô tả', type: 'text' },
      { name: 'allowedFormats', label: 'Định dạng cho phép', type: 'text', placeholder: 'PDF, DOCX' },
      { name: 'order', label: 'Thứ tự', type: 'number', half: true },
      { name: 'visible', label: 'Hiển thị', type: 'toggle' },
    ],
  },

  /* ---------- File download ---------- */
  download: {
    title: 'Quản lý file Download',
    description: 'Biểu mẫu và tài liệu cho phụ huynh, học sinh tải về.',
    endpoint: '/admin/downloads',
    createLabel: 'Tải tệp lên',
    search: 'Tìm tệp…',
    filters: ({ meta }) => [
      { name: 'ext', label: 'Mọi loại tệp', options: opts(['PDF', 'DOCX', 'XLSX', 'PPTX', 'ZIP']) },
      { name: 'category', label: 'Mọi chuyên mục', options: opts((meta.categories as string[]) ?? []) },
    ],
    columns: [
      { key: 'name', label: 'Tệp', type: 'title', sub: (r) => r.fileName },
      { key: 'category', label: 'Chuyên mục', type: 'tag', tag: (r) => neutral(r.category) },
      { key: 'fileSize', label: 'Dung lượng', type: 'muted', align: 'right', get: (r) => formatSize(r.fileSize) },
      { key: 'downloads', label: 'Lượt tải', type: 'num', align: 'right', get: (r) => formatNumber(r.downloads) },
      { key: 'createdAt', label: 'Ngày tải lên', type: 'muted', get: (r) => formatDate(r.createdAt) },
      { key: 'visible', label: 'Hiển thị', type: 'toggle' },
    ],
    actions: (ctx) => [{ key: 'download', icon: 'download', label: 'Tải về', show: (r) => !!r.fileUrl, href: (r) => r.fileUrl }, ...DEFAULT_ACTIONS(ctx)],
    fields: ({ meta }) => [
      { name: 'name', label: 'Tên hiển thị', type: 'text', required: true },
      { name: 'category', label: 'Chuyên mục', type: 'text', required: true, suggestions: ['Biểu mẫu', 'Tuyển sinh', 'Ôn tập', ...((meta.categories as string[]) ?? [])] },
      { name: 'fileUrl', label: 'Tệp', type: 'file', required: true, fileName: 'fileName', fileSize: 'fileSize', mimeType: 'mimeType' },
      { name: 'visible', label: 'Hiển thị', type: 'toggle' },
    ],
  },

  /* ---------- Góp ý ---------- */
  'gop-y': {
    title: 'Thông tin góp ý',
    description: 'Góp ý gửi từ biểu mẫu trên website. Phản hồi trong 5 ngày làm việc.',
    endpoint: '/admin/feedbacks',
    search: 'Tìm góp ý…',
    fetchOnEdit: true,
    tabs: () => [
      { label: 'Mới', query: { status: 'NEW' }, countKey: 'NEW' },
      { label: 'Đã xem', query: { status: 'SEEN' }, countKey: 'SEEN' },
      { label: 'Đã xử lý', query: { status: 'RESOLVED' }, countKey: 'RESOLVED' },
      { label: 'Tất cả', query: {}, countKey: 'ALL' },
    ],
    filters: () => [{ name: 'role', label: 'Mọi đối tượng', options: opts(ASKER_ROLES) }],
    rowClass: (r) => (r.status === 'NEW' ? 'is-new' : undefined),
    columns: [
      { key: 'name', label: 'Người gửi', type: 'title', avatar: true, sub: (r) => r.role },
      { key: 'title', label: 'Tiêu đề', type: 'title', sub: (r) => (r.content?.length > 60 ? `${r.content.slice(0, 60)}…` : r.content) },
      { key: 'createdAt', label: 'Ngày gửi', type: 'muted', get: (r) => formatDate(r.createdAt) },
      { key: 'status', label: 'Trạng thái', type: 'tag', tag: (r) => FEEDBACK_STATUS(r.status) },
    ],
    formTitle: () => 'Góp ý',
    detail: (r) => [
      ['Người gửi', `${r.name} (${r.role})`],
      ['Email', <a key="m" className="text-link hover:underline" href={`mailto:${r.email}?subject=${encodeURIComponent(`Phản hồi: ${r.title}`)}`}>{r.email}</a>],
      ['Điện thoại', r.phone],
      ['Ngày gửi', formatDateTime(r.createdAt)],
      ['Tiêu đề', r.title],
      ['Nội dung', r.content],
    ],
    actions: (ctx) => [
      { key: 'eye', icon: 'eye', label: 'Xem', run: ctx.edit },
      { key: 'reply', icon: 'mail', label: 'Trả lời qua email', href: (r) => `mailto:${r.email}?subject=${encodeURIComponent(`Phản hồi: ${r.title}`)}` },
      { key: 'trash', icon: 'trash', label: 'Xoá', tone: 'danger', run: ctx.remove },
    ],
    fields: () => [
      {
        name: 'status',
        label: 'Trạng thái',
        type: 'select',
        required: true,
        options: [
          { value: 'NEW', label: 'Mới' },
          { value: 'SEEN', label: 'Đã xem' },
          { value: 'RESOLVED', label: 'Đã xử lý' },
        ],
      },
      { name: 'note', label: 'Ghi chú xử lý (nội bộ)', type: 'textarea', rows: 4 },
    ],
  },

  /* ---------- CLB kết bạn ---------- */
  clb: {
    title: 'Câu lạc bộ kết bạn',
    description: 'Đăng ký thành viên câu lạc bộ kết bạn – giao lưu của học sinh.',
    endpoint: '/admin/club-members',
    createLabel: 'Thêm thành viên',
    search: 'Tìm theo tên, lớp…',
    tabs: () => [
      { label: 'Chờ duyệt', query: { status: 'PENDING' }, countKey: 'PENDING' },
      { label: 'Thành viên', query: { status: 'APPROVED' }, countKey: 'APPROVED' },
      { label: 'Từ chối', query: { status: 'REJECTED' }, countKey: 'REJECTED' },
    ],
    filters: () => [{ name: 'grade', label: 'Mọi khối', options: ['10', '11', '12'].map((k) => ({ value: k, label: `Khối ${k}` })) }],
    rowClass: (r) => (r.status === 'PENDING' && Date.now() - new Date(r.createdAt).getTime() < 86_400_000 * 2 ? 'is-new' : undefined),
    columns: [
      { key: 'fullName', label: 'Học sinh', type: 'title', avatar: true, sub: (r) => `Lớp ${r.className}` },
      { key: 'hobbies', label: 'Sở thích', type: 'muted' },
      { key: 'language', label: 'Ngôn ngữ giao lưu', type: 'tag', tag: (r) => neutral(r.language) },
      { key: 'createdAt', label: 'Ngày đăng ký', type: 'muted', get: (r) => formatDate(r.createdAt) },
      { key: 'status', label: 'Trạng thái', type: 'tag', tag: (r) => CLUB_STATUS(r.status) },
    ],
    actions: (ctx) => [
      { key: 'check', icon: 'check', label: 'Duyệt', tone: 'ok', show: (r) => r.status !== 'APPROVED', run: (r) => ctx.patch(r, { status: 'APPROVED' }, 'Đã duyệt thành viên') },
      { key: 'x', icon: 'x', label: 'Từ chối', tone: 'danger', show: (r) => r.status === 'PENDING', run: (r) => ctx.patch(r, { status: 'REJECTED' }, 'Đã từ chối') },
      ...DEFAULT_ACTIONS(ctx),
    ],
    fields: () => [
      { name: 'fullName', label: 'Họ tên', type: 'text', required: true, half: true },
      { name: 'className', label: 'Lớp', type: 'text', required: true, half: true, placeholder: '10A2' },
      { name: 'hobbies', label: 'Sở thích', type: 'text' },
      { name: 'language', label: 'Ngôn ngữ giao lưu', type: 'select', options: opts(CLUB_LANGUAGES), half: true },
      {
        name: 'status',
        label: 'Trạng thái',
        type: 'select',
        required: true,
        half: true,
        options: [
          { value: 'APPROVED', label: 'Thành viên' },
          { value: 'PENDING', label: 'Chờ duyệt' },
          { value: 'REJECTED', label: 'Từ chối' },
        ],
      },
      { name: 'email', label: 'Email', type: 'email', half: true },
      { name: 'phone', label: 'Điện thoại', type: 'text', half: true },
      { name: 'introduction', label: 'Giới thiệu', type: 'textarea' },
    ],
  },

  /* ---------- Banner ---------- */
  banner: {
    title: 'Banner quảng cáo',
    description: 'Banner hiển thị ở trang chủ và cột bên trang tin. Đặt thời gian để tự bật/tắt.',
    endpoint: '/admin/banners',
    createLabel: 'Thêm banner',
    search: 'Tìm banner…',
    filters: () => [{ name: 'position', label: 'Mọi vị trí', options: Object.entries(POSITION_LABEL).map(([value, label]) => ({ value, label })) }],
    columns: [
      { key: 'name', label: 'Banner', type: 'title', thumb: (r) => r.image, sub: (r) => r.size },
      { key: 'position', label: 'Vị trí', type: 'tag', tag: (r) => neutral(POSITION_LABEL[r.position]) },
      { key: 'time', label: 'Thời gian hiển thị', type: 'muted', get: (r) => `${formatDate(r.startAt)} – ${formatDate(r.endAt)}` },
      { key: 'clicks', label: 'Lượt nhấp', type: 'num', align: 'right', get: (r) => formatNumber(r.clicks) },
      { key: 'state', label: 'Trạng thái', type: 'tag', tag: (r) => STATE(r.state) },
      { key: 'visible', label: 'Bật', type: 'toggle' },
    ],
    fields: () => [
      { name: 'name', label: 'Tên quản lý', type: 'text', required: true },
      { name: 'position', label: 'Vị trí', type: 'select', required: true, options: Object.entries(POSITION_LABEL).map(([value, label]) => ({ value, label })), half: true },
      { name: 'size', label: 'Kích thước', type: 'text', placeholder: '1200×320', half: true },
      { name: 'image', label: 'Ảnh banner', type: 'image' },
      { name: 'eyebrow', label: 'Dòng nhỏ phía trên', type: 'text' },
      { name: 'title', label: 'Tiêu đề', type: 'text' },
      { name: 'description', label: 'Mô tả', type: 'textarea', rows: 2 },
      { name: 'ctaLabel', label: 'Nhãn nút', type: 'text', half: true, placeholder: 'Xem chi tiết' },
      { name: 'link', label: 'Liên kết', type: 'text', half: true, placeholder: '/tuyen-sinh' },
      { name: 'startAt', label: 'Bắt đầu', type: 'datetime', half: true },
      { name: 'endAt', label: 'Kết thúc', type: 'datetime', half: true },
      { name: 'visible', label: 'Bật', type: 'toggle' },
    ],
  },

  /* ---------- Liên kết ---------- */
  'lien-ket': {
    title: 'Các liên kết',
    description: 'Liên kết hữu ích hiển thị ở trang chủ và chân trang.',
    endpoint: '/admin/links',
    createLabel: 'Thêm liên kết',
    search: 'Tìm liên kết…',
    paginated: false,
    reorder: true,
    filters: () => [{ name: 'position', label: 'Mọi vị trí', options: [{ value: 'HOME', label: 'Trang chủ' }, { value: 'FOOTER', label: 'Chân trang' }] }],
    columns: [
      { key: 'name', label: 'Tên liên kết', type: 'drag' },
      { key: 'url', label: 'Địa chỉ', type: 'link', href: (r) => r.url },
      { key: 'position', label: 'Vị trí', type: 'tag', tag: (r) => neutral(POSITION_LABEL[r.position]) },
      { key: 'openNewTab', label: 'Mở tab mới', type: 'toggle' },
      { key: 'visible', label: 'Hiển thị', type: 'toggle' },
    ],
    fields: () => [
      { name: 'name', label: 'Tên liên kết', type: 'text', required: true },
      { name: 'url', label: 'Địa chỉ', type: 'text', placeholder: 'https://moet.gov.vn' },
      { name: 'sub', label: 'Dòng phụ', type: 'text', placeholder: 'moet.gov.vn', half: true },
      { name: 'icon', label: 'Biểu tượng', type: 'icon', half: true },
      { name: 'position', label: 'Vị trí', type: 'select', required: true, options: [{ value: 'HOME', label: 'Trang chủ' }, { value: 'FOOTER', label: 'Chân trang' }] },
      { name: 'openNewTab', label: 'Mở tab mới', type: 'toggle' },
      { name: 'visible', label: 'Hiển thị', type: 'toggle' },
    ],
  },

  /* ---------- Người dùng ---------- */
  'nguoi-dung': {
    title: 'Quản lý người dùng',
    description: 'Tài khoản truy cập trang quản trị và phân quyền.',
    endpoint: '/admin/users',
    createLabel: 'Thêm người dùng',
    search: 'Tìm theo tên, email…',
    tabs: () => [
      { label: 'Tất cả', query: {}, countKey: 'ALL' },
      { label: 'Quản trị', query: { role: 'ADMIN' }, countKey: 'ADMIN' },
      { label: 'Biên tập', query: { role: 'EDITOR' }, countKey: 'EDITOR' },
      { label: 'Giáo viên', query: { role: 'TEACHER' }, countKey: 'TEACHER' },
    ],
    filters: ({ meta }) => [{ name: 'department', label: 'Mọi tổ / bộ phận', options: opts((meta.departments as string[]) ?? []) }],
    columns: [
      { key: 'fullName', label: 'Người dùng', type: 'title', avatar: true, sub: (r) => r.email },
      { key: 'role', label: 'Vai trò', type: 'tag', tag: (r) => ROLE(r.role) },
      { key: 'department', label: 'Tổ / bộ phận', type: 'muted' },
      { key: 'lastLoginAt', label: 'Đăng nhập gần nhất', type: 'muted', get: (r) => formatDateTime(r.lastLoginAt) },
      { key: 'status', label: 'Trạng thái', type: 'tag', tag: (r) => USER_STATUS(r.status) },
    ],
    actions: (ctx) => [
      { key: 'edit', icon: 'edit', label: 'Sửa', run: ctx.edit },
      {
        key: 'lock',
        icon: 'lock',
        label: 'Khoá / mở khoá',
        run: (r) => ctx.patch(r, { status: r.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED' }, r.status === 'LOCKED' ? 'Đã mở khoá tài khoản' : 'Đã khoá tài khoản'),
      },
      { key: 'trash', icon: 'trash', label: 'Xoá', tone: 'danger', run: ctx.remove },
    ],
    fields: ({ meta }) => [
      { name: 'fullName', label: 'Họ tên', type: 'text', required: true },
      { name: 'username', label: 'Tên đăng nhập', type: 'text', required: true, half: true },
      { name: 'email', label: 'Email', type: 'email', required: true, half: true },
      { name: 'password', label: 'Mật khẩu', type: 'password', required: (mode) => mode === 'create', hint: 'Tối thiểu 8 ký tự. Khi sửa: để trống nếu không đổi.' },
      {
        name: 'role',
        label: 'Vai trò',
        type: 'select',
        required: true,
        half: true,
        options: [
          { value: 'TEACHER', label: 'Giáo viên' },
          { value: 'EDITOR', label: 'Biên tập' },
          { value: 'ADMIN', label: 'Quản trị' },
        ],
      },
      {
        name: 'status',
        label: 'Trạng thái',
        type: 'select',
        required: true,
        half: true,
        options: [
          { value: 'ACTIVE', label: 'Hoạt động' },
          { value: 'LOCKED', label: 'Bị khoá' },
        ],
      },
      { name: 'department', label: 'Tổ / bộ phận', type: 'text', suggestions: (meta.departments as string[]) ?? [] },
    ],
  },
};
