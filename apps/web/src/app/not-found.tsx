import { Button, Logo } from '@/components/ui/basics';
import { getI18n } from '@/lib/i18n-server';

export default async function NotFound() {
  const { lang, t } = await getI18n();
  return (
    <main className="lqd-login" style={{ minHeight: '100vh' }}>
      <div className="lqd-login-card" style={{ gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo withText={false} size={72} lang={lang} />
        </div>
        <p className="lqd-eyebrow" style={{ margin: 0 }}>
          {t.notFound.code}
        </p>
        <h1>{t.notFound.title}</h1>
        <p>{t.notFound.desc}</p>
        <div className="lqd-row" style={{ justifyContent: 'center' }}>
          <Button href="/" iconLeft="home">
            {t.notFound.home}
          </Button>
          <Button href="/tim-kiem" variant="secondary" iconLeft="search">
            {t.common.search}
          </Button>
        </div>
      </div>
    </main>
  );
}
