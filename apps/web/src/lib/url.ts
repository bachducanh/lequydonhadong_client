type Params = Record<string, string | number | null | undefined>;

/** hrefWith('/tin-tuc', { 'chuyen-muc': 'thong-bao', trang: 2 }) -> '/tin-tuc?chuyen-muc=thong-bao&trang=2' */
export function hrefWith(base: string, params: Params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && !(k === 'trang' && Number(v) === 1)) sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}
