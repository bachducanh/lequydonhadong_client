import type { Metadata } from 'next';
import { AlbumCard, PageHeader } from '@/components/site/blocks';
import { QuerySelect } from '@/components/site/query-select';
import { Button, Empty, FilterTabs, Pagination, Tag } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import { apiSafe, emptyPage, pageOf, pick } from '@/lib/api';
import { fileExt, formatDate, formatSize, seedOf } from '@/lib/format';
import type { AlbumCard as Album, LibraryItem, LibraryType, Paged } from '@/lib/types';
import { hrefWith } from '@/lib/url';

export const metadata: Metadata = { title: 'Thư viện ảnh & tư liệu', description: 'Album hoạt động, video và bài giảng của thầy cô.' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LibraryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const kind = pick(sp, 'kieu');
  const year = pick(sp, 'nam-hoc');
  const page = pageOf(sp);

  const types = (await apiSafe<LibraryType[]>('/library-types', undefined, [])).filter((t) => t.slug !== 'anh');
  const activeType = types.find((t) => t.slug === kind);
  const tabs = [{ label: 'Albums ảnh', slug: undefined as string | undefined }, ...types.map((t) => ({ label: t.name, slug: t.slug }))];
  const active = activeType ? tabs.findIndex((t) => t.slug === activeType.slug) : 0;

  const albums = activeType ? null : await apiSafe<Paged<Album>>('/albums', { year, page, limit: 9 }, emptyPage<Album>());
  const items = activeType ? await apiSafe<Paged<LibraryItem>>('/library-items', { type: activeType.slug, page, limit: 12 }, emptyPage<LibraryItem>()) : null;
  const years = (albums?.meta.years as string[] | undefined) ?? [];
  const totalPages = (albums ?? items)?.meta.totalPages ?? 1;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Trang chủ', href: '/' }, { label: 'Thư viện' }]}
        eyebrow="Thư viện"
        title="Thư viện ảnh & tư liệu"
        description="Album hoạt động, video và bài giảng của thầy cô."
      />
      <section className="lqd-section">
        <div className="lqd-container">
          <div className="lqd-listbar">
            <FilterTabs value={active} items={tabs.map((t) => ({ label: t.label, href: hrefWith('/thu-vien', { kieu: t.slug }) }))} />
            {!activeType && years.length > 0 && (
              <QuerySelect name="nam-hoc" label="Năm học" value={year} options={[{ value: '', label: 'Mọi năm học' }, ...years.map((y) => ({ value: y, label: `Năm học ${y}` }))]} />
            )}
          </div>

          {albums &&
            (albums.data.length ? (
              <div className="lqd-grid-3" style={{ rowGap: 40 }}>
                {albums.data.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            ) : (
              <Empty icon="images" title="Chưa có album" />
            ))}

          {items &&
            (items.data.length ? (
              <div className="lqd-grid-3">
                {items.data.map((it) => {
                  const href = it.fileUrl ?? it.externalUrl;
                  return (
                    <div key={it.id} className="lqd-card">
                      <Thumb seed={seedOf(it.id)} src={it.thumbnail} className="aspect-video">
                        {!it.thumbnail && (
                          <span className="absolute inset-0 grid place-items-center text-primary-text">
                            <Icon name={it.type.slug === 'video' ? 'video' : 'fileText'} size={40} />
                          </span>
                        )}
                      </Thumb>
                      <div className="flex flex-1 flex-col gap-2 p-6">
                        <div className="flex gap-2">
                          <Tag>{it.type.name}</Tag>
                          {it.fileName && (
                            <Tag tone="neutral" noIcon>
                              {fileExt(it.fileName)}
                            </Tag>
                          )}
                        </div>
                        <h3 className="m-0 text-lg font-semibold leading-[26px] text-ink">{it.title}</h3>
                        {it.description && <p className="m-0 text-[15px] leading-6 text-ink-muted">{it.description}</p>}
                        <div className="lqd-meta">
                          <Icon name="calendar" />
                          {formatDate(it.createdAt)}
                          {it.fileSize ? <span className="lqd-meta-sep">{formatSize(it.fileSize)}</span> : null}
                        </div>
                        <div className="pt-2">
                          {href ? (
                            <Button variant="secondary" size="sm" iconLeft={it.externalUrl && !it.fileUrl ? 'external' : 'download'} href={href} newTab>
                              {it.externalUrl && !it.fileUrl ? 'Mở liên kết' : 'Xem / tải về'}
                            </Button>
                          ) : (
                            <span className="lqd-field-hint">Đang cập nhật</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty icon="layers" title={`Chưa có mục nào trong ${activeType?.name.toLowerCase()}`} />
            ))}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
            <Pagination page={page} total={totalPages} hrefFor={(p) => hrefWith('/thu-vien', { kieu: kind, 'nam-hoc': year, trang: p })} />
          </div>
        </div>
      </section>
    </>
  );
}
