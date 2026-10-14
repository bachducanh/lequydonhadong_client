import type { Metadata } from 'next';
import { DocumentList, downloadToDoc, legalToDoc, PageHeader, SectionHeader } from '@/components/site/blocks';
import { QuerySelect } from '@/components/site/query-select';
import { Empty, FilterTabs, Pagination } from '@/components/ui/basics';
import { apiSafe, emptyPage, pageOf, pick } from '@/lib/api';
import { label } from '@/lib/i18n';
import { getI18n } from '@/lib/i18n-server';
import type { DownloadFile, LegalDocument, Paged } from '@/lib/types';
import { hrefWith } from '@/lib/url';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.docs.title, description: t.docs.desc };
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TYPE_ORDER = ['Luật', 'Nghị định', 'Thông tư', 'Quyết định', 'Công văn', 'Kế hoạch'];

export default async function DocumentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { lang, t } = await getI18n();
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
  const rank = (v: string) => (TYPE_ORDER.includes(v) ? TYPE_ORDER.indexOf(v) : TYPE_ORDER.length);
  const types = Object.keys(counts)
    .filter((k) => k !== 'ALL')
    .sort((a, b) => rank(a) - rank(b));
  const typeTabs = [{ label: t.common.all, value: undefined as string | undefined, count: counts.ALL ?? 0 }, ...types.map((v) => ({ label: label(lang, 'docType', v), value: v, count: counts[v] }))];
  const issuers = (docs.meta.issuers as string[] | undefined) ?? [];
  const fileCats = (files.meta.categories as string[] | undefined) ?? [];
  const params = { q, loai: type, 'co-quan': issuer, nhom: fileCategory };

  return (
    <>
      <PageHeader
        lang={lang}
        breadcrumb={[{ label: t.common.home, href: '/' }, { label: t.docs.eyebrow }]}
        eyebrow={t.docs.eyebrow}
        title={t.docs.title}
        description={t.docs.desc}
        search={{ action: '/van-ban', placeholder: t.docs.searchPlaceholder, defaultValue: q, hidden: { loai: type, 'co-quan': issuer } }}
      />
      <section className="lqd-section">
        <div className="lqd-container lqd-stack" style={{ gap: 48 }}>
          <div>
            <SectionHeader eyebrow={t.docs.legalEyebrow} title={t.docs.legalTitle} />
            <div className="lqd-listbar">
              <FilterTabs
                value={Math.max(0, typeTabs.findIndex((tab) => tab.value === type))}
                items={typeTabs.map((tab) => ({ label: tab.label, count: tab.count, href: hrefWith('/van-ban', { ...params, loai: tab.value }) }))}
              />
              {issuers.length > 1 && (
                <QuerySelect
                  name="co-quan"
                  label={t.docs.issuer}
                  value={issuer}
                  options={[{ value: '', label: t.docs.allIssuers }, ...issuers.map((i) => ({ value: i, label: label(lang, 'issuer', i) }))]}
                />
              )}
            </div>
            {docs.data.length ? <DocumentList items={docs.data.map((d) => legalToDoc(d, lang))} lang={lang} /> : <Empty icon="scale" title={t.docs.empty} />}
            <div className="lqd-pager-row">
              <Pagination lang={lang} page={page} total={docs.meta.totalPages} hrefFor={(p) => hrefWith('/van-ban', { ...params, trang: p })} />
            </div>
          </div>

          <div id="tai-lieu">
            <SectionHeader eyebrow={t.docs.dlEyebrow} title={t.docs.dlTitle} description={t.docs.dlDesc} />
            {fileCats.length > 1 && (
              <div className="lqd-listbar">
                <FilterTabs
                  value={Math.max(0, ['', ...fileCats].indexOf(fileCategory ?? ''))}
                  items={[{ label: t.common.all, value: '' }, ...fileCats.map((c) => ({ label: label(lang, 'fileCategory', c), value: c }))].map((c) => ({
                    label: c.label,
                    href: `${hrefWith('/van-ban', { ...params, nhom: c.value, trang: page })}#tai-lieu`,
                  }))}
                />
              </div>
            )}
            {files.data.length ? <DocumentList items={files.data.map((f) => downloadToDoc(f, lang))} lang={lang} /> : <Empty icon="download" title={t.docs.noFiles} />}
          </div>
        </div>
      </section>
    </>
  );
}
