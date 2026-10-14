import type { Metadata } from 'next';
import { AlbumCard, PageHeader } from '@/components/site/blocks';
import { QuerySelect } from '@/components/site/query-select';
import { Button, Empty, FilterTabs, Pagination, Tag } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import { apiSafe, emptyPage, pageOf, pick } from '@/lib/api';
import { fileExt, formatDate, formatSize, seedOf } from '@/lib/format';
import { label } from '@/lib/i18n';
import { getI18n } from '@/lib/i18n-server';
import type { AlbumCard as Album, LibraryItem, LibraryType, Paged } from '@/lib/types';
import { hrefWith } from '@/lib/url';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.library.title, description: t.library.desc };
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LibraryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { lang, t } = await getI18n();
  const kind = pick(sp, 'kieu');
  const year = pick(sp, 'nam-hoc');
  const page = pageOf(sp);

  const types = (await apiSafe<LibraryType[]>('/library-types', undefined, [])).filter((ty) => ty.slug !== 'anh');
  const activeType = types.find((ty) => ty.slug === kind);
  const typeName = (ty: LibraryType) => label(lang, 'libraryType', ty.name, ty.slug);
  const tabs = [{ label: t.library.albumsTab, slug: undefined as string | undefined }, ...types.map((ty) => ({ label: typeName(ty), slug: ty.slug }))];
  const active = activeType ? tabs.findIndex((tab) => tab.slug === activeType.slug) : 0;

  const albums = activeType ? null : await apiSafe<Paged<Album>>('/albums', { year, page, limit: 9 }, emptyPage<Album>());
  const items = activeType ? await apiSafe<Paged<LibraryItem>>('/library-items', { type: activeType.slug, page, limit: 12 }, emptyPage<LibraryItem>()) : null;
  const years = (albums?.meta.years as string[] | undefined) ?? [];
  const totalPages = (albums ?? items)?.meta.totalPages ?? 1;

  return (
    <>
      <PageHeader lang={lang} breadcrumb={[{ label: t.common.home, href: '/' }, { label: t.library.eyebrow }]} eyebrow={t.library.eyebrow} title={t.library.title} description={t.library.desc} />
      <section className="lqd-section">
        <div className="lqd-container">
          <div className="lqd-listbar">
            <FilterTabs value={active} items={tabs.map((tab) => ({ label: tab.label, href: hrefWith('/thu-vien', { kieu: tab.slug }) }))} />
            {!activeType && years.length > 0 && (
              <QuerySelect name="nam-hoc" label={t.library.year} value={year} options={[{ value: '', label: t.library.allYears }, ...years.map((y) => ({ value: y, label: t.library.yearOption(y) }))]} />
            )}
          </div>

          {albums &&
            (albums.data.length ? (
              <div className="lqd-grid-3 lqd-grid-roomy">
                {albums.data.map((a) => (
                  <AlbumCard key={a.id} album={a} lang={lang} />
                ))}
              </div>
            ) : (
              <Empty icon="images" title={t.library.noAlbums} />
            ))}

          {items &&
            (items.data.length ? (
              <div className="lqd-grid-3">
                {items.data.map((it) => {
                  const href = it.fileUrl ?? it.externalUrl;
                  const external = !!it.externalUrl && !it.fileUrl;
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
                        <div className="flex flex-wrap gap-2">
                          <Tag>{label(lang, 'libraryType', it.type.name, it.type.slug)}</Tag>
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
                          {it.fileSize ? <span className="lqd-meta-sep">{formatSize(it.fileSize, lang)}</span> : null}
                        </div>
                        <div className="pt-2">
                          {href ? (
                            <Button variant="secondary" size="sm" iconLeft={external ? 'external' : 'download'} href={href} newTab>
                              {external ? t.library.openLink : t.library.viewDownload}
                            </Button>
                          ) : (
                            <span className="lqd-field-hint">{t.common.updating}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty icon="layers" title={t.library.emptyType(typeName(activeType!).toLowerCase())} />
            ))}

          <div className="lqd-pager-row">
            <Pagination lang={lang} page={page} total={totalPages} hrefFor={(p) => hrefWith('/thu-vien', { kieu: kind, 'nam-hoc': year, trang: p })} />
          </div>
        </div>
      </section>
    </>
  );
}
