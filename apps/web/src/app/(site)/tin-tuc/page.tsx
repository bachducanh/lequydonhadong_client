import type { Metadata } from 'next';
import { AnnouncementList, NewsCard, PageHeader } from '@/components/site/blocks';
import { QuerySelect } from '@/components/site/query-select';
import { Empty, FilterTabs, Pagination } from '@/components/ui/basics';
import { apiSafe, emptyPage, pageOf, pick } from '@/lib/api';
import { label } from '@/lib/i18n';
import { getI18n } from '@/lib/i18n-server';
import type { Category, Paged, PostCard } from '@/lib/types';
import { hrefWith } from '@/lib/url';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.news.title, description: t.news.desc };
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { lang, t } = await getI18n();
  const category = pick(sp, 'chuyen-muc');
  const q = pick(sp, 'q');
  const sort = pick(sp, 'sap-xep') === 'xem-nhieu' ? 'popular' : 'latest';
  const page = pageOf(sp);

  const [categories, posts, announcements, popular] = await Promise.all([
    apiSafe<Category[]>('/categories', undefined, []),
    apiSafe<Paged<PostCard>>('/posts', { category: category ?? 'tin-tuc', q, sort, page, limit: 10 }, emptyPage<PostCard>()),
    apiSafe<Paged<PostCard>>('/posts', { category: 'thong-bao', limit: 3 }, emptyPage<PostCard>()),
    apiSafe<Paged<PostCard>>('/posts', { sort: 'popular', exclude: 'gioi-thieu', limit: 3 }, emptyPage<PostCard>()),
  ]);

  const root = categories.find((c) => c.slug === 'tin-tuc');
  const children = categories.filter((c) => root && c.parentId === root.id);
  const tabs = [{ label: t.common.all, slug: undefined as string | undefined }, ...children.map((c) => ({ label: label(lang, 'category', c.name, c.slug), slug: c.slug }))];
  const active = tabs.findIndex((tab) => tab.slug === category);
  const current = categories.find((c) => c.slug === category);
  const currentName = current ? label(lang, 'category', current.name, current.slug) : undefined;
  const params = { 'chuyen-muc': category, q, 'sap-xep': pick(sp, 'sap-xep') };

  return (
    <>
      <PageHeader
        lang={lang}
        breadcrumb={[{ label: t.common.home, href: '/' }, { label: t.news.eyebrow, href: '/tin-tuc' }, ...(currentName ? [{ label: currentName }] : [])]}
        eyebrow={t.news.eyebrow}
        title={current && !children.some((c) => c.slug === current.slug) ? currentName! : t.news.title}
        description={t.news.desc}
        search={{ action: '/tin-tuc', placeholder: t.news.searchPlaceholder, defaultValue: q, hidden: { 'chuyen-muc': category } }}
      />
      <section className="lqd-section">
        <div className="lqd-container lqd-with-aside">
          <div>
            <div className="lqd-listbar">
              <FilterTabs value={active} items={tabs.map((tab) => ({ label: tab.label, href: hrefWith('/tin-tuc', { ...params, 'chuyen-muc': tab.slug }) }))} />
              <QuerySelect
                name="sap-xep"
                label={t.news.sort}
                value={pick(sp, 'sap-xep')}
                options={[
                  { value: '', label: t.news.latest },
                  { value: 'xem-nhieu', label: t.news.popular },
                ]}
              />
            </div>
            {q && (
              <p className="lqd-field-hint" style={{ marginBottom: 16 }}>
                {t.news.results(posts.meta.total, q)}
              </p>
            )}
            {posts.data.length ? (
              <div className="lqd-grid-2">
                {posts.data.map((p) => (
                  <NewsCard key={p.id} post={p} lang={lang} />
                ))}
              </div>
            ) : (
              <Empty icon="search" title={t.news.empty}>
                {t.news.emptyHint}
              </Empty>
            )}
            <div className="lqd-pager-row">
              <Pagination lang={lang} page={page} total={posts.meta.totalPages} hrefFor={(p) => hrefWith('/tin-tuc', { ...params, trang: p })} />
            </div>
          </div>
          <aside className="lqd-aside">
            {announcements.data.length > 0 && (
              <div>
                <h4>{t.news.asideAnn}</h4>
                <AnnouncementList items={announcements.data} lang={lang} />
              </div>
            )}
            {popular.data.length > 0 && (
              <div>
                <h4>{t.news.asidePopular}</h4>
                <div className="lqd-stack" style={{ gap: 12 }}>
                  {popular.data.map((p) => (
                    <NewsCard key={p.id} post={p} compact lang={lang} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
