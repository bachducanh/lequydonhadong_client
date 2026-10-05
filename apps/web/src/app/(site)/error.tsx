'use client';

import { Button, Empty } from '@/components/ui/basics';

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="lqd-section">
      <div className="lqd-container lqd-stack" style={{ alignItems: 'center' }}>
        <Empty icon="alert" title="Không tải được nội dung">
          Máy chủ đang bận hoặc mất kết nối. Vui lòng thử lại sau ít phút.
        </Empty>
        <Button onClick={reset} iconLeft="undo">
          Thử lại
        </Button>
      </div>
    </section>
  );
}
