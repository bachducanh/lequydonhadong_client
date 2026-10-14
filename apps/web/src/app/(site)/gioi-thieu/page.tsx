import type { Metadata } from 'next';
import { NewsCard, PageHeader, ProgramCard, SectionHeader } from '@/components/site/blocks';
import { Button, Empty } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { apiSafe, emptyPage } from '@/lib/api';
import { getI18n } from '@/lib/i18n-server';
import { departments, SCHOOL } from '@/lib/site';
import type { Paged, PostCard } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.about.eyebrow, description: t.about.desc };
}

export default async function AboutPage() {
  const { lang, t } = await getI18n();
  const a = t.about;
  const posts = await apiSafe<Paged<PostCard>>('/posts', { category: 'gioi-thieu', limit: 6 }, emptyPage<PostCard>());
  const contacts = [
    { icon: 'pin' as const, label: a.address, value: t.footer.address },
    { icon: 'phone' as const, label: a.phone, value: SCHOOL.phone, href: SCHOOL.phoneHref },
    { icon: 'mail' as const, label: a.email, value: SCHOOL.email, href: `mailto:${SCHOOL.email}` },
  ];
  return (
    <>
      <PageHeader lang={lang} breadcrumb={[{ label: t.common.home, href: '/' }, { label: a.eyebrow }]} eyebrow={a.eyebrow} title={t.common.siteName} description={a.desc} />
      <section className="lqd-section">
        <div className="lqd-container">
          <SectionHeader eyebrow={a.infoEyebrow} title={a.infoTitle} description={a.infoDesc} />
          {posts.data.length ? (
            <div className="lqd-grid-3">
              {posts.data.map((p) => (
                <NewsCard key={p.id} post={p} lang={lang} />
              ))}
            </div>
          ) : (
            <Empty icon="book" title={a.empty} />
          )}
        </div>
      </section>
      <section className="lqd-section lqd-section-alt" id="to-chuyen-mon">
        <div className="lqd-container">
          <SectionHeader eyebrow={t.home.deptEyebrow} title={t.home.deptTitle} description={t.home.deptDesc} />
          <div className="lqd-grid-4">
            {departments(lang).map((d) => (
              <ProgramCard key={d.title} icon={d.icon} label={t.home.deptLabel} title={d.title} description={d.description} meta={d.meta} actionLabel={t.common.learnMore} href={d.href} />
            ))}
          </div>
        </div>
      </section>
      <section className="lqd-section">
        <div className="lqd-container lqd-split">
          <div>
            <SectionHeader eyebrow={a.contactEyebrow} title={a.contactTitle} />
            <div className="lqd-card lqd-stack" style={{ padding: 24, gap: 16 }}>
              {contacts.map((c) => (
                <div key={c.label} className="flex items-start gap-4">
                  <span className="lqd-quick-icon">
                    <Icon name={c.icon} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold uppercase tracking-[.06em] text-ink-muted">{c.label}</div>
                    {c.href ? (
                      <a className="font-semibold break-words text-link hover:underline" href={c.href}>
                        {c.value}
                      </a>
                    ) : (
                      <div className="font-semibold">{c.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader eyebrow={a.helpEyebrow} title={a.helpTitle} />
            <div className="lqd-card lqd-stack" style={{ padding: 24 }}>
              <p className="m-0 text-ink-muted">{a.helpText}</p>
              <div className="lqd-row">
                <Button variant="cta" href="/hoi-dap#gui-cau-hoi" icon="arrow">
                  {a.ask}
                </Button>
                <Button variant="secondary" href="/tuyen-sinh">
                  {a.admissions}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
