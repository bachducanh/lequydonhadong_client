'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** Ô chọn lọc/sắp xếp cập nhật tham số trên URL (trang về 1). */
export function QuerySelect({ name, value, label, options }: { name: string; value?: string; label: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <select
      className="lqd-input lqd-select-sm"
      aria-label={label}
      value={value ?? ''}
      onChange={(e) => {
        const params = new URLSearchParams(search.toString());
        if (e.target.value) params.set(name, e.target.value);
        else params.delete(name);
        params.delete('trang');
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
