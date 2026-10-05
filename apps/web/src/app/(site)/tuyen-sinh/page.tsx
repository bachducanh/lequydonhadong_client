import type { Metadata } from 'next';
import { DocumentList, downloadToDoc, NewsCard, PageHeader, SectionHeader } from '@/components/site/blocks';
import { QAList } from '@/components/site/qa-list';
import { Button, Empty } from '@/components/ui/basics';
import { apiSafe, emptyPage } from '@/lib/api';
import type { DownloadFile, Paged, PostCard, Question } from '@/lib/types';

export const metadata: Metadata = { title: 'Tuyển sinh lớp 10', description: 'Chỉ tiêu, lịch thi, hồ sơ và hướng dẫn nhập học lớp 10.' };

export default async function AdmissionPage() {
  const [posts, files, qa] = await Promise.all([
    apiSafe<Paged<PostCard>>('/posts', { category: 'tuyen-sinh', limit: 6 }, emptyPage<PostCard>()),
    apiSafe<Paged<DownloadFile>>('/downloads', { category: 'Tuyển sinh', limit: 20 }, emptyPage<DownloadFile>()),
    apiSafe<Paged<Question>>('/questions', { topic: 'Tuyển sinh', limit: 5 }, emptyPage<Question>()),
  ]);
  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Trang chủ', href: '/' }, { label: 'Tuyển sinh' }]}
        eyebrow="Tuyển sinh 2027–2028"
        title="Tuyển sinh lớp 10"
        description="Chỉ tiêu, lịch thi, hồ sơ và hướng dẫn nhập học — cập nhật đầy đủ tại một nơi."
      />
      <section className="lqd-section">
        <div className="lqd-container">
          <SectionHeader eyebrow="Thông báo tuyển sinh" title="Tin tuyển sinh" actionLabel="Tất cả tin tuyển sinh" actionHref="/tin-tuc?chuyen-muc=tuyen-sinh" />
          {posts.data.length ? (
            <div className="lqd-grid-3">
              {posts.data.map((p) => (
                <NewsCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <Empty icon="megaphone" title="Chưa có thông báo tuyển sinh" />
          )}
        </div>
      </section>
      <section className="lqd-section lqd-section-alt">
        <div className="lqd-container lqd-split">
          <div>
            <SectionHeader eyebrow="Hồ sơ" title="Biểu mẫu tuyển sinh" />
            {files.data.length ? <DocumentList items={files.data.map(downloadToDoc)} /> : <Empty icon="download" title="Chưa có biểu mẫu" />}
          </div>
          <div>
            <SectionHeader eyebrow="Hỏi đáp" title="Câu hỏi thường gặp" actionLabel="Xem tất cả" actionHref="/hoi-dap?chu-de=Tuy%E1%BB%83n%20sinh" />
            {qa.data.length ? <QAList items={qa.data} /> : <Empty icon="help" title="Chưa có câu hỏi" />}
            <div style={{ marginTop: 24 }}>
              <Button variant="cta" href="/hoi-dap#gui-cau-hoi" icon="arrow">
                Đặt câu hỏi tuyển sinh
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
