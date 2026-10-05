'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { cx } from '@/lib/cx';
import { formatDate } from '@/lib/format';
import type { Question } from '@/lib/types';

/** Hỏi đáp dạng accordion (H/Đ). */
export function QAList({ items, open: initial = 0 }: { items: Question[]; open?: number }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="lqd-qa">
      {items.map((q, k) => {
        const isOpen = open === k;
        return (
          <div className={cx('lqd-qa-item', isOpen && 'is-open')} key={q.id}>
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : k)}>
              <span className="lqd-qa-q">H</span>
              <span className="lqd-qa-title">
                {q.question}
                <small>
                  {q.askerName} · {formatDate(q.createdAt)} · {q.topic}
                </small>
              </span>
              <Icon name="chevronDown" className="lqd-qa-chev" />
            </button>
            {isOpen && (
              <div className="lqd-qa-answer">
                <span className="lqd-qa-a">Đ</span>
                <div>
                  <p style={{ whiteSpace: 'pre-line' }}>{q.answer}</p>
                  <small>Trả lời bởi {q.answeredBy || 'Ban quản trị'}</small>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
