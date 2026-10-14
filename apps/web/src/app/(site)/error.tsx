'use client';

import { useI18n } from '@/components/i18n-provider';
import { Button, Empty } from '@/components/ui/basics';

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <section className="lqd-section">
      <div className="lqd-container lqd-stack" style={{ alignItems: 'center' }}>
        <Empty icon="alert" title={t.error.title}>
          {t.error.desc}
        </Empty>
        <Button onClick={reset} iconLeft="undo">
          {t.common.retry}
        </Button>
      </div>
    </section>
  );
}
