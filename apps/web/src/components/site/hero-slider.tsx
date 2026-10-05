'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import type { Slide } from '@/lib/types';

/**
 * Slider trang chủ (quản lý ở "Ảnh giới thiệu"): chữ trái, ảnh bo 24px phải.
 * Tự chuyển 6 giây, dừng khi rê chuột/focus; tắt tự chuyển khi người dùng chọn giảm chuyển động.
 */
export function HeroSlider({ slides, interval = 6000, autoplay = true }: { slides: Slide[]; interval?: number; autoplay?: boolean }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const n = slides.length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (paused || reduced || n < 2 || !autoplay) return;
    const t = setTimeout(() => setI((i + 1) % n), interval);
    return () => clearTimeout(t);
  }, [i, paused, reduced, n, autoplay, interval]);

  if (!n) return null;
  const s = slides[i] ?? slides[0];

  return (
    <section
      className="lqd-slider"
      aria-roledescription="carousel"
      aria-label="Nổi bật"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="lqd-container lqd-slider-inner">
        <div className="lqd-slide-text" key={`t${i}`} aria-live={paused ? 'polite' : 'off'}>
          {s.eyebrow && <p className="lqd-slide-eyebrow">{s.eyebrow}</p>}
          <h1>{s.title}</h1>
          {s.lead && <p className="lqd-slide-lead">{s.lead}</p>}
          <div className="lqd-row" style={{ gap: 12 }}>
            {s.ctaLabel && (
              <Button variant="cta" size="lg" icon="arrow" href={s.ctaHref || '#'}>
                {s.ctaLabel}
              </Button>
            )}
            {s.secondaryLabel && (
              <Button variant="inverse-outline" size="lg" href={s.secondaryHref || '#'}>
                {s.secondaryLabel}
              </Button>
            )}
          </div>
        </div>
        <div className="lqd-slide-media" key={`m${i}`}>
          <Thumb seed={i} src={s.image} alt={s.imageAlt ?? ''} className="lqd-slide-thumb">
            {s.caption && <span className="lqd-slide-caption">{s.caption}</span>}
          </Thumb>
        </div>
        {n > 1 && (
          <div className="lqd-slider-controls">
            <button type="button" className="lqd-slider-arrow" aria-label="Slide trước" onClick={() => setI((i - 1 + n) % n)}>
              <Icon name="chevronLeft" />
            </button>
            <div className="lqd-slider-dots" role="tablist" aria-label="Chọn slide">
              {slides.map((sl, k) => (
                <button key={sl.id} type="button" role="tab" aria-selected={k === i} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)} />
              ))}
            </div>
            <button type="button" className="lqd-slider-arrow" aria-label="Slide sau" onClick={() => setI((i + 1) % n)}>
              <Icon name="chevron" />
            </button>
            <span className="lqd-slider-count">
              {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
