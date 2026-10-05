import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { isExternal } from '@/lib/format';
import type { Tone } from '@/lib/types';
import { Icon, type IconName } from './icon';

export const LOGO_SRC = '/images/lqd-logo.png';

export function Logo({ size = 48, withText = true, inverse, href = '/' }: { size?: number; withText?: boolean; inverse?: boolean; href?: string }) {
  return (
    <Link className={cx('lqd-logo', inverse && 'lqd-logo-inverse')} href={href} aria-label="Trường THPT Lê Quý Đôn – Hà Đông, trang chủ">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_SRC} alt="" width={size} height={size} style={{ width: size, height: size }} />
      {withText && (
        <span className="lqd-logo-text">
          <span className="lqd-logo-kicker">Trường THPT</span>
          <b>Lê Quý Đôn – Hà Đông</b>
        </span>
      )}
    </Link>
  );
}

type ButtonProps = {
  variant?: 'primary' | 'cta' | 'secondary' | 'ghost' | 'inverse' | 'inverse-outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconLeft?: IconName;
  href?: string;
  download?: boolean | string;
  newTab?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/** Nút bo tròn dạng viên thuốc (pill) như edX. */
export function Button({ variant = 'primary', size = 'md', icon, iconLeft, href, download, newTab, className, children, ...rest }: ButtonProps) {
  const cls = cx('lqd-btn', `lqd-btn-${variant}`, size !== 'md' && `lqd-btn-${size}`, className);
  const kids = (
    <>
      {iconLeft && <Icon name={iconLeft} />}
      {children}
      {icon && <Icon name={icon} />}
    </>
  );
  if (href) {
    if (isExternal(href) || download || newTab || href.startsWith('/uploads/') || href.startsWith('/api/')) {
      return (
        <a
          className={cls}
          href={href}
          download={download === true ? '' : download || undefined}
          target={newTab || isExternal(href) ? '_blank' : undefined}
          rel={newTab || isExternal(href) ? 'noopener noreferrer' : undefined}
        >
          {kids}
        </a>
      );
    }
    return (
      <Link className={cls} href={href}>
        {kids}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {kids}
    </button>
  );
}

export function IconButton({ icon, label, onClick, className, disabled }: { icon: IconName; label: string; onClick?: () => void; className?: string; disabled?: boolean }) {
  return (
    <button type="button" className={cx('lqd-iconbtn', className)} aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      <Icon name={icon} />
    </button>
  );
}

const TAG_ICON: Partial<Record<Tone, IconName>> = { success: 'check', warning: 'clock', danger: 'alert' };

/** Nhãn chuyên mục / trạng thái. Tone trạng thái tự kèm icon — không chỉ dựa vào màu. */
export function Tag({ tone = 'brand', noIcon, children }: { tone?: Tone; noIcon?: boolean; children: ReactNode }) {
  const icon = TAG_ICON[tone];
  return (
    <span className={cx('lqd-tag', tone !== 'brand' && `lqd-tag-${tone}`)}>
      {!noIcon && icon && <Icon name={icon} />}
      {children}
    </span>
  );
}

/** Link hành động có mũi tên ("Xem tất cả"). */
export function TextLink({ href = '#', children }: { href?: string; children: ReactNode }) {
  return (
    <Link className="lqd-link" href={href}>
      {children}
      <Icon name="arrow" />
    </Link>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="lqd-crumbs" aria-label="Breadcrumb">
      {items.map((c, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <Icon name="chevron" />}
          {i === items.length - 1 || !c.href ? (
            <span aria-current={i === items.length - 1 ? 'page' : undefined}>{c.label}</span>
          ) : (
            <Link href={c.href}>{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Field({ label, required, hint, children, className }: { label: string; required?: boolean; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx('lqd-field', className)}>
      <span className="lqd-field-label">
        {label}
        {required && <i aria-hidden="true"> *</i>}
      </span>
      {children}
      {hint && <span className="lqd-field-hint">{hint}</span>}
    </label>
  );
}

function initials(name: string) {
  const p = String(name || '?').trim().split(/\s+/);
  return (p.length > 1 ? p[p.length - 2][0] + p[p.length - 1][0] : p[0][0]).toUpperCase();
}

export function Avatar({ name, size }: { name: string; size?: 'sm' }) {
  return (
    <span className={cx('lqd-avatar', size === 'sm' && 'lqd-avatar-sm')} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Toggle({ checked, label, onChange, disabled }: { checked: boolean; label: string; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} title={label} className="lqd-toggle" disabled={disabled} onClick={() => onChange?.(!checked)}>
      <span />
    </button>
  );
}

export function Empty({ icon = 'inbox', title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="lqd-empty">
      <Icon name={icon} />
      <b>{title}</b>
      {children && <span>{children}</span>}
    </div>
  );
}

/**
 * Phân trang. `hrefFor` cho trang công khai (link, không cần JS); `onChange` cho trang quản trị.
 */
export function Pagination({ page, total, hrefFor, onChange }: { page: number; total: number; hrefFor?: (p: number) => string; onChange?: (p: number) => void }) {
  if (total <= 1) return null;
  const pages: (number | '…')[] = [];
  for (let k = 1; k <= total; k++) {
    if (total <= 7 || k <= 3 || k === total || Math.abs(k - page) <= 1) pages.push(k);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  const item = (p: number, label: ReactNode, attrs: { disabled?: boolean; current?: boolean; aria?: string }) => {
    if (hrefFor && !attrs.disabled) {
      return (
        <Link key={`${p}-${attrs.aria ?? ''}`} href={hrefFor(p)} aria-label={attrs.aria} aria-current={attrs.current ? 'page' : undefined} scroll>
          {label}
        </Link>
      );
    }
    return (
      <button
        key={`${p}-${attrs.aria ?? ''}`}
        type="button"
        aria-label={attrs.aria}
        aria-current={attrs.current ? 'page' : undefined}
        disabled={attrs.disabled}
        onClick={onChange ? () => onChange(p) : undefined}
      >
        {label}
      </button>
    );
  };
  return (
    <nav className="lqd-pager" aria-label="Phân trang">
      {item(page - 1, <Icon name="chevronLeft" />, { disabled: page <= 1, aria: 'Trang trước' })}
      {pages.map((p, k) => (p === '…' ? <span key={`gap-${k}`} className="lqd-pager-gap">…</span> : item(p, p, { current: p === page })))}
      {item(page + 1, <Icon name="chevron" />, { disabled: page >= total, aria: 'Trang sau' })}
    </nav>
  );
}

/** Chip lọc dạng pill có số đếm; link (công khai) hoặc nút (quản trị). */
export function FilterTabs({
  items,
  value,
  onChange,
}: {
  items: { label: string; count?: number; href?: string }[];
  value: number;
  onChange?: (i: number) => void;
}) {
  return (
    <div className="lqd-tabs" role={onChange ? 'tablist' : undefined}>
      {items.map((t, k) => {
        const kids = (
          <>
            {t.label}
            {t.count != null && <span className="lqd-tabs-count">{t.count}</span>}
          </>
        );
        return t.href ? (
          <Link key={k} href={t.href} aria-current={value === k ? 'page' : undefined} scroll={false}>
            {kids}
          </Link>
        ) : (
          <button key={k} type="button" role="tab" aria-selected={value === k} onClick={onChange ? () => onChange(k) : undefined}>
            {kids}
          </button>
        );
      })}
    </div>
  );
}
