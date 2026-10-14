'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { Icon } from '@/components/ui/icon';
import { cx } from '@/lib/cx';
import { formatDate } from '@/lib/format';
import { label } from '@/lib/i18n';
import type { Question } from '@/lib/types';

/** Hỏi đáp dạng accordion (H/Đ). */
export function QAList({ items, open: initial = 0 }: { items: Question[]; open?: number }) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(initial);
  return (
    <div className="lqd-qa">
      {items.map((q, k) => {
        const isOpen = open === k;
        return (
          <div className={cx('lqd-qa-item', isOpen && 'is-open')} key={q.id}>
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : k)}>
              <span className="lqd-qa-q">{lang === 'en' ? 'Q' : 'H'}</span>
              <span className="lqd-qa-title">
                {q.question}
                <small>
                  {q.askerName} · {formatDate(q.createdAt)} · {label(lang, 'topic', q.topic)}
                </small>
              </span>
              <Icon name="chevronDown" className="lqd-qa-chev" />
            </button>
            {isOpen && (
              <div className="lqd-qa-answer">
                <span className="lqd-qa-a">{lang === 'en' ? 'A' : 'Đ'}</span>
                <div>
                  <p style={{ whiteSpace: 'pre-line' }}>{q.answer}</p>
                  <small>{t.common.answeredBy(q.answeredBy || t.common.defaultAnswerer)}</small>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
