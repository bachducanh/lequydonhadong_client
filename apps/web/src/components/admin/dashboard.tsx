'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, TextLink } from '@/components/ui/basics';
import { Icon, type IconName } from '@/components/ui/icon';
import { api } from '@/lib/client-api';
import { formatDate, formatNumber } from '@/lib/format';
import { canAccess } from './admin-nav';
import { useAdmin } from './admin-shell';
import { DataTable } from './data-table';
import { AdminHead, Panel, Spinner, StatCard } from './ui';

interface Stats {
  posts: { published: number; publishedWeek: number; pending: number };
  pending: { comments: number; questions: number; feedbacks: number; club: number; posts: number };
  oldestQuestionAt: string | null;
  recentPosts: { id: string; title: string; slug: string; status: string; publishedAt: string | null; updatedAt: string; thumbnail: string | null }[];
}

const STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  PUBLISHED: { label: 'Đã đăng', tone: 'success' },
  PENDING: { label: 'Chờ duyệt', tone: 'warning' },
  DRAFT: { label: 'Nháp', tone: 'neutral' },
};

export function Dashboard() {
  const { user } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>('/admin/stats').then(setStats).catch(() => undefined);
  }, []);

  const today = formatDate(new Date());
  const firstName = user?.fullName.split(' ').slice(-2).join(' ');
  const oldestDays = stats?.oldestQuestionAt ? Math.max(0, Math.floor((Date.now() - new Date(stats.oldestQuestionAt).getTime()) / 86_400_000)) : null;

  const todos: [IconName, string, number, string][] = stats
    ? ([
        ['message', 'phản hồi bài viết chờ duyệt', stats.pending.comments, 'phan-hoi'],
        ['help', 'câu hỏi chưa trả lời', stats.pending.questions, 'hoi-dap'],
        ['inbox', 'góp ý mới', stats.pending.feedbacks, 'gop-y'],
        ['heart', 'đăng ký CLB kết bạn', stats.pending.club, 'clb'],
        ['fileText', 'bài viết chờ duyệt', stats.pending.posts, 'tin-bai'],
      ] as [IconName, string, number, string][]).filter(([, , n, key]) => n > 0 && canAccess(key as never, user?.role))
    : [];

  return (
    <>
      <AdminHead
        title={`Xin chào, ${firstName ?? '…'}`}
        breadcrumb={[{ label: 'Trang chủ' }]}
        description={`Tổng quan nội dung website hôm nay, ${today}.`}
        actions={
          <Button iconLeft="plus" href="/quan-tri/tin-bai/moi">
            Viết bài mới
          </Button>
        }
      />
      {!stats ? (
        <Spinner />
      ) : (
        <>
          <div className="lqd-stat-grid">
            <StatCard icon="fileText" label="Tin bài đã đăng" value={formatNumber(stats.posts.published)} note={`+${stats.posts.publishedWeek} trong tuần`} noteTone="up" />
            <StatCard icon="message" label="Phản hồi chờ duyệt" value={stats.pending.comments} note={stats.pending.comments ? 'Cần xử lý' : 'Đã xử lý hết'} noteTone={stats.pending.comments ? 'warn' : 'up'} />
            <StatCard icon="help" label="Câu hỏi chờ trả lời" value={stats.pending.questions} note={oldestDays !== null ? `Cũ nhất ${oldestDays} ngày` : 'Đã trả lời hết'} noteTone={oldestDays !== null ? 'warn' : 'up'} />
            <StatCard icon="inbox" label="Góp ý mới" value={stats.pending.feedbacks} />
          </div>
          <div className="lqd-admin-split">
            <Panel title="Bài viết gần đây" action={<TextLink href="/quan-tri/tin-bai">Tất cả</TextLink>} flush>
              <DataTable
                rows={stats.recentPosts}
                columns={[
                  { key: 'title', label: 'Bài viết', type: 'title', thumb: (r) => r.thumbnail },
                  { key: 'date', label: 'Ngày', type: 'muted', get: (r) => formatDate(r.publishedAt ?? r.updatedAt) },
                  { key: 'status', label: 'Trạng thái', type: 'tag', tag: (r) => STATUS[r.status] },
                ]}
                actions={[{ key: 'edit', icon: 'edit', label: 'Sửa', href: (r) => `/quan-tri/tin-bai/${r.id}` }]}
              />
            </Panel>
            <div className="lqd-stack">
              <Panel title="Cần xử lý">
                {todos.length ? (
                  <ul className="lqd-todo">
                    {todos.map(([icon, label, n, key]) => (
                      <li key={key}>
                        <Link href={`/quan-tri/${key}`}>
                          <span className="lqd-todo-icon">
                            <Icon name={icon} />
                          </span>
                          {n} {label}
                          <Icon name="chevron" className="lqd-ann-chevron" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 flex items-center gap-2 text-sm text-ink-muted">
                    <Icon name="check" /> Không có việc chờ xử lý.
                  </p>
                )}
              </Panel>
              <Panel title="Lối tắt">
                <div className="lqd-shortcuts">
                  {(
                    [
                      ['images', 'Slider trang chủ', 'anh-gioi-thieu'],
                      ['megaphone', 'Chữ chạy', 'chu-chay'],
                      ['scale', 'Văn bản mới', 'van-ban'],
                      ['upload', 'Tải tệp lên', 'download'],
                    ] as [IconName, string, string][]
                  )
                    .filter(([, , key]) => canAccess(key as never, user?.role))
                    .map(([icon, label, key]) => (
                      <Link key={key} href={`/quan-tri/${key}`}>
                        <Icon name={icon} />
                        {label}
                      </Link>
                    ))}
                </div>
              </Panel>
            </div>
          </div>
        </>
      )}
    </>
  );
}
