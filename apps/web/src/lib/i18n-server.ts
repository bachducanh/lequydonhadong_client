import { cookies } from 'next/headers';
import { cache } from 'react';
import { dict, isLang, LANG_COOKIE, type Lang } from './i18n';

/** Ngôn ngữ người xem chọn (cookie lqd_lang), mặc định tiếng Việt. Dùng trong Server Components. */
export const getLang = cache(async (): Promise<Lang> => {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : 'vi';
});

export async function getI18n() {
  const lang = await getLang();
  return { lang, t: dict(lang) };
}
