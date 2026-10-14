'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import type { Slide } from '@/lib/types';

/**
 * Slider trang chủ (quản lý ở "Ảnh giới thiệu"): chữ trái, ảnh bo 24px phải.
 * Tự chuyển 6 giây, dừng khi rê chuột/focus; tắt tự chuyển khi người dùng chọn giảm chuyển động.
 */
export function HeroSlider({ slides: input, interval = 6000, autoplay = true }: { slides: Slide[]; interval?: number; autoplay?: boolean }) {
  const { t } = useI18n();
  // Chưa có slide nào trong "Ảnh giới thiệu": hiện một slide chào mừng mặc định
  const slides: Slide[] = input.length
    ? input
    : [
        {
          id: 'default',
          eyebrow: t.slider.defaultEyebrow,
          title: t.slider.defaultTitle,
          lead: t.slider.defaultLead,
          ctaLabel: t.slider.defaultCta,
          ctaHref: '/gioi-thieu',
          secondaryLabel: t.slider.defaultSecondary,
          secondaryHref: '/tin-tuc',
          image: null,
          imageAlt: null,
          caption: null,
          order: 0,
          visible: true,
        },
      ];
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
    const timer = setTimeout(() => setI((i + 1) % n), interval);
    return () => clearTimeout(timer);
  }, [i, paused, reduced, n, autoplay, interval]);

  const s = slides[i] ?? slides[0];

  return (
    <section
      className="lqd-slider"
      aria-roledescription="carousel"
      aria-label={t.slider.aria}
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
            <button type="button" className="lqd-slider-arrow" aria-label={t.slider.prev} onClick={() => setI((i - 1 + n) % n)}>
              <Icon name="chevronLeft" />
            </button>
            <div className="lqd-slider-dots" role="tablist" aria-label={t.slider.choose}>
              {slides.map((sl, k) => (
                <button key={sl.id} type="button" role="tab" aria-selected={k === i} aria-label={t.slider.slide(k + 1)} onClick={() => setI(k)} />
              ))}
            </div>
            <button type="button" className="lqd-slider-arrow" aria-label={t.slider.next} onClick={() => setI((i + 1) % n)}>
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
