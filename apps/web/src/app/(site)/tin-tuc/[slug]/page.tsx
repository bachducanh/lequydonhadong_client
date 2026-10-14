import type { Metadata } from 'next';
import { NewsCard } from '@/components/site/blocks';
import { CommentSection } from '@/components/site/forms';
import { CopyLinkButton, PromoBanner, ViewTracker } from '@/components/site/interactive';
import { Breadcrumb, Tag } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import { apiGet, apiOr404, apiSafe } from '@/lib/api';
import { formatDate, formatNumber, seedOf, toTone } from '@/lib/format';
import { label } from '@/lib/i18n';
import { getI18n } from '@/lib/i18n-server';
import type { Banner, CommentItem, PostCard, PostDetail } from '@/lib/types';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getI18n();
  const post = await apiGet<PostDetail>(`/posts/${encodeURIComponent(slug)}`).catch(() => null);
  if (!post) return { title: t.article.notFound };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: { title: post.title, description: post.excerpt ?? undefined, images: post.thumbnail ? [post.thumbnail] : undefined, type: 'article' },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await getI18n();
  const path = `/posts/${encodeURIComponent(slug)}`;
  const post = await apiOr404<PostDetail>(path);
  const [related, comments, banners] = await Promise.all([
    apiSafe<PostCard[]>(`${path}/related`, undefined, []),
    apiSafe<CommentItem[]>(`${path}/comments`, undefined, []),
    apiSafe<Banner[]>('/banners', { position: 'SIDEBAR' }, []),
  ]);
  const categoryName = post.category ? label(lang, 'category', post.category.name, post.category.slug) : t.article.news;

  return (
    <section className="lqd-section lqd-section-article">
      <ViewTracker slug={post.slug} />
      <div className="lqd-container lqd-with-aside">
        <article className="lqd-article">
          <Breadcrumb
            items={[
              { label: t.common.home, href: '/' },
              { label: t.article.news, href: '/tin-tuc' },
              ...(post.category ? [{ label: categoryName, href: `/tin-tuc?chuyen-muc=${post.category.slug}` }] : []),
            ]}
          />
          <div className="lqd-article-tags">
            <Tag>{categoryName}</Tag>
            {post.badge && <Tag tone={toTone(post.badgeTone)}>{label(lang, 'badge', post.badge)}</Tag>}
          </div>
          <h1 className="lqd-article-title">{post.title}</h1>
          <div className="lqd-meta">
            <Icon name="calendar" />
            {formatDate(post.publishedAt)}
            <span className="lqd-meta-sep">
              <Icon name="user" />
              {post.authorName}
            </span>
            <span className="lqd-meta-sep">
              <Icon name="eye" />
              {t.common.views(formatNumber(post.views, lang))}
            </span>
          </div>
          {post.excerpt && <p className="lqd-article-lead">{post.excerpt}</p>}
          <Thumb seed={seedOf(post.id)} src={post.thumbnail} alt={post.imageCaption ?? ''} className="lqd-article-img" />
          {post.imageCaption && <p className="lqd-caption">{post.imageCaption}</p>}
          <div className="lqd-prose" dangerouslySetInnerHTML={{ __html: post.content }} />
          <div className="lqd-share">
            {t.article.share}
            <CopyLinkButton />
          </div>
          <CommentSection slug={post.slug} items={comments} allowComments={post.allowComments} />
        </article>
        <aside className="lqd-aside">
          {related.length > 0 && (
            <div>
              <h4>{t.article.related}</h4>
              <div className="lqd-stack" style={{ gap: 12 }}>
                {related.map((n) => (
                  <NewsCard key={n.id} post={n} compact lang={lang} />
                ))}
              </div>
            </div>
          )}
          {banners[0] && <PromoBanner banner={banners[0]} seed={2} />}
        </aside>
      </div>
    </section>
  );
}
