import type { Metadata } from 'next';
import { PageHeader, SectionHeader } from '@/components/site/blocks';
import { ClubForm } from '@/components/site/forms';
import { Icon, type IconName } from '@/components/ui/icon';
import { getI18n } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.club.title, description: t.club.desc };
}

const FEATURE_ICONS: IconName[] = ['users', 'globe', 'trophy'];

export default async function ClubPage() {
  const { lang, t } = await getI18n();
  const c = t.club;
  return (
    <>
      <PageHeader lang={lang} breadcrumb={[{ label: t.common.home, href: '/' }, { label: c.eyebrow }]} eyebrow={c.eyebrow} title={c.title} description={c.desc} />
      <section className="lqd-section">
        <div className="lqd-container lqd-with-aside lqd-aside-wide">
          <div>
            <SectionHeader eyebrow={c.whyEyebrow} title={c.whyTitle} />
            <div className="lqd-stack" style={{ gap: 16 }}>
              {c.features.map((f, i) => (
                <div key={f.title} className="lqd-card flex-row items-start gap-4 p-6">
                  <span className="lqd-prog-icon">
                    <Icon name={FEATURE_ICONS[i]} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="m-0 text-lg font-semibold leading-[26px]">{f.title}</h3>
                    <p className="m-0 mt-1 text-[15px] leading-6 text-ink-muted">{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <ClubForm />
          </div>
        </div>
      </section>
    </>
  );
}
