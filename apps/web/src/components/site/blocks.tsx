/** Khối giao diện trang công khai (Server Components) — chuyển từ LQD.* của bản thiết kế. */
import Form from 'next/form';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumb, Button, Tag, TextLink } from '@/components/ui/basics';
import { Icon, type IconName } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import { cx } from '@/lib/cx';
import { dayMonth, fileExt, formatDate, formatNumber, formatSize, seedOf, toTone } from '@/lib/format';
import { dict, label, type Lang } from '@/lib/i18n';
import { SEARCH_CHIPS } from '@/lib/site';
import type { AlbumCard as Album, DownloadFile, LegalDocument, LinkItem, PostCard, TickerItem, Tone } from '@/lib/types';

/* ---------- Tìm kiếm ---------- */

export function SearchBar({
  action = '/tim-kiem',
  placeholder,
  defaultValue,
  hidden,
  lang = 'vi',
}: {
  action?: string;
  placeholder?: string;
  defaultValue?: string;
  hidden?: Record<string, string | undefined>;
  lang?: Lang;
}) {
  const t = dict(lang).search;
  return (
    <Form action={action} className="lqd-search" role="search">
      <Icon name="search" />
      <input name="q" type="search" placeholder={placeholder ?? t.placeholder} aria-label={t.aria} defaultValue={defaultValue} enterKeyHint="search" />
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <button type="submit" aria-label={t.button}>
        <Icon name="search" className="lqd-search-btn-icon" />
        <span className="lqd-search-btn-text">{t.button}</span>
      </button>
    </Form>
  );
}

export function SearchPanel({ lang, overlap = true }: { lang: Lang; overlap?: boolean }) {
  const t = dict(lang).search;
  return (
    <div className="lqd-container">
      <div className={cx('lqd-searchpanel', !overlap && 'lqd-searchpanel-flat')}>
        <div>
          <h2>{t.panelTitle}</h2>
          <p>{t.panelDesc}</p>
        </div>
        <div>
          <SearchBar lang={lang} />
          <div className="lqd-chips">
            <span>{t.popular}</span>
            {SEARCH_CHIPS.map((c) => (
              <Link key={c.q} href={`/tim-kiem?q=${encodeURIComponent(c.q)}`}>
                {lang === 'en' ? c.en : c.q}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Chữ chạy ---------- */

export function Ticker({ items, lang = 'vi' }: { items: TickerItem[]; lang?: Lang }) {
  if (!items.length) return null;
  const t = dict(lang).ticker;
  const row = (dup: boolean) =>
    items.map((it) => (
      <Link key={(dup ? 'd' : '') + it.id} href={it.link || '/tin-tuc'} tabIndex={dup ? -1 : undefined}>
        <span className="lqd-ticker-dot" aria-hidden="true" />
        {it.text}
      </Link>
    ));
  return (
    <div className="lqd-ticker" role="region" aria-label={t.aria}>
      <div className="lqd-container">
        <span className="lqd-ticker-label">{t.label}</span>
        <div className="lqd-ticker-viewport">
          <div className="lqd-ticker-track">
            {row(false)}
            <span aria-hidden="true" className="lqd-ticker-dup">
              {row(true)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Tiêu đề ---------- */

export function SectionHeader({ eyebrow, title, description, actionLabel, actionHref }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="lqd-sechead">
      <div>
        {eyebrow && <p className="lqd-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actionLabel && <TextLink href={actionHref}>{actionLabel}</TextLink>}
    </div>
  );
}

export function PageHeader({
  breadcrumb,
  eyebrow,
  title,
  description,
  search,
  lang = 'vi',
}: {
  breadcrumb?: { label: string; href?: string }[];
  eyebrow?: string;
  title: string;
  description?: string;
  search?: { action: string; placeholder?: string; defaultValue?: string; hidden?: Record<string, string | undefined> };
  lang?: Lang;
}) {
  return (
    <section className="lqd-pagehead">
      <div className="lqd-container">
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        {eyebrow && <p className="lqd-slide-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="lqd-pagehead-lead">{description}</p>}
        {search && (
          <div style={{ marginTop: 24 }}>
            <SearchBar action={search.action} placeholder={search.placeholder} defaultValue={search.defaultValue} hidden={search.hidden} lang={lang} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Thẻ tin ---------- */

export function NewsCard({ post, featured, compact, tone, lang = 'vi' }: { post: PostCard; featured?: boolean; compact?: boolean; tone?: Tone; lang?: Lang }) {
  const category = post.category ? label(lang, 'category', post.category.name, post.category.slug) : dict(lang).article.news;
  return (
    <Link className={cx('lqd-card lqd-news', featured && 'lqd-news-featured', compact && 'lqd-news-compact')} href={`/tin-tuc/${post.slug}`}>
      <Thumb seed={seedOf(post.id)} src={post.thumbnail} alt="" className="lqd-news-media" />
      <div className="lqd-news-body">
        <div>
          <Tag tone={tone ?? 'brand'}>{category}</Tag>
        </div>
        <h3>{post.title}</h3>
        {post.excerpt && !compact && <p>{post.excerpt}</p>}
        <div className="lqd-meta">
          <Icon name="calendar" />
          {formatDate(post.publishedAt)}
          {!compact && post.views > 0 && (
            <span className="lqd-meta-sep">
              <Icon name="eye" />
              {formatNumber(post.views, lang)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function AnnouncementList({ items, lang = 'vi' }: { items: PostCard[]; lang?: Lang }) {
  return (
    <ul className="lqd-ann-list">
      {items.map((it) => {
        const { day, month } = dayMonth(it.publishedAt, lang);
        return (
          <li key={it.id}>
            <Link className="lqd-ann" href={`/tin-tuc/${it.slug}`}>
              <div className="lqd-ann-date">
                <b>{day}</b>
                <span>{month}</span>
              </div>
              <div className="lqd-ann-main">
                {it.badge && (
                  <div>
                    <Tag tone={toTone(it.badgeTone)}>{label(lang, 'badge', it.badge)}</Tag>
                  </div>
                )}
                <h4>{it.title}</h4>
                {it.excerpt && <p>{it.excerpt}</p>}
              </div>
              <Icon name="chevron" className="lqd-ann-chevron" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ProgramCard({ icon = 'book', label: tag, title, description, meta, actionLabel, href = '#' }: { icon?: IconName; label?: string; title: ReactNode; description?: ReactNode; meta?: ReactNode; actionLabel: string; href?: string }) {
  return (
    <Link className="lqd-card lqd-prog" href={href}>
      <div className="lqd-prog-top">
        <span className="lqd-prog-icon">
          <Icon name={icon} />
        </span>
        {tag && (
          <Tag tone="neutral" noIcon>
            {tag}
          </Tag>
        )}
      </div>
      <h4>{title}</h4>
      {description && <p>{description}</p>}
      <div className="lqd-prog-foot">
        <span>{meta}</span>
        <b>
          {actionLabel}
          <Icon name="arrow" />
        </b>
      </div>
    </Link>
  );
}

export function AlbumCard({ album, lang = 'vi' }: { album: Album; lang?: Lang }) {
  return (
    <Link className="lqd-album" href={`/thu-vien/album/${album.id}`}>
      <div className="lqd-album-stack">
        <span className="s2" />
        <span className="s1" />
        <Thumb seed={seedOf(album.id)} src={album.coverUrl} className="lqd-album-cover">
          <span className="lqd-album-count">
            <Icon name="image" />
            {dict(lang).common.photos(album.photoCount)}
          </span>
        </Thumb>
      </div>
      <h4>{album.title}</h4>
      <div className="lqd-meta">
        <Icon name="calendar" />
        {formatDate(album.eventDate)}
      </div>
    </Link>
  );
}

/* ---------- Văn bản / tệp ---------- */

const FILE_TONE: Record<string, string> = { PDF: 'danger', DOC: 'brand', DOCX: 'brand', XLS: 'success', XLSX: 'success', PPT: 'warning', PPTX: 'warning' };

export interface DocItem {
  id: string;
  title: string;
  ext: string;
  href: string | null;
  code?: string | null;
  issuer?: string | null;
  date?: string | null;
  size?: string | null;
  type?: string | null;
  extra?: string | null;
}

export const legalToDoc = (d: LegalDocument, lang: Lang, withType = true): DocItem => ({
  id: d.id,
  title: d.title,
  ext: fileExt(d.fileName),
  href: d.fileUrl,
  code: d.code,
  issuer: label(lang, 'issuer', d.issuer),
  date: d.issuedAt ? formatDate(d.issuedAt) : null,
  type: withType ? label(lang, 'docType', d.type) : null,
});

export const downloadToDoc = (f: DownloadFile, lang: Lang): DocItem => ({
  id: f.id,
  title: f.name,
  ext: fileExt(f.fileName),
  href: f.fileUrl ? `/api/bff/downloads/${f.id}/file` : null,
  size: formatSize(f.fileSize, lang),
  type: label(lang, 'fileCategory', f.category),
  extra: dict(lang).common.downloads(formatNumber(f.downloads, lang)),
});

export function DocumentList({ items, lang = 'vi' }: { items: DocItem[]; lang?: Lang }) {
  const t = dict(lang).common;
  return (
    <div className="lqd-doclist">
      {items.map((d) => (
        <div className="lqd-doc" key={d.id}>
          <span className={`lqd-doc-icon lqd-doc-${FILE_TONE[d.ext] ?? 'neutral'}`}>
            <Icon name="fileText" />
            <small>{d.ext}</small>
          </span>
          <div className="lqd-doc-main">
            {d.href ? (
              <a href={d.href} target="_blank" rel="noopener">
                {d.title}
              </a>
            ) : (
              <a>{d.title}</a>
            )}
            <div className="lqd-doc-meta">
              {d.code && (
                <span>
                  {t.docNumber} <b>{d.code}</b>
                </span>
              )}
              {d.issuer && <span>{d.issuer}</span>}
              {d.date && (
                <span>
                  {t.issued} {d.date}
                </span>
              )}
              {d.size && <span>{d.size}</span>}
              {d.extra && <span>{d.extra}</span>}
            </div>
          </div>
          <div className="lqd-doc-actions">
            {d.type && (
              <Tag tone="neutral" noIcon>
                {d.type}
              </Tag>
            )}
            {d.href ? (
              <Button variant="secondary" size="sm" iconLeft="download" href={d.href} download>
                {t.download}
              </Button>
            ) : (
              <Button variant="secondary" size="sm" iconLeft="clock" disabled>
                {t.updating}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Liên kết hữu ích ---------- */

export function QuickLinks({ items, lang = 'vi' }: { items: LinkItem[]; lang?: Lang }) {
  return (
    <div className="lqd-quick">
      {items.map((it) => {
        const inner = (
          <>
            <span className="lqd-quick-icon">
              <Icon name={it.icon || 'link'} />
            </span>
            <span>
              <b>{it.name}</b>
              {it.sub && <small>{it.sub}</small>}
            </span>
            {it.url && it.openNewTab && <Icon name="external" className="lqd-quick-ext" />}
          </>
        );
        return it.url ? (
          <a key={it.id} href={it.url} className="lqd-quick-item" target={it.openNewTab ? '_blank' : undefined} rel={it.openNewTab ? 'noopener noreferrer' : undefined}>
            {inner}
          </a>
        ) : (
          <div key={it.id} className="lqd-quick-item" title={dict(lang).common.updating}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
