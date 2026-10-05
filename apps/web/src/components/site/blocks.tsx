/** Khối giao diện trang công khai (Server Components) — chuyển từ LQD.* của bản thiết kế. */
import Form from 'next/form';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumb, Button, Tag, TextLink } from '@/components/ui/basics';
import { Icon, type IconName } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import { cx } from '@/lib/cx';
import { dayMonth, fileExt, formatDate, formatNumber, formatSize, seedOf, toTone } from '@/lib/format';
import { SEARCH_CHIPS } from '@/lib/site';
import type { AlbumCard as Album, DownloadFile, LegalDocument, LinkItem, PostCard, TickerItem, Tone } from '@/lib/types';

/* ---------- Tìm kiếm ---------- */

export function SearchBar({
  action = '/tim-kiem',
  placeholder = 'Tìm tin tức, thông báo, văn bản…',
  defaultValue,
  buttonLabel = 'Tìm kiếm',
  hidden,
}: {
  action?: string;
  placeholder?: string;
  defaultValue?: string;
  buttonLabel?: string;
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <Form action={action} className="lqd-search" role="search">
      <Icon name="search" />
      <input name="q" type="search" placeholder={placeholder} aria-label="Tìm kiếm" defaultValue={defaultValue} />
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <button type="submit">{buttonLabel}</button>
    </Form>
  );
}

export function SearchPanel({ title = 'Bạn đang tìm thông tin gì?', description = 'Tìm nhanh thông báo, văn bản, lịch học và tài liệu của nhà trường.' }: { title?: string; description?: string }) {
  return (
    <div className="lqd-container">
      <div className="lqd-searchpanel">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div>
          <SearchBar />
          <div className="lqd-chips">
            <span>Tìm nhiều:</span>
            {SEARCH_CHIPS.map((c) => (
              <Link key={c} href={`/tim-kiem?q=${encodeURIComponent(c)}`}>
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Chữ chạy ---------- */

export function Ticker({ items, label = 'Mới' }: { items: TickerItem[]; label?: string }) {
  if (!items.length) return null;
  const row = (dup: boolean) =>
    items.map((t) => (
      <Link key={(dup ? 'd' : '') + t.id} href={t.link || '/tin-tuc'} tabIndex={dup ? -1 : undefined}>
        <span className="lqd-ticker-dot" aria-hidden="true" />
        {t.text}
      </Link>
    ));
  return (
    <div className="lqd-ticker" role="region" aria-label="Tin nhanh">
      <div className="lqd-container">
        <span className="lqd-ticker-label">{label}</span>
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
}: {
  breadcrumb?: { label: string; href?: string }[];
  eyebrow?: string;
  title: string;
  description?: string;
  search?: { action: string; placeholder?: string; defaultValue?: string; hidden?: Record<string, string | undefined> };
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
            <SearchBar action={search.action} placeholder={search.placeholder} defaultValue={search.defaultValue} hidden={search.hidden} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Thẻ tin ---------- */

export function NewsCard({ post, featured, compact, tone }: { post: PostCard; featured?: boolean; compact?: boolean; tone?: Tone }) {
  return (
    <Link className={cx('lqd-card lqd-news', featured && 'lqd-news-featured', compact && 'lqd-news-compact')} href={`/tin-tuc/${post.slug}`}>
      <Thumb seed={seedOf(post.id)} src={post.thumbnail} alt="" className="lqd-news-media" />
      <div className="lqd-news-body">
        <div>
          <Tag tone={tone ?? 'brand'}>{post.category?.name ?? 'Tin tức'}</Tag>
        </div>
        <h3>{post.title}</h3>
        {post.excerpt && !compact && <p>{post.excerpt}</p>}
        <div className="lqd-meta">
          <Icon name="calendar" />
          {formatDate(post.publishedAt)}
          {!compact && post.views > 0 && (
            <span className="lqd-meta-sep">
              <Icon name="eye" />
              {formatNumber(post.views)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function AnnouncementList({ items }: { items: PostCard[] }) {
  return (
    <ul className="lqd-ann-list">
      {items.map((it) => {
        const { day, month } = dayMonth(it.publishedAt);
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
                    <Tag tone={toTone(it.badgeTone)}>{it.badge}</Tag>
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

export function ProgramCard({ icon = 'book', label, title, description, meta, actionLabel = 'Xem', href = '#' }: { icon?: IconName; label?: string; title: ReactNode; description?: ReactNode; meta?: ReactNode; actionLabel?: string; href?: string }) {
  return (
    <Link className="lqd-card lqd-prog" href={href}>
      <div className="lqd-prog-top">
        <span className="lqd-prog-icon">
          <Icon name={icon} />
        </span>
        {label && (
          <Tag tone="neutral" noIcon>
            {label}
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

export function AlbumCard({ album }: { album: Album }) {
  return (
    <Link className="lqd-album" href={`/thu-vien/album/${album.id}`}>
      <div className="lqd-album-stack">
        <span className="s2" />
        <span className="s1" />
        <Thumb seed={seedOf(album.id)} src={album.coverUrl} className="lqd-album-cover">
          <span className="lqd-album-count">
            <Icon name="image" />
            {album.photoCount} ảnh
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

export const legalToDoc = (d: LegalDocument, withType = true): DocItem => ({
  id: d.id,
  title: d.title,
  ext: fileExt(d.fileName),
  href: d.fileUrl,
  code: d.code,
  issuer: d.issuer,
  date: d.issuedAt ? formatDate(d.issuedAt) : null,
  type: withType ? d.type : null,
});

export const downloadToDoc = (f: DownloadFile): DocItem => ({
  id: f.id,
  title: f.name,
  ext: fileExt(f.fileName),
  href: f.fileUrl ? `/api/bff/downloads/${f.id}/file` : null,
  size: formatSize(f.fileSize),
  type: f.category,
  extra: `${formatNumber(f.downloads)} lượt tải`,
});

export function DocumentList({ items }: { items: DocItem[] }) {
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
                  Số hiệu: <b>{d.code}</b>
                </span>
              )}
              {d.issuer && <span>{d.issuer}</span>}
              {d.date && <span>Ban hành: {d.date}</span>}
              {d.size && <span>{d.size}</span>}
              {d.extra && <span>{d.extra}</span>}
            </div>
          </div>
          {d.type && (
            <Tag tone="neutral" noIcon>
              {d.type}
            </Tag>
          )}
          {d.href ? (
            <Button variant="secondary" size="sm" iconLeft="download" href={d.href} download>
              Tải về
            </Button>
          ) : (
            <Button variant="secondary" size="sm" iconLeft="clock" disabled title="Nhà trường đang cập nhật tệp">
              Đang cập nhật
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Liên kết hữu ích ---------- */

export function QuickLinks({ items }: { items: LinkItem[] }) {
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
          <div key={it.id} className="lqd-quick-item" title="Đang cập nhật">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
