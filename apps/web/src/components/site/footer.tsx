import Link from 'next/link';
import { Logo } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { dict, type Lang } from '@/lib/i18n';
import { footerColumns, SCHOOL } from '@/lib/site';
import type { LinkItem } from '@/lib/types';
import { LanguageLinks } from './language-switcher';

/** Chân trang trên nền surface-inverse: logo, liên hệ, 3 cột link, chọn ngôn ngữ. */
export function Footer({ lang, extraLinks = [] }: { lang: Lang; extraLinks?: LinkItem[] }) {
  const t = dict(lang);
  const columns = footerColumns(lang).map((c, i) =>
    i === 2 ? { ...c, links: [...c.links, ...extraLinks.filter((l) => l.url).map((l) => ({ label: l.name, href: l.url! }))] } : c,
  );
  return (
    <footer className="lqd-footer">
      <div className="lqd-container">
        <div className="lqd-footer-grid">
          <div>
            <Logo inverse size={56} lang={lang} />
            <div className="lqd-footer-contact">
              <div>
                <Icon name="pin" />
                <span>{t.footer.address}</span>
              </div>
              <div>
                <Icon name="phone" />
                <a href={SCHOOL.phoneHref}>{SCHOOL.phone}</a>
              </div>
              <div>
                <Icon name="mail" />
                <a href={`mailto:${SCHOOL.email}`}>{SCHOOL.email}</a>
              </div>
            </div>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <h5>{c.title}</h5>
              <ul>
                {c.links.map((l) => (
                  <li key={l.label}>
                    {/^https?:/.test(l.href) ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="lqd-footer-bottom">
          <span>
            © {new Date().getFullYear()} {t.common.siteName}
          </span>
          <LanguageLinks />
        </div>
      </div>
    </footer>
  );
}
