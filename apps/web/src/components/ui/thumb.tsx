import type { CSSProperties, ReactNode } from 'react';
import { cx } from '@/lib/cx';

/** Khối hình học màu thương hiệu thay cho ảnh khi chưa có ảnh thật (LQD.Thumb). */
const ARTS: [string, number, number, number, number?][][] = [
  [['sky', 58, 18, 36], ['blue', 40, 52, 22], ['navy', 8, 70, 10, 1]],
  [['blue', 20, 30, 30], ['sky', 70, 60, 26], ['red', 84, 18, 8]],
  [['navy', 70, 40, 34], ['sky', 30, 70, 20], ['blue', 22, 22, 12]],
  [['sky', 30, 40, 34], ['blue', 76, 26, 18], ['navy', 70, 74, 12, 1]],
];

export function Thumb({
  seed = 0,
  src,
  alt = '',
  className,
  style,
  children,
}: {
  seed?: number;
  src?: string | null;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const art = ARTS[seed % ARTS.length];
  return (
    <div className={cx('lqd-thumb', className)} style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {art.map(([color, x, y, size, pill], i) => {
            const r = size * 0.7;
            return pill ? (
              <rect key={i} className={`t-${color}`} x={x - r * 1.6} y={y - r / 2} width={r * 3.2} height={r} rx={r / 2} />
            ) : (
              <circle key={i} className={`t-${color}`} cx={x} cy={y} r={r} />
            );
          })}
        </svg>
      )}
      {children}
    </div>
  );
}
