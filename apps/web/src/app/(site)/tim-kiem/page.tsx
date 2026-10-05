import type { Metadata } from 'next';
import { DocumentList, downloadToDoc, legalToDoc, NewsCard, PageHeader, SectionHeader } from '@/components/site/blocks';
import { QAList } from '@/components/site/qa-list';
import { Empty } from '@/components/ui/basics';
import { apiSafe, pick } from '@/lib/api';
import type { SearchResult } from '@/lib/types';

export const metadata: Metadata = { title: 'Tìm kiếm' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: Props) {
  const q = (pick(await searchParams, 'q') ?? '').trim();
  const empty: SearchResult = { query: q, posts: [], documents: [], downloads: [], questions: [] };
  const result = q.length >= 2 ? await apiSafe<SearchResult>('/search', { q }, empty) : empty;
  const total = result.posts.length + result.documents.length + result.downloads.length + result.questions.length;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Trang chủ', href: '/' }, { label: 'Tìm kiếm' }]}
        eyebrow="Tìm kiếm"
        title={q ? `Kết quả cho “${q}”` : 'Bạn đang tìm thông tin gì?'}
        description={q ? `${total} kết quả trong tin bài, văn bản, tài liệu và hỏi đáp.` : 'Tìm nhanh thông báo, văn bản, lịch học và tài liệu của nhà trường.'}
        search={{ action: '/tim-kiem', defaultValue: q }}
      />
      <section className="lqd-section">
        <div className="lqd-container lqd-stack" style={{ gap: 48 }}>
          {q.length < 2 ? (
            <Empty icon="search" title="Nhập ít nhất 2 ký tự để tìm kiếm" />
          ) : total === 0 ? (
            <Empty icon="search" title="Không tìm thấy kết quả">
              Thử từ khoá khác, hoặc gửi câu hỏi cho nhà trường ở trang Hỏi đáp.
            </Empty>
          ) : (
            <>
              {result.posts.length > 0 && (
                <div>
                  <SectionHeader eyebrow="Tin bài" title={`Tin tức – Thông báo (${result.posts.length})`} />
                  <div className="lqd-grid-3">
                    {result.posts.map((p) => (
                      <NewsCard key={p.id} post={p} />
                    ))}
                  </div>
                </div>
              )}
              {result.documents.length > 0 && (
                <div>
                  <SectionHeader eyebrow="Văn bản" title={`Văn bản pháp quy (${result.documents.length})`} />
                  <DocumentList items={result.documents.map((d) => legalToDoc(d))} />
                </div>
              )}
              {result.downloads.length > 0 && (
                <div>
                  <SectionHeader eyebrow="Download" title={`Tài liệu tải về (${result.downloads.length})`} />
                  <DocumentList items={result.downloads.map(downloadToDoc)} />
                </div>
              )}
              {result.questions.length > 0 && (
                <div>
                  <SectionHeader eyebrow="Hỏi đáp" title={`Hỏi đáp (${result.questions.length})`} />
                  <QAList items={result.questions} />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
