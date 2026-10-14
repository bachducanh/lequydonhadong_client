'use client';

import { createContext, type ReactNode, useContext } from 'react';
import { dict, type Lang } from '@/lib/i18n';

const LangContext = createContext<Lang>('vi');

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** Ngôn ngữ hiện tại + từ điển cho Client Components (trang quản trị không bọc provider -> tiếng Việt). */
export function useI18n() {
  const lang = useContext(LangContext);
  return { lang, t: dict(lang) };
}
