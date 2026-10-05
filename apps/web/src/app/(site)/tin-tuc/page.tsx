import type { Metadata } from 'next';
import { AnnouncementList, NewsCard, PageHeader } from '@/components/site/blocks';
import { QuerySelect } from '@/components/site/query-select';
import { Empty, FilterTabs, Pagination } from '@/components/ui/basics';
import { apiSafe, emptyPage, pageOf, pick } from '@/lib/api';
import type { Category, Paged, PostCard } from '@/lib/types';
import { hrefWith } from '@/lib/url';

export const metadata: Metadata = { title: 'Tin tức & Thông báo', description: 'Hoạt động, sự kiện và thông báo chính thức của nhà trường.' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewsPage({ searchParams }: Props) {
  const sp = await searchParams;
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
  const tabs = [{ label: 'Tất cả', slug: undefined as string | undefined }, ...children.map((c) => ({ label: c.name, slug: c.slug }))];
  const active = tabs.findIndex((t) => t.slug === category);
  const current = categories.find((c) => c.slug === category);
  const params = { 'chuyen-muc': category, q, 'sap-xep': pick(sp, 'sap-xep') };

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Trang chủ', href: '/' }, { label: 'Tin tức – Thông báo', href: '/tin-tuc' }, ...(current ? [{ label: current.name }] : [])]}
        eyebrow="Tin tức – Thông báo"
        title={current && !children.some((c) => c.slug === current.slug) ? current.name : 'Tin tức & Thông báo'}
        description="Hoạt động, sự kiện và thông báo chính thức của nhà trường."
        search={{ action: '/tin-tuc', placeholder: 'Tìm bài viết…', defaultValue: q, hidden: { 'chuyen-muc': category } }}
      />
      <section className="lqd-section">
        <div className="lqd-container lqd-with-aside">
          <div>
            <div className="lqd-listbar">
              <FilterTabs value={active} items={tabs.map((t) => ({ label: t.label, href: hrefWith('/tin-tuc', { ...params, 'chuyen-muc': t.slug }) }))} />
              <QuerySelect
                name="sap-xep"
                label="Sắp xếp"
                value={pick(sp, 'sap-xep')}
                options={[
                  { value: '', label: 'Mới nhất' },
                  { value: 'xem-nhieu', label: 'Xem nhiều' },
                ]}
              />
            </div>
            {q && (
              <p className="lqd-field-hint" style={{ marginBottom: 16 }}>
                {posts.meta.total} kết quả cho “{q}”
              </p>
            )}
            {posts.data.length ? (
              <div className="lqd-grid-2">
                {posts.data.map((p) => (
                  <NewsCard key={p.id} post={p} />
                ))}
              </div>
            ) : (
              <Empty icon="search" title="Không có bài viết phù hợp">
                Thử chọn chuyên mục khác hoặc đổi từ khoá tìm kiếm.
              </Empty>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <Pagination page={page} total={posts.meta.totalPages} hrefFor={(p) => hrefWith('/tin-tuc', { ...params, trang: p })} />
            </div>
          </div>
          <aside className="lqd-aside">
            {announcements.data.length > 0 && (
              <div>
                <h4>Thông báo mới</h4>
                <AnnouncementList items={announcements.data} />
              </div>
            )}
            {popular.data.length > 0 && (
              <div>
                <h4>Xem nhiều</h4>
                <div className="lqd-stack" style={{ gap: 12 }}>
                  {popular.data.map((p) => (
                    <NewsCard key={p.id} post={p} compact />
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
