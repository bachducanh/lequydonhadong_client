'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, type FormEvent, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Avatar, Button, Field, IconButton, LOGO_SRC } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { api } from '@/lib/client-api';
import { cx } from '@/lib/cx';
import type { CurrentUser, Role } from '@/lib/types';
import { ADMIN_NAV, type AdminKey, canAccess, ROLE_LABEL } from './admin-nav';
import { AdminProviders, Drawer, useToast } from './ui';

type AdminCtx = { user: CurrentUser | null; refreshBadges: () => void };
const Ctx = createContext<AdminCtx>({ user: null, refreshBadges: () => undefined });
export const useAdmin = () => useContext(Ctx);

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminProviders>
      <Shell>{children}</Shell>
    </AdminProviders>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const active = (pathname.split('/')[2] as AdminKey | undefined) ?? 'dashboard';

  const refreshBadges = useCallback(() => {
    api<Record<string, number>>('/admin/stats/badges').then(setBadges).catch(() => undefined);
  }, []);

  useEffect(() => {
    api<CurrentUser>('/auth/me')
      .then(setUser)
      .catch(() => router.replace(`/dang-nhap?next=${encodeURIComponent(pathname)}`));
    refreshBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/dang-nhap');
    router.refresh();
  };

  return (
    <Ctx.Provider value={{ user, refreshBadges }}>
      <div className="lqd-admin" style={{ minHeight: '100vh' }}>
        <aside className={cx('lqd-admin-side', menuOpen && 'is-open')}>
          <div className="lqd-admin-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt="" width={36} height={36} />
            <span>
              <b>LQĐ Hà Đông</b>
              <small>Quản trị website</small>
            </span>
          </div>
          <nav aria-label="Quản trị">
            {ADMIN_NAV.map((g) => {
              const items = g.items.filter((it) => !user || canAccess(it.key, user.role));
              if (!items.length) return null;
              return (
                <div className="lqd-admin-group" key={g.group ?? 'root'}>
                  {g.group && <p>{g.group}</p>}
                  {items.map((it) => (
                    <Link key={it.key} href={it.key === 'dashboard' ? '/quan-tri' : `/quan-tri/${it.key}`} aria-current={active === it.key ? 'page' : undefined}>
                      <Icon name={it.icon} />
                      <span>{it.label}</span>
                      {badges[it.key] ? <em>{badges[it.key]}</em> : null}
                    </Link>
                  ))}
                </div>
              );
            })}
          </nav>
          <button type="button" className="lqd-admin-logout" onClick={logout}>
            <Icon name="logout" />
            Đăng xuất
          </button>
        </aside>
        {menuOpen && <div className="fixed inset-0 z-30 bg-black/40 min-[861px]:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
        <div className="lqd-admin-main">
          <header className="lqd-admin-top">
            <div className="flex flex-1 items-center gap-2">
              <IconButton icon="menu" label="Mở menu quản trị" className="lqd-admin-menu-btn" onClick={() => setMenuOpen(true)} />
              <form
                className="lqd-admin-search"
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = new FormData(e.currentTarget).get('q');
                  if (q) router.push(`/quan-tri/tin-bai?q=${encodeURIComponent(String(q))}`);
                }}
              >
                <Icon name="search" />
                <input name="q" placeholder="Tìm tin bài trong quản trị…" aria-label="Tìm trong quản trị" />
              </form>
            </div>
            <div className="lqd-admin-top-actions">
              <a href="/" target="_blank" rel="noopener" className="lqd-link-plain">
                <Icon name="external" />
                <span className="hidden sm:inline">Xem website</span>
              </a>
              <button type="button" className="lqd-admin-user cursor-pointer border-0 bg-transparent p-0 text-left" onClick={() => setAccountOpen(true)} title="Tài khoản">
                <Avatar name={user?.fullName ?? '?'} size="sm" />
                <span>
                  <b>{user?.fullName ?? '…'}</b>
                  <small>{user ? ROLE_LABEL[user.role] : ''}</small>
                </span>
              </button>
            </div>
          </header>
          <main className="lqd-admin-content">
            {user && !canAccess(active, user.role) ? (
              <div className="lqd-empty">
                <Icon name="lock" />
                <b>Bạn không có quyền truy cập mục này</b>
                <span>Liên hệ quản trị viên nếu cần được cấp quyền.</span>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
      {accountOpen && user && <AccountDrawer user={user} onClose={() => setAccountOpen(false)} onLogout={logout} />}
    </Ctx.Provider>
  );
}

function AccountDrawer({ user, onClose, onLogout }: { user: CurrentUser; onClose: () => void; onLogout: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = new FormData(e.currentTarget);
    if (v.get('newPassword') !== v.get('confirm')) return toast('Mật khẩu nhập lại không khớp', true);
    setBusy(true);
    try {
      await api('/auth/me/password', { method: 'PATCH', body: { currentPassword: v.get('currentPassword'), newPassword: v.get('newPassword') } });
      toast('Đã đổi mật khẩu');
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không đổi được mật khẩu', true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Drawer
      title="Tài khoản"
      onClose={onClose}
      footer={
        <Button variant="secondary" iconLeft="logout" onClick={onLogout}>
          Đăng xuất
        </Button>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar name={user.fullName} />
        <div>
          <b className="block">{user.fullName}</b>
          <span className="text-sm text-ink-muted">
            {user.email} · {ROLE_LABEL[user.role]}
            {user.department ? ` · ${user.department}` : ''}
          </span>
        </div>
      </div>
      <form className="lqd-stack" onSubmit={onSubmit}>
        <h3 className="m-0 text-base">Đổi mật khẩu</h3>
        <Field label="Mật khẩu hiện tại" required>
          <input className="lqd-input" type="password" name="currentPassword" required autoComplete="current-password" />
        </Field>
        <Field label="Mật khẩu mới" required hint="Tối thiểu 8 ký tự">
          <input className="lqd-input" type="password" name="newPassword" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label="Nhập lại mật khẩu mới" required>
          <input className="lqd-input" type="password" name="confirm" required minLength={8} autoComplete="new-password" />
        </Field>
        <div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Đổi mật khẩu'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
