'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { Button, Logo } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { cx } from '@/lib/cx';
import { navItems } from '@/lib/site';
import { LanguageLinks, LanguageSwitcher } from './language-switcher';

/** Đầu trang tối giản kiểu edX: thanh trên chỉ có chọn ngôn ngữ + Đăng nhập; menu chính 5 mục; nút cta Tuyển sinh. */
export function Navbar({ loggedIn }: { loggedIn?: boolean }) {
  const pathname = usePathname();
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const nav = navItems(lang);

  // Đóng menu di động khi đổi trang (vd bấm Back)
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="lqd-header">
      <div className="lqd-topbar">
        <div className="lqd-container">
          <LanguageSwitcher inverse />
          {loggedIn ? (
            <Link href="/quan-tri" className="lqd-topbar-login">
              <Icon name="dashboard" />
              {t.nav.admin}
            </Link>
          ) : (
            <Link href="/dang-nhap" className="lqd-topbar-login">
              <Icon name="user" />
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>
      <nav className="lqd-nav" aria-label={t.nav.aria}>
        <div className="lqd-container">
          <Logo lang={lang} />
          <div className="lqd-nav-links">
            {nav.map((l) => (
              <Link key={l.key} href={l.href} aria-current={isCurrent(l.href) ? 'page' : undefined}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="lqd-nav-actions">
            <Link className="lqd-iconbtn" href="/tim-kiem" aria-label={t.common.search} title={t.common.search}>
              <Icon name="search" />
            </Link>
            <Button variant="cta" size="sm" href="/tuyen-sinh" className="lqd-nav-cta">
              {t.nav.cta}
            </Button>
            <button
              type="button"
              className="lqd-iconbtn lqd-nav-toggle"
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={open}
              aria-controls="lqd-mobile-menu"
              onClick={() => setOpen(!open)}
            >
              <Icon name={open ? 'x' : 'menu'} />
            </button>
          </div>
        </div>
      </nav>
      <div id="lqd-mobile-menu" className={cx('lqd-mobile-menu', open && 'is-open')}>
        {nav.map((l) => (
          <Link key={l.key} href={l.href} aria-current={isCurrent(l.href) ? 'page' : undefined} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        <Link className="lqd-btn lqd-btn-cta" href="/tuyen-sinh" onClick={() => setOpen(false)}>
          {t.nav.cta}
        </Link>
        <LanguageLinks className="lqd-mobile-lang" />
      </div>
    </header>
  );
}
