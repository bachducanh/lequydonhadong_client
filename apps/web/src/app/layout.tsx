import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

const font = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Trường THPT Lê Quý Đôn – Hà Đông',
    template: '%s · THPT Lê Quý Đôn – Hà Đông',
  },
  description: 'Website chính thức Trường THPT Lê Quý Đôn – Hà Đông: tin tức, thông báo, văn bản, tuyển sinh, thư viện và hỏi đáp.',
  openGraph: { type: 'website', locale: 'vi_VN', siteName: 'Trường THPT Lê Quý Đôn – Hà Đông' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#071F4A' },
    { media: '(prefers-color-scheme: dark)', color: '#050F1F' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={font.variable}>
      <body>{children}</body>
    </html>
  );
}
