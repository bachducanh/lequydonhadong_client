import type { Metadata } from 'next';
import { PageHeader, SectionHeader } from '@/components/site/blocks';
import { ClubForm } from '@/components/site/forms';
import { Icon, type IconName } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Câu lạc bộ kết bạn', description: 'Đăng ký câu lạc bộ kết bạn – giao lưu của học sinh.' };

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'users', title: 'Kết nối bạn bè', text: 'Gặp gỡ học sinh cùng sở thích ở các khối lớp khác nhau.' },
  { icon: 'globe', title: 'Giao lưu ngoại ngữ', text: 'Luyện tiếng Anh, Pháp, Nhật, Hàn… cùng bạn bè và học sinh trường bạn.' },
  { icon: 'trophy', title: 'Hoạt động hằng tháng', text: 'Dã ngoại, ngày hội văn hoá, câu lạc bộ đọc sách và thể thao.' },
];

export default function ClubPage() {
  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Trang chủ', href: '/' }, { label: 'Câu lạc bộ' }]}
        eyebrow="Câu lạc bộ"
        title="Câu lạc bộ kết bạn – giao lưu"
        description="Nơi học sinh làm quen, giao lưu ngoại ngữ và cùng tham gia hoạt động ngoại khoá."
      />
      <section className="lqd-section">
        <div className="lqd-container lqd-with-aside" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,480px)' }}>
          <div>
            <SectionHeader eyebrow="Vì sao tham gia" title="Hoạt động của câu lạc bộ" />
            <div className="lqd-stack" style={{ gap: 16 }}>
              {FEATURES.map((f) => (
                <div key={f.title} className="lqd-card flex-row items-start gap-4 p-6">
                  <span className="lqd-prog-icon">
                    <Icon name={f.icon} />
                  </span>
                  <div>
                    <h3 className="m-0 text-lg font-semibold leading-[26px]">{f.title}</h3>
                    <p className="m-0 mt-1 text-[15px] leading-6 text-ink-muted">{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <ClubForm />
          </div>
        </div>
      </section>
    </>
  );
}
