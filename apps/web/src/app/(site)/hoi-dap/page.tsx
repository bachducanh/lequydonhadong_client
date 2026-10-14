import type { Metadata } from 'next';
import { PageHeader } from '@/components/site/blocks';
import { AskForm } from '@/components/site/forms';
import { QAList } from '@/components/site/qa-list';
import { Empty, FilterTabs, Pagination } from '@/components/ui/basics';
import { apiSafe, emptyPage, pageOf, pick } from '@/lib/api';
import { label } from '@/lib/i18n';
import { getI18n } from '@/lib/i18n-server';
import { QA_TOPICS } from '@/lib/site';
import type { Paged, Question } from '@/lib/types';
import { hrefWith } from '@/lib/url';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.qa.title, description: t.qa.desc };
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function QAPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { lang, t } = await getI18n();
  const q = pick(sp, 'q');
  const topic = pick(sp, 'chu-de');
  const page = pageOf(sp);
  const data = await apiSafe<Paged<Question>>('/questions', { q, topic, page, limit: 8 }, emptyPage<Question>());
  const counts = data.meta.counts ?? {};
  const tabs = [{ label: t.common.all, value: undefined as string | undefined }, ...QA_TOPICS.map((v) => ({ label: label(lang, 'topic', v), value: v }))];

  return (
    <>
      <PageHeader
        lang={lang}
        breadcrumb={[{ label: t.common.home, href: '/' }, { label: t.nav.items['hoi-dap'] }]}
        eyebrow={t.qa.eyebrow}
        title={t.qa.title}
        description={t.qa.desc}
        search={{ action: '/hoi-dap', placeholder: t.qa.searchPlaceholder, defaultValue: q, hidden: { 'chu-de': topic } }}
      />
      <section className="lqd-section">
        <div className="lqd-container lqd-with-aside lqd-aside-wide">
          <div>
            <div className="lqd-listbar">
              <FilterTabs
                value={Math.max(0, tabs.findIndex((tab) => tab.value === topic))}
                items={tabs.map((tab) => ({ label: tab.label, count: tab.value ? (counts[tab.value] ?? 0) : (counts.ALL ?? 0), href: hrefWith('/hoi-dap', { q, 'chu-de': tab.value }) }))}
              />
            </div>
            {data.data.length ? (
              <QAList key={`${topic}-${q}-${page}`} items={data.data} />
            ) : (
              <Empty icon="help" title={t.qa.empty}>
                {t.qa.emptyHint}
              </Empty>
            )}
            <div className="lqd-pager-row">
              <Pagination lang={lang} page={page} total={data.meta.totalPages} hrefFor={(p) => hrefWith('/hoi-dap', { q, 'chu-de': topic, trang: p })} />
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
