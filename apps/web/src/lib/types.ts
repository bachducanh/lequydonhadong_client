/** Kiểu dữ liệu trả về từ API (apps/api). */

export type Tone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
export type ApiTone = 'BRAND' | 'NEUTRAL' | 'SUCCESS' | 'WARNING' | 'DANGER';
export type Role = 'ADMIN' | 'EDITOR' | 'TEACHER';
export type PostStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED';

export interface Paged<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number; counts?: Record<string, number>; [key: string]: unknown };
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface PostCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail: string | null;
  publishedAt: string | null;
  views: number;
  featured: boolean;
  badge: string | null;
  badgeTone: ApiTone | null;
  category: CategoryRef | null;
}

export interface PostDetail extends PostCard {
  content: string;
  imageCaption: string | null;
  allowComments: boolean;
  authorName: string;
  updatedAt: string;
  category: (CategoryRef & { parent: { name: string; slug: string } | null }) | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  depth: number;
  showInMenu: boolean;
  order: number;
  description: string | null;
}

export interface CommentItem {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export interface LegalDocument {
  id: string;
  code: string | null;
  title: string;
  issuer: string;
  type: string;
  issuedAt: string | null;
  effective: boolean;
  visible: boolean;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
}

export interface DownloadFile {
  id: string;
  name: string;
  category: string;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  downloads: number;
  visible: boolean;
  createdAt: string;
}

export interface TickerItem {
  id: string;
  text: string;
  link: string | null;
}

export interface Slide {
  id: string;
  eyebrow: string | null;
  title: string;
  lead: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  secondaryLabel: string | null;
  secondaryHref: string | null;
  image: string | null;
  imageAlt: string | null;
  caption: string | null;
  order: number;
  visible: boolean;
}

export interface AlbumCard {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  eventDate: string | null;
  schoolYear: string | null;
  visible: boolean;
  photoCount: number;
}

export interface AlbumPhoto {
  id: string;
  url: string;
  caption: string | null;
  order: number;
}

export interface AlbumDetail extends Omit<AlbumCard, 'photoCount'> {
  photos: AlbumPhoto[];
}

export interface LibraryType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  allowedFormats: string | null;
  order: number;
  visible: boolean;
  itemCount: number;
}

export interface LibraryItem {
  id: string;
  title: string;
  description: string | null;
  typeId: string;
  type: { id: string; name: string; slug: string };
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  externalUrl: string | null;
  thumbnail: string | null;
  visible: boolean;
  createdAt: string;
}

export interface Question {
  id: string;
  question: string;
  askerName: string;
  topic: string;
  answer: string | null;
  answeredBy: string | null;
  answeredAt: string | null;
  createdAt: string;
}

export interface Banner {
  id: string;
  name: string;
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  ctaLabel: string | null;
  link: string | null;
  image: string | null;
  position: 'HOME' | 'SIDEBAR' | 'FOOTER';
}

export interface LinkItem {
  id: string;
  name: string;
  url: string | null;
  sub: string | null;
  icon: string | null;
  position: 'HOME' | 'FOOTER';
  openNewTab: boolean;
}

export interface HomeData {
  tickers: TickerItem[];
  slides: Slide[];
  featured: PostCard | null;
  news: PostCard[];
  announcements: PostCard[];
  documents: LegalDocument[];
  albums: AlbumCard[];
  banner: Banner | null;
  links: LinkItem[];
}

export interface SearchResult {
  query: string;
  posts: PostCard[];
  documents: LegalDocument[];
  downloads: DownloadFile[];
  questions: Question[];
}

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  department: string | null;
  status: 'ACTIVE' | 'LOCKED';
  lastLoginAt: string | null;
}

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
}
