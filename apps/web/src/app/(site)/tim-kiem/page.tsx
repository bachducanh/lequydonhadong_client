import type { Metadata } from 'next';
import { DocumentList, downloadToDoc, legalToDoc, NewsCard, PageHeader, SectionHeader } from '@/components/site/blocks';
import { QAList } from '@/components/site/qa-list';
import { Empty } from '@/components/ui/basics';
import { apiSafe, pick } from '@/lib/api';
import { getI18n } from '@/lib/i18n-server';
import type { SearchResult } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.searchPage.eyebrow };
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: Props) {
  const q = (pick(await searchParams, 'q') ?? '').trim();
  const { lang, t } = await getI18n();
  const s = t.searchPage;
  const empty: SearchResult = { query: q, posts: [], documents: [], downloads: [], questions: [] };
  const result = q.length >= 2 ? await apiSafe<SearchResult>('/search', { q }, empty) : empty;
  const total = result.posts.length + result.documents.length + result.downloads.length + result.questions.length;

  return (
    <>
      <PageHeader
        lang={lang}
        breadcrumb={[{ label: t.common.home, href: '/' }, { label: s.eyebrow }]}
        eyebrow={s.eyebrow}
        title={q ? s.titleFor(q) : s.titleEmpty}
        description={q ? s.descFor(total) : s.descEmpty}
        search={{ action: '/tim-kiem', defaultValue: q }}
      />
      <section className="lqd-section">
        <div className="lqd-container lqd-stack" style={{ gap: 48 }}>
          {q.length < 2 ? (
            <Empty icon="search" title={s.minChars} />
          ) : total === 0 ? (
            <Empty icon="search" title={s.none}>
              {s.noneHint}
            </Empty>
          ) : (
            <>
              {result.posts.length > 0 && (
                <div>
                  <SectionHeader eyebrow={s.postsEyebrow} title={`${s.posts} (${result.posts.length})`} />
                  <div className="lqd-grid-3">
                    {result.posts.map((p) => (
                      <NewsCard key={p.id} post={p} lang={lang} />
                    ))}
                  </div>
                </div>
              )}
              {result.documents.length > 0 && (
                <div>
                  <SectionHeader eyebrow={s.docsEyebrow} title={`${s.docs} (${result.documents.length})`} />
                  <DocumentList items={result.documents.map((d) => legalToDoc(d, lang))} lang={lang} />
                </div>
              )}
              {result.downloads.length > 0 && (
                <div>
                  <SectionHeader eyebrow={s.filesEyebrow} title={`${s.files} (${result.downloads.length})`} />
                  <DocumentList items={result.downloads.map((f) => downloadToDoc(f, lang))} lang={lang} />
                </div>
              )}
              {result.questions.length > 0 && (
                <div>
                  <SectionHeader eyebrow={s.qaEyebrow} title={`${s.qa} (${result.questions.length})`} />
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
