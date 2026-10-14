import type { Metadata } from 'next';
import { DocumentList, downloadToDoc, NewsCard, PageHeader, SectionHeader } from '@/components/site/blocks';
import { QAList } from '@/components/site/qa-list';
import { Button, Empty } from '@/components/ui/basics';
import { apiSafe, emptyPage } from '@/lib/api';
import { getI18n } from '@/lib/i18n-server';
import type { DownloadFile, Paged, PostCard, Question } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.admissions.title, description: t.admissions.desc };
}

export default async function AdmissionPage() {
  const { lang, t } = await getI18n();
  const a = t.admissions;
  const [posts, files, qa] = await Promise.all([
    apiSafe<Paged<PostCard>>('/posts', { category: 'tuyen-sinh', limit: 6 }, emptyPage<PostCard>()),
    apiSafe<Paged<DownloadFile>>('/downloads', { category: 'Tuyển sinh', limit: 20 }, emptyPage<DownloadFile>()),
    apiSafe<Paged<Question>>('/questions', { topic: 'Tuyển sinh', limit: 5 }, emptyPage<Question>()),
  ]);
  return (
    <>
      <PageHeader lang={lang} breadcrumb={[{ label: t.common.home, href: '/' }, { label: t.footer.admissions }]} eyebrow={a.eyebrow} title={a.title} description={a.desc} />
      <section className="lqd-section">
        <div className="lqd-container">
          <SectionHeader eyebrow={a.newsEyebrow} title={a.newsTitle} actionLabel={a.newsAll} actionHref="/tin-tuc?chuyen-muc=tuyen-sinh" />
          {posts.data.length ? (
            <div className="lqd-grid-3">
              {posts.data.map((p) => (
                <NewsCard key={p.id} post={p} lang={lang} />
              ))}
            </div>
          ) : (
            <Empty icon="megaphone" title={a.noNews} />
          )}
        </div>
      </section>
      <section className="lqd-section lqd-section-alt">
        <div className="lqd-container lqd-split">
          <div>
            <SectionHeader eyebrow={a.formsEyebrow} title={a.formsTitle} />
            {files.data.length ? <DocumentList items={files.data.map((f) => downloadToDoc(f, lang))} lang={lang} /> : <Empty icon="download" title={a.noForms} />}
          </div>
          <div>
            <SectionHeader eyebrow={a.faqEyebrow} title={a.faqTitle} actionLabel={t.common.viewAll} actionHref="/hoi-dap?chu-de=Tuy%E1%BB%83n%20sinh" />
            {qa.data.length ? <QAList items={qa.data} /> : <Empty icon="help" title={a.noFaq} />}
            <div style={{ marginTop: 24 }}>
              <Button variant="cta" href="/hoi-dap#gui-cau-hoi" icon="arrow">
                {a.askCta}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
