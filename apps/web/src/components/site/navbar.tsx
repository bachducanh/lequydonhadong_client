'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button, Logo } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { cx } from '@/lib/cx';
import { NAV } from '@/lib/site';

/** Đầu trang tối giản kiểu edX: thanh trên chỉ có Đăng nhập; menu chính 5 mục; nút cta Tuyển sinh. */
export function Navbar({ loggedIn }: { loggedIn?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="lqd-header">
      <div className="lqd-topbar">
        <div className="lqd-container">
          {loggedIn ? (
            <Link href="/quan-tri" className="lqd-topbar-login">
              <Icon name="dashboard" />
              Trang quản trị
            </Link>
          ) : (
            <Link href="/dang-nhap" className="lqd-topbar-login">
              <Icon name="user" />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
      <nav className="lqd-nav" aria-label="Điều hướng chính">
        <div className="lqd-container">
          <Logo />
          <div className="lqd-nav-links">
            {NAV.map((l) => (
              <Link key={l.key} href={l.href} aria-current={isCurrent(l.href) ? 'page' : undefined}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="lqd-nav-actions">
            <Link className="lqd-iconbtn" href="/tim-kiem" aria-label="Tìm kiếm" title="Tìm kiếm">
              <Icon name="search" />
            </Link>
            <Button variant="cta" size="sm" href="/tuyen-sinh" className="lqd-nav-cta">
              Tuyển sinh 2027
            </Button>
            <button
              type="button"
              className="lqd-iconbtn lqd-nav-toggle"
              aria-label={open ? 'Đóng menu' : 'Mở menu'}
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
        {NAV.map((l) => (
          <Link key={l.key} href={l.href} aria-current={isCurrent(l.href) ? 'page' : undefined} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        <Link className="lqd-btn lqd-btn-cta" href="/tuyen-sinh" onClick={() => setOpen(false)}>
          Tuyển sinh 2027
        </Link>
      </div>
    </header>
  );
}
