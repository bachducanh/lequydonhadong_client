import type { Metadata } from 'next';
import { NewsCard, PageHeader, ProgramCard, SectionHeader } from '@/components/site/blocks';
import { Button, Empty } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { apiSafe, emptyPage } from '@/lib/api';
import { DEPARTMENTS, SCHOOL } from '@/lib/site';
import type { Paged, PostCard } from '@/lib/types';

export const metadata: Metadata = { title: 'Giới thiệu', description: 'Giới thiệu Trường THPT Lê Quý Đôn – Hà Đông: ban giám hiệu, tổ chuyên môn, liên hệ.' };

export default async function AboutPage() {
  const posts = await apiSafe<Paged<PostCard>>('/posts', { category: 'gioi-thieu', limit: 6 }, emptyPage<PostCard>());
  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Trang chủ', href: '/' }, { label: 'Giới thiệu' }]}
        eyebrow="Giới thiệu"
        title={SCHOOL.name}
        description="Môi trường học tập hiện đại, hội nhập quốc tế — nơi học sinh được khuyến khích khám phá, sáng tạo và trưởng thành."
      />
      <section className="lqd-section">
        <div className="lqd-container">
          <SectionHeader eyebrow="Nhà trường" title="Thông tin nhà trường" description="Lịch sử, sứ mệnh, ban giám hiệu và cơ cấu tổ chức." />
          {posts.data.length ? (
            <div className="lqd-grid-3">
              {posts.data.map((p) => (
                <NewsCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <Empty icon="book" title="Nội dung đang được cập nhật" />
          )}
        </div>
      </section>
      <section className="lqd-section lqd-section-alt" id="to-chuyen-mon">
        <div className="lqd-container">
          <SectionHeader eyebrow="Tổ chức nhà trường" title="Tổ chuyên môn" description="Đội ngũ giáo viên theo từng lĩnh vực, cùng các câu lạc bộ học thuật." />
          <div className="lqd-grid-4">
            {DEPARTMENTS.map((d) => (
              <ProgramCard key={d.title} icon={d.icon} label="Tổ" title={d.title} description={d.description} meta={d.meta} actionLabel="Tìm hiểu" href={d.href} />
            ))}
          </div>
        </div>
      </section>
      <section className="lqd-section">
        <div className="lqd-container lqd-split">
          <div>
            <SectionHeader eyebrow="Liên hệ" title="Thông tin liên hệ" />
            <div className="lqd-card lqd-stack" style={{ padding: 24, gap: 16 }}>
              {[
                { icon: 'pin' as const, label: 'Địa chỉ', value: SCHOOL.address },
                { icon: 'phone' as const, label: 'Điện thoại', value: SCHOOL.phone, href: SCHOOL.phoneHref },
                { icon: 'mail' as const, label: 'Email', value: SCHOOL.email, href: `mailto:${SCHOOL.email}` },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-4">
                  <span className="lqd-quick-icon">
                    <Icon name={c.icon} />
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold uppercase tracking-[.06em] text-ink-muted">{c.label}</div>
                    {c.href ? (
                      <a className="font-semibold text-link hover:underline" href={c.href}>
                        {c.value}
                      </a>
                    ) : (
                      <div className="font-semibold">{c.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="Kết nối" title="Bạn cần hỗ trợ?" />
            <div className="lqd-card lqd-stack" style={{ padding: 24 }}>
              <p className="m-0 text-ink-muted">Gửi câu hỏi hoặc góp ý cho nhà trường; Ban giám hiệu tiếp nhận và phản hồi trong 5 ngày làm việc.</p>
              <div className="lqd-row">
                <Button variant="cta" href="/hoi-dap#gui-cau-hoi" icon="arrow">
                  Gửi câu hỏi
                </Button>
                <Button variant="secondary" href="/tuyen-sinh">
                  Thông tin tuyển sinh
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
