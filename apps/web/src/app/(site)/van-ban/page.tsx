import type { Metadata } from 'next';
import { DocumentList, downloadToDoc, legalToDoc, PageHeader, SectionHeader } from '@/components/site/blocks';
import { QuerySelect } from '@/components/site/query-select';
import { Empty, FilterTabs, Pagination } from '@/components/ui/basics';
import { apiSafe, emptyPage, pageOf, pick } from '@/lib/api';
import type { DownloadFile, LegalDocument, Paged } from '@/lib/types';
import { hrefWith } from '@/lib/url';

export const metadata: Metadata = { title: 'Văn bản & Tài liệu', description: 'Văn bản pháp quy của Bộ, Sở GD&ĐT, nhà trường và các biểu mẫu tải về.' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TYPE_ORDER = ['Luật', 'Nghị định', 'Thông tư', 'Quyết định', 'Công văn', 'Kế hoạch'];

export default async function DocumentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = pick(sp, 'q');
  const type = pick(sp, 'loai');
  const issuer = pick(sp, 'co-quan');
  const fileCategory = pick(sp, 'nhom');
  const page = pageOf(sp);

  const [docs, files] = await Promise.all([
    apiSafe<Paged<LegalDocument>>('/legal-documents', { q, type, issuer, page, limit: 10 }, emptyPage<LegalDocument>()),
    apiSafe<Paged<DownloadFile>>('/downloads', { category: fileCategory, limit: 50 }, emptyPage<DownloadFile>()),
  ]);

  const counts = docs.meta.counts ?? {};
  const rank = (t: string) => (TYPE_ORDER.includes(t) ? TYPE_ORDER.indexOf(t) : TYPE_ORDER.length);
  const types = Object.keys(counts)
    .filter((k) => k !== 'ALL')
    .sort((a, b) => rank(a) - rank(b));
  const typeTabs = [{ label: 'Tất cả', value: undefined as string | undefined, count: counts.ALL ?? 0 }, ...types.map((t) => ({ label: t, value: t, count: counts[t] }))];
  const issuers = (docs.meta.issuers as string[] | undefined) ?? [];
  const fileCats = (files.meta.categories as string[] | undefined) ?? [];
  const params = { q, loai: type, 'co-quan': issuer, nhom: fileCategory };

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Trang chủ', href: '/' }, { label: 'Văn bản' }]}
        eyebrow="Văn bản"
        title="Văn bản & Tài liệu"
        description="Văn bản pháp quy của Bộ, Sở GD&ĐT, nhà trường và các biểu mẫu tải về."
        search={{ action: '/van-ban', placeholder: 'Tìm theo số hiệu, trích yếu…', defaultValue: q, hidden: { loai: type, 'co-quan': issuer } }}
      />
      <section className="lqd-section">
        <div className="lqd-container lqd-stack" style={{ gap: 48 }}>
          <div>
            <SectionHeader eyebrow="Văn bản pháp quy" title="Văn bản pháp quy" />
            <div className="lqd-listbar">
              <FilterTabs
                value={Math.max(0, typeTabs.findIndex((t) => t.value === type))}
                items={typeTabs.map((t) => ({ label: t.label, count: t.count, href: hrefWith('/van-ban', { ...params, loai: t.value }) }))}
              />
              <QuerySelect name="co-quan" label="Cơ quan ban hành" value={issuer} options={[{ value: '', label: 'Mọi cơ quan' }, ...issuers.map((i) => ({ value: i, label: i }))]} />
            </div>
            {docs.data.length ? (
              <DocumentList items={docs.data.map((d) => legalToDoc(d))} />
            ) : (
              <Empty icon="scale" title="Không có văn bản phù hợp" />
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <Pagination page={page} total={docs.meta.totalPages} hrefFor={(p) => hrefWith('/van-ban', { ...params, trang: p })} />
            </div>
          </div>

          <div id="tai-lieu">
            <SectionHeader eyebrow="Download" title="Tài liệu tải về" description="Biểu mẫu, hồ sơ và đề cương ôn tập." />
            {fileCats.length > 1 && (
              <div className="lqd-listbar">
                <FilterTabs
                  value={Math.max(0, ['', ...fileCats].indexOf(fileCategory ?? ''))}
                  items={[{ label: 'Tất cả', value: '' }, ...fileCats.map((c) => ({ label: c, value: c }))].map((c) => ({
                    label: c.label,
                    href: `${hrefWith('/van-ban', { ...params, nhom: c.value, trang: page })}#tai-lieu`,
                  }))}
                />
              </div>
            )}
            {files.data.length ? <DocumentList items={files.data.map(downloadToDoc)} /> : <Empty icon="download" title="Chưa có tài liệu" />}
          </div>
        </div>
      </section>
    </>
  );
}
