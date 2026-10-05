'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import { isExternal } from '@/lib/format';
import type { AlbumPhoto, Banner } from '@/lib/types';

/** Đếm lượt xem bài viết (API chống đếm trùng theo IP). */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/bff/posts/${encodeURIComponent(slug)}/view`, { method: 'POST' }).catch(() => undefined);
  }, [slug]);
  return null;
}

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      iconLeft={copied ? 'check' : 'link'}
      onClick={async () => {
        await navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? 'Đã sao chép' : 'Sao chép liên kết'}
    </Button>
  );
}

/** Banner quảng cáo nội bộ (khối nền primary có nút cta) — đếm lượt nhấp. */
export function PromoBanner({ banner, seed = 1 }: { banner: Banner; seed?: number }) {
  const href = banner.link || '#';
  const track = () => {
    navigator.sendBeacon?.(`/api/bff/banners/${banner.id}/click`);
  };
  const content = (
    <>
      <div className="lqd-promo-text">
        {banner.eyebrow && <p className="lqd-eyebrow">{banner.eyebrow}</p>}
        <h3>{banner.title || banner.name}</h3>
        {banner.description && <p>{banner.description}</p>}
        <span className="lqd-promo-cta">
          {banner.ctaLabel || 'Xem chi tiết'}
          <Icon name="arrow" />
        </span>
      </div>
      <Thumb seed={seed} src={banner.image} className="lqd-promo-media" />
    </>
  );
  return isExternal(href) ? (
    <a className="lqd-promo" href={href} target="_blank" rel="noopener noreferrer" onClick={track}>
      {content}
    </a>
  ) : (
    <Link className="lqd-promo" href={href} onClick={track}>
      {content}
    </Link>
  );
}

/** Lưới ảnh album + xem ảnh lớn (phím ←/→/Esc). */
export function PhotoGrid({ photos, title }: { photos: AlbumPhoto[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const n = photos.length;
  const go = useCallback((delta: number) => setIndex((i) => (i === null ? i : (i + delta + n) % n)), [n]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, go]);

  const current = index !== null ? photos[index] : null;
  return (
    <>
      <div className="lqd-photos">
        {photos.map((p, k) => (
          <button key={p.id} type="button" className="lqd-photo" onClick={() => setIndex(k)} aria-label={`Xem ảnh ${k + 1}: ${p.caption ?? title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption ?? ''} loading="lazy" />
          </button>
        ))}
      </div>
      {current && (
        <div className="lqd-lightbox" role="dialog" aria-modal="true" aria-label={`Ảnh ${index! + 1} / ${n}`}>
          <div className="lqd-lightbox-top">
            <span>
              {title} · {index! + 1} / {n}
            </span>
            <button type="button" onClick={() => setIndex(null)} aria-label="Đóng" autoFocus>
              <Icon name="x" />
            </button>
          </div>
          <div className="lqd-lightbox-stage">
            <button type="button" onClick={() => go(-1)} aria-label="Ảnh trước">
              <Icon name="chevronLeft" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt={current.caption ?? ''} />
            <button type="button" onClick={() => go(1)} aria-label="Ảnh sau">
              <Icon name="chevron" />
            </button>
          </div>
          <p className="lqd-lightbox-caption">{current.caption}</p>
        </div>
      )}
    </>
  );
}
