import type { Metadata } from 'next';
import { PageHeader } from '@/components/site/blocks';
import { PhotoGrid } from '@/components/site/interactive';
import { Empty, TextLink } from '@/components/ui/basics';
import { apiGet, apiOr404 } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { AlbumDetail } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const album = await apiGet<AlbumDetail>(`/albums/${encodeURIComponent(id)}`).catch(() => null);
  return album ? { title: album.title, description: album.description ?? undefined } : { title: 'Không tìm thấy album' };
}

export default async function AlbumPage({ params }: Props) {
  const { id } = await params;
  const album = await apiOr404<AlbumDetail>(`/albums/${encodeURIComponent(id)}`);
  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Trang chủ', href: '/' }, { label: 'Thư viện', href: '/thu-vien' }, { label: album.title }]}
        eyebrow={`${album.photos.length} ảnh · ${formatDate(album.eventDate)}`}
        title={album.title}
        description={album.description ?? undefined}
      />
      <section className="lqd-section">
        <div className="lqd-container lqd-stack" style={{ gap: 32 }}>
          {album.photos.length ? <PhotoGrid photos={album.photos} title={album.title} /> : <Empty icon="images" title="Album chưa có ảnh" />}
          <div>
            <TextLink href="/thu-vien">Xem tất cả album</TextLink>
          </div>
        </div>
      </section>
    </>
  );
}
