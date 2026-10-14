import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { I18nProvider } from '@/components/i18n-provider';
import { getI18n } from '@/lib/i18n-server';
import './globals.css';

const font = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getI18n();
  return {
    metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
    title: { default: t.common.siteName, template: `%s · ${t.common.siteName}` },
    description: t.meta.description,
    openGraph: { type: 'website', locale: lang === 'en' ? 'en_US' : 'vi_VN', siteName: t.common.siteName },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#071F4A',
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang } = await getI18n();
  return (
    <html lang={lang} className={font.variable}>
      <body>
        <I18nProvider lang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
