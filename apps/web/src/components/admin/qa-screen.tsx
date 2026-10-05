'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Button, Empty, Field, FilterTabs } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { api } from '@/lib/client-api';
import { formatDate } from '@/lib/format';
import { QA_TOPICS } from '@/lib/site';
import type { Paged } from '@/lib/types';
import { useAdmin } from './admin-shell';
import { DataTable, type Row } from './data-table';
import { AdminHead, Panel, Spinner, useConfirm, useToast } from './ui';

const TABS = [
  { label: 'Chờ trả lời', status: 'PENDING' },
  { label: 'Đã trả lời', status: 'ANSWERED' },
  { label: 'Đã ẩn', status: 'HIDDEN' },
  { label: 'Tất cả', status: '' },
];

const STATUS: Record<string, { label: string; tone: 'warning' | 'success' | 'neutral' }> = {
  PENDING: { label: 'Chờ trả lời', tone: 'warning' },
  ANSWERED: { label: 'Đã trả lời', tone: 'success' },
  HIDDEN: { label: 'Đã ẩn', tone: 'neutral' },
};

/** Hỏi đáp: danh sách câu hỏi bên trái, khung trả lời bên phải. */
export function QAScreen() {
  const toast = useToast();
  const confirm = useConfirm();
  const { refreshBadges } = useAdmin();
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [data, setData] = useState<Paged<Row> | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [answer, setAnswer] = useState('');
  const [topic, setTopic] = useState(QA_TOPICS[0]);
  const [answeredBy, setAnsweredBy] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<Paged<Row>>('/admin/questions', { query: { status: TABS[tab].status, q, page, limit: 15 } })
      .then((res) => {
        setData(res);
        setSelected((cur) => res.data.find((r) => r.id === cur?.id) ?? res.data[0] ?? null);
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Không tải được câu hỏi', true));
  }, [tab, q, page, toast]);

  useEffect(load, [load]);

  useEffect(() => {
    setAnswer(selected?.answer ?? '');
    setTopic(selected?.topic ?? QA_TOPICS[0]);
    setAnsweredBy(selected?.answeredBy ?? '');
  }, [selected]);

  const submit = async (status: 'ANSWERED' | 'PENDING' | 'HIDDEN') => {
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/admin/questions/${selected.id}`, { method: 'PATCH', body: { answer: answer.trim() || null, topic, answeredBy: answeredBy.trim() || null, status } });
      toast(status === 'ANSWERED' ? 'Đã xuất bản câu trả lời' : status === 'HIDDEN' ? 'Đã ẩn câu hỏi' : 'Đã lưu nháp');
      refreshBadges();
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không lưu được', true);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected || !(await confirm({ title: 'Xoá câu hỏi này?', message: 'Thao tác không thể hoàn tác.', confirmLabel: 'Xoá', danger: true }))) return;
    await api(`/admin/questions/${selected.id}`, { method: 'DELETE' }).catch((e) => toast(e.message, true));
    toast('Đã xoá câu hỏi');
    setSelected(null);
    refreshBadges();
    load();
  };

  const counts = (data?.meta.counts ?? {}) as Record<string, number>;

  return (
    <>
      <AdminHead title="Hỏi đáp" description="Câu hỏi của phụ huynh, học sinh. Câu hỏi đã trả lời sẽ hiển thị ở trang Hỏi đáp công khai." />
      <div className="lqd-admin-split">
        <div>
          <div className="lqd-toolbar">
            <FilterTabs
              value={tab}
              items={TABS.map((t) => ({ label: t.label, count: counts[t.status || 'ALL'] ?? 0 }))}
              onChange={(i) => {
                setTab(i);
                setPage(1);
              }}
            />
            <form
              className="lqd-admin-search lqd-toolbar-search"
              role="search"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setQ(String(new FormData(e.currentTarget).get('q') ?? ''));
                setPage(1);
              }}
            >
              <Icon name="search" />
              <input name="q" placeholder="Tìm câu hỏi…" aria-label="Tìm câu hỏi" />
            </form>
          </div>
          {!data ? (
            <Spinner />
          ) : (
            <DataTable
              rows={data.data}
              onRowClick={setSelected}
              rowClass={(r) => (r.id === selected?.id ? 'is-new' : undefined)}
              columns={[
                { key: 'question', label: 'Câu hỏi', type: 'title', sub: (r) => [r.askerName, r.askerRole, formatDate(r.createdAt)].filter(Boolean).join(' · ') },
                { key: 'topic', label: 'Chủ đề', type: 'tag', tag: (r) => ({ label: r.topic, tone: 'neutral' }) },
                { key: 'status', label: 'Trạng thái', type: 'tag', tag: (r) => STATUS[r.status] },
              ]}
              empty={<Empty icon="help" title="Không có câu hỏi" />}
              footer={{ page, totalPages: data.meta.totalPages, total: data.meta.total, onPage: setPage }}
            />
          )}
        </div>
        <Panel title="Trả lời câu hỏi">
          {selected ? (
            <div className="lqd-stack">
              <div className="lqd-quote">
                <b>{selected.question}</b>
                <small>
                  {selected.askerName}
                  {selected.askerRole ? ` · ${selected.askerRole}` : ''} · {formatDate(selected.createdAt)}
                  {selected.askerEmail ? ` · ${selected.askerEmail}` : ''}
                </small>
              </div>
              <Field label="Chủ đề">
                <select className="lqd-input" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {[...new Set([...QA_TOPICS, topic])].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Câu trả lời" hint="Hiển thị công khai ở trang Hỏi đáp sau khi xuất bản.">
                <textarea className="lqd-input" rows={7} value={answer} onChange={(e) => setAnswer(e.target.value)} />
              </Field>
              <Field label="Người trả lời" hint="Để trống: dùng tên tài khoản của bạn">
                <input className="lqd-input" value={answeredBy} onChange={(e) => setAnsweredBy(e.target.value)} placeholder="Văn phòng nhà trường" />
              </Field>
              <div className="lqd-row">
                <Button iconLeft="check" onClick={() => submit('ANSWERED')} disabled={busy || !answer.trim()}>
                  {selected.status === 'ANSWERED' ? 'Cập nhật trả lời' : 'Xuất bản trả lời'}
                </Button>
                <Button variant="secondary" onClick={() => submit('PENDING')} disabled={busy}>
                  Lưu nháp
                </Button>
                {selected.status !== 'HIDDEN' && (
                  <Button variant="ghost" onClick={() => submit('HIDDEN')} disabled={busy}>
                    Ẩn
                  </Button>
                )}
                <Button variant="ghost" iconLeft="trash" onClick={remove} disabled={busy}>
                  Xoá
                </Button>
              </div>
            </div>
          ) : (
            <p className="m-0 text-sm text-ink-muted">Chọn một câu hỏi ở danh sách bên trái để trả lời.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
