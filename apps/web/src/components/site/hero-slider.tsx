'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { cx } from '@/lib/cx';
import { isExternal } from '@/lib/format';
import type { Slide } from '@/lib/types';

/**
 * Banner trang chủ (quản lý ở "Ảnh giới thiệu"): mỗi slide là một ảnh tràn hết chiều ngang (khung 1920×800).
 * Bấm ảnh mở liên kết của slide. Tự chuyển 6 giây, dừng khi rê chuột/focus, vuốt được trên điện thoại;
 * tắt hiệu ứng chuyển khi người dùng chọn giảm chuyển động. Chưa có ảnh nào: hiện dải chào mừng.
 */
export function HeroSlider({ slides: input, interval = 6000, autoplay = true }: { slides: Slide[]; interval?: number; autoplay?: boolean }) {
  const { t } = useI18n();
  const slides = input.filter((s) => s.image);
  const n = slides.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (paused || reduced || n < 2 || !autoplay) return;
    const timer = setTimeout(() => setI((i + 1) % n), interval);
    return () => clearTimeout(timer);
  }, [i, paused, reduced, n, autoplay, interval]);

  useEffect(() => {
    if (i >= n && n > 0) setI(0);
  }, [i, n]);

  if (!n) {
    return (
      <section className="lqd-hero-fallback">
        <div className="lqd-container">
          <p className="lqd-slide-eyebrow">{t.slider.defaultEyebrow}</p>
          <h1>{t.slider.defaultTitle}</h1>
          <p className="lqd-slide-lead">{t.slider.defaultLead}</p>
          <div className="lqd-row" style={{ gap: 12 }}>
            <Button variant="cta" size="lg" icon="arrow" href="/gioi-thieu">
              {t.slider.defaultCta}
            </Button>
            <Button variant="inverse-outline" size="lg" href="/tin-tuc">
              {t.slider.defaultSecondary}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const go = (k: number) => setI((k + n) % n);

  return (
    <section
      className="lqd-banner"
      aria-roledescription="carousel"
      aria-label={t.slider.aria}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start === null || n < 2) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
      }}
    >
      <div className={cx('lqd-banner-track', reduced && 'is-instant')} style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, k) => {
          const img = (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image!} alt={s.imageAlt || s.title} loading={k === 0 ? 'eager' : 'lazy'} fetchPriority={k === 0 ? 'high' : 'auto'} draggable={false} />
          );
          let content: ReactNode = img;
          if (s.ctaHref) {
            content = isExternal(s.ctaHref) ? (
              <a href={s.ctaHref} target="_blank" rel="noopener noreferrer" tabIndex={k === i ? 0 : -1} aria-label={s.title}>
                {img}
              </a>
            ) : (
              <Link href={s.ctaHref} tabIndex={k === i ? 0 : -1} aria-label={s.title}>
                {img}
              </Link>
            );
          }
          return (
            <div key={s.id} className="lqd-banner-slide" role="group" aria-roledescription="slide" aria-label={`${k + 1} / ${n}`} aria-hidden={k !== i}>
              {content}
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <>
          <button type="button" className="lqd-banner-arrow is-prev" aria-label={t.slider.prev} onClick={() => go(i - 1)}>
            <Icon name="chevronLeft" />
          </button>
          <button type="button" className="lqd-banner-arrow is-next" aria-label={t.slider.next} onClick={() => go(i + 1)}>
            <Icon name="chevron" />
          </button>
          <div className="lqd-banner-dots" role="tablist" aria-label={t.slider.choose}>
            {slides.map((s, k) => (
              <button key={s.id} type="button" role="tab" aria-selected={k === i} aria-label={t.slider.slide(k + 1)} onClick={() => setI(k)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
