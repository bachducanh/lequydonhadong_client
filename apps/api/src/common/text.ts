import sanitizeHtml from 'sanitize-html';

/** "Khai giảng năm học 2026–2027" -> "khai-giang-nam-hoc-2026-2027" */
export function slugify(input: string, fallback = 'muc'): string {
  const slug = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/g, '');
  return slug || fallback;
}

export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>, fallback?: string) {
  const root = slugify(base, fallback);
  let slug = root;
  for (let i = 2; await exists(slug); i++) slug = `${root}-${i}`;
  return slug;
}

/** Làm sạch HTML từ trình soạn thảo trước khi lưu. */
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote',
      'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'iframe', 'span', 'div',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'width', 'height', 'title'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'title'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs,
      }),
    },
  });
}

/** Multer giải mã tên tệp theo latin1; chuyển lại UTF-8 để giữ dấu tiếng Việt. */
export function decodeFileName(name: string): string {
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  return decoded.includes('�') ? name : decoded;
}

/** undefined giữ nguyên (không cập nhật), chuỗi rỗng/null -> null, còn lại -> Date. */
export function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (!value) return null;
  return new Date(value);
}

/** undefined giữ nguyên, chuỗi rỗng -> null. */
export function orNull<T>(value: T | '' | null | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === '' || value === null) return null;
  return value;
}
