import type { Metadata } from 'next';
import { NewsCard } from '@/components/site/blocks';
import { CommentSection } from '@/components/site/forms';
import { CopyLinkButton, PromoBanner, ViewTracker } from '@/components/site/interactive';
import { Breadcrumb, Tag } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import { apiGet, apiOr404, apiSafe } from '@/lib/api';
import { formatDate, formatNumber, seedOf, toTone } from '@/lib/format';
import type { Banner, CommentItem, PostCard, PostDetail } from '@/lib/types';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await apiGet<PostDetail>(`/posts/${encodeURIComponent(slug)}`).catch(() => null);
  if (!post) return { title: 'Không tìm thấy bài viết' };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: { title: post.title, description: post.excerpt ?? undefined, images: post.thumbnail ? [post.thumbnail] : undefined, type: 'article' },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const path = `/posts/${encodeURIComponent(slug)}`;
  const post = await apiOr404<PostDetail>(path);
  const [related, comments, banners] = await Promise.all([
    apiSafe<PostCard[]>(`${path}/related`, undefined, []),
    apiSafe<CommentItem[]>(`${path}/comments`, undefined, []),
    apiSafe<Banner[]>('/banners', { position: 'SIDEBAR' }, []),
  ]);

  return (
    <section className="lqd-section" style={{ paddingTop: 40 }}>
      <ViewTracker slug={post.slug} />
      <div className="lqd-container lqd-with-aside">
        <article className="lqd-article">
          <Breadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tin tức', href: '/tin-tuc' },
              ...(post.category ? [{ label: post.category.name, href: `/tin-tuc?chuyen-muc=${post.category.slug}` }] : []),
            ]}
          />
          <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag>{post.category?.name ?? 'Tin tức'}</Tag>
            {post.badge && <Tag tone={toTone(post.badgeTone)}>{post.badge}</Tag>}
          </div>
          <h1 style={{ fontSize: 40, lineHeight: '48px', letterSpacing: '-.02em', margin: '12px 0 0', fontWeight: 800 }}>{post.title}</h1>
          <div className="lqd-meta">
            <Icon name="calendar" />
            {formatDate(post.publishedAt)}
            <span className="lqd-meta-sep">
              <Icon name="user" />
              {post.authorName}
            </span>
            <span className="lqd-meta-sep">
              <Icon name="eye" />
              {formatNumber(post.views)} lượt xem
            </span>
          </div>
          {post.excerpt && <p className="lqd-article-lead">{post.excerpt}</p>}
          <Thumb seed={seedOf(post.id)} src={post.thumbnail} alt={post.imageCaption ?? ''} className="lqd-article-img" />
          {post.imageCaption && <p className="lqd-caption">{post.imageCaption}</p>}
          <div className="lqd-prose" dangerouslySetInnerHTML={{ __html: post.content }} />
          <div className="lqd-share">
            Chia sẻ:
            <CopyLinkButton />
          </div>
          <CommentSection slug={post.slug} items={comments} allowComments={post.allowComments} />
        </article>
        <aside className="lqd-aside">
          {related.length > 0 && (
            <div>
              <h4>Tin liên quan</h4>
              <div className="lqd-stack" style={{ gap: 12 }}>
                {related.map((n) => (
                  <NewsCard key={n.id} post={n} compact />
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
