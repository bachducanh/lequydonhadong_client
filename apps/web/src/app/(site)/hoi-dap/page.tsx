import type { Metadata } from 'next';
import { PageHeader } from '@/components/site/blocks';
import { AskForm } from '@/components/site/forms';
import { QAList } from '@/components/site/qa-list';
import { Empty, FilterTabs, Pagination } from '@/components/ui/basics';
import { apiSafe, emptyPage, pageOf, pick } from '@/lib/api';
import { QA_TOPICS } from '@/lib/site';
import type { Paged, Question } from '@/lib/types';
import { hrefWith } from '@/lib/url';

export const metadata: Metadata = { title: 'Hỏi đáp & Góp ý', description: 'Tra cứu câu hỏi thường gặp hoặc gửi câu hỏi, góp ý cho nhà trường.' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function QAPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = pick(sp, 'q');
  const topic = pick(sp, 'chu-de');
  const page = pageOf(sp);
  const data = await apiSafe<Paged<Question>>('/questions', { q, topic, page, limit: 8 }, emptyPage<Question>());
  const counts = data.meta.counts ?? {};
  const tabs = [{ label: 'Tất cả', value: undefined as string | undefined }, ...QA_TOPICS.map((t) => ({ label: t, value: t }))];

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Trang chủ', href: '/' }, { label: 'Hỏi đáp' }]}
        eyebrow="Hỏi đáp – Góp ý"
        title="Hỏi đáp & Góp ý"
        description="Tra cứu câu hỏi thường gặp hoặc gửi câu hỏi, góp ý cho nhà trường."
        search={{ action: '/hoi-dap', placeholder: 'Tìm câu hỏi…', defaultValue: q, hidden: { 'chu-de': topic } }}
      />
      <section className="lqd-section">
        <div className="lqd-container lqd-with-aside" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,440px)' }}>
          <div>
            <div className="lqd-listbar">
              <FilterTabs
                value={Math.max(0, tabs.findIndex((t) => t.value === topic))}
                items={tabs.map((t) => ({ label: t.label, count: t.value ? counts[t.value] ?? 0 : counts.ALL ?? 0, href: hrefWith('/hoi-dap', { q, 'chu-de': t.value }) }))}
              />
            </div>
            {data.data.length ? (
              <QAList key={`${topic}-${q}-${page}`} items={data.data} />
            ) : (
              <Empty icon="help" title="Chưa có câu hỏi phù hợp">
                Bạn có thể gửi câu hỏi cho nhà trường ở biểu mẫu bên cạnh.
              </Empty>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <Pagination page={page} total={data.meta.totalPages} hrefFor={(p) => hrefWith('/hoi-dap', { q, 'chu-de': topic, trang: p })} />
            </div>
          </div>
          <div>
            <AskForm />
          </div>
        </div>
      </section>
    </>
  );
}
