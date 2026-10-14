import type { Metadata } from 'next';
import { PageHeader } from '@/components/site/blocks';
import { PhotoGrid } from '@/components/site/interactive';
import { Empty, TextLink } from '@/components/ui/basics';
import { apiGet, apiOr404 } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { getI18n } from '@/lib/i18n-server';
import type { AlbumDetail } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { t } = await getI18n();
  const album = await apiGet<AlbumDetail>(`/albums/${encodeURIComponent(id)}`).catch(() => null);
  return album ? { title: album.title, description: album.description ?? undefined } : { title: t.notFound.title };
}

export default async function AlbumPage({ params }: Props) {
  const { id } = await params;
  const { lang, t } = await getI18n();
  const album = await apiOr404<AlbumDetail>(`/albums/${encodeURIComponent(id)}`);
  return (
    <>
      <PageHeader
        lang={lang}
        breadcrumb={[{ label: t.common.home, href: '/' }, { label: t.library.eyebrow, href: '/thu-vien' }, { label: album.title }]}
        eyebrow={t.library.photoMeta(album.photos.length, formatDate(album.eventDate))}
        title={album.title}
        description={album.description ?? undefined}
      />
      <section className="lqd-section">
        <div className="lqd-container lqd-stack" style={{ gap: 32 }}>
          {album.photos.length ? <PhotoGrid photos={album.photos} title={album.title} /> : <Empty icon="images" title={t.library.albumEmpty} />}
          <div>
            <TextLink href="/thu-vien">{t.library.allAlbums}</TextLink>
          </div>
        </div>
      </section>
    </>
  );
}
