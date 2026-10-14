'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { Icon } from '@/components/ui/icon';
import { cx } from '@/lib/cx';
import { LANG_COOKIE, LANG_NAMES, LANGS, type Lang } from '@/lib/i18n';

function useSetLang() {
  const router = useRouter();
  return (lang: Lang) => {
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = lang;
    router.refresh();
  };
}

/**
 * Nút chọn ngôn ngữ kiểu edX: biểu tượng quả địa cầu + tên ngôn ngữ, bấm mở danh sách.
 * `inverse` cho nền tối; `align="end"` khi nút nằm sát mép phải (menu mở sang trái).
 */
export function LanguageSwitcher({ inverse, align = 'start' }: { inverse?: boolean; align?: 'start' | 'end' }) {
  const { lang, t } = useI18n();
  const setLang = useSetLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={cx('lqd-lang', inverse && 'lqd-lang-inverse')} ref={ref}>
      <button type="button" className="lqd-lang-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`${t.lang.switchTo}: ${LANG_NAMES[lang]}`} onClick={() => setOpen(!open)}>
        <Icon name="globe" />
        <span>{LANG_NAMES[lang]}</span>
        <Icon name="chevronDown" className="lqd-lang-chev" />
      </button>
      {open && (
        <ul className={cx('lqd-lang-menu', align === 'end' && 'lqd-lang-menu-end')} role="listbox" aria-label={t.lang.label}>
          {LANGS.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={lang === l}
                lang={l}
                onClick={() => {
                  setOpen(false);
                  if (l !== lang) setLang(l);
                }}
              >
                {LANG_NAMES[l]}
                {lang === l && <Icon name="check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Dòng "Tiếng Việt · English" ở chân trang / menu di động. */
export function LanguageLinks({ className }: { className?: string }) {
  const { lang, t } = useI18n();
  const setLang = useSetLang();
  return (
    <span className={cx('lqd-lang-links', className)} role="group" aria-label={t.lang.label}>
      <Icon name="globe" />
      {LANGS.map((l, i) => (
        <span key={l}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <button type="button" lang={l} aria-current={lang === l ? 'true' : undefined} onClick={() => l !== lang && setLang(l)}>
            {LANG_NAMES[l]}
          </button>
        </span>
      ))}
    </span>
  );
}
