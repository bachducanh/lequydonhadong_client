'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, FilterTabs, Pagination, Tag, Toggle } from '@/components/ui/basics';
import { Icon, type IconName } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import { api } from '@/lib/client-api';
import { seedOf } from '@/lib/format';
import type { Paged } from '@/lib/types';
import { useAdmin } from './admin-shell';
import { type Column, DataTable, type Row, type RowAction, RowActions } from './data-table';
import { type FieldDef, ResourceFormDrawer, toFormValues, type Values } from './resource-form';
import { AdminHead, Panel, Spinner, useConfirm, useToast } from './ui';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Meta = Paged<Row>['meta'] & Record<string, any>;
export type Loaded = Record<string, any>;

export interface Ctx {
  meta: Meta;
  loaded: Loaded;
  reload: () => void;
  patch: (row: Row, body: Values, message?: string) => Promise<void>;
  remove: (row: Row) => Promise<void>;
  edit: (row: Row) => void;
  router: ReturnType<typeof useRouter>;
}

export interface ResourceConfig {
  title: string;
  description: string;
  endpoint: string;
  createLabel?: string;
  createHref?: string;
  /** Tải thêm dữ liệu phụ (danh sách chuyên mục, kiểu thư viện…) */
  loaders?: Record<string, string>;
  tabs?: (ctx: { meta: Meta; loaded: Loaded }) => { label: string; query: Record<string, string | undefined>; countKey?: string }[];
  filters?: (ctx: { meta: Meta; loaded: Loaded }) => { name: string; label: string; options: { value: string; label: string }[] }[];
  search?: string;
  view?: 'table' | 'grid';
  columns?: Column[];
  card?: (row: Row) => { title: string; meta?: ReactNode; thumb?: string | null; badge?: string | null; order?: number | null; toggleField?: string };
  fields?: (ctx: { loaded: Loaded; meta: Meta }) => FieldDef[];
  formTitle?: (mode: 'create' | 'edit', row?: Row) => string;
  /** Thông tin chỉ đọc hiển thị trên đầu biểu mẫu sửa */
  detail?: (row: Row) => [string, ReactNode][];
  /** Gọi GET /:id trước khi mở biểu mẫu (vd đánh dấu góp ý đã xem) */
  fetchOnEdit?: boolean;
  actions?: (ctx: Ctx) => RowAction[];
  preview?: (rows: Row[]) => ReactNode;
  reorder?: boolean;
  paginated?: boolean;
  rowClass?: (row: Row) => string | undefined;
  canCreate?: boolean;
}

export const DEFAULT_ACTIONS = (ctx: Ctx): RowAction[] => [
  { key: 'edit', icon: 'edit', label: 'Sửa', run: ctx.edit },
  { key: 'trash', icon: 'trash', label: 'Xoá', tone: 'danger', run: ctx.remove },
];

export function ResourceScreen({ config: c }: { config: ResourceConfig }) {
  const router = useRouter();
  const search = useSearchParams();
  const toast = useToast();
  const confirm = useConfirm();
  const { refreshBadges } = useAdmin();

  const [loaded, setLoaded] = useState<Loaded | null>(c.loaders ? null : {});
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [q, setQ] = useState(search.get('q') ?? '');
  const [query, setQuery] = useState(search.get('q') ?? '');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ mode: 'create' | 'edit'; row?: Row } | null>(null);
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!c.loaders) return;
    Promise.all(Object.entries(c.loaders).map(async ([k, url]) => [k, await api<any>(url).catch(() => null)] as const)).then((entries) => {
      const out: Loaded = {};
      for (const [k, v] of entries) out[k] = v && typeof v === 'object' && 'data' in v ? v.data : v;
      setLoaded(out);
    });
  }, [c.loaders]);

  const tabs = useMemo(() => (loaded && c.tabs ? c.tabs({ meta, loaded }) : []), [c, meta, loaded]);
  const tabQuery = tabs[tab]?.query ?? {};
  const tabKey = JSON.stringify(tabQuery);

  useEffect(() => {
    if (!loaded) return;
    const ctrl = new AbortController();
    setLoading(true);
    api<{ data: Row[]; meta?: Meta }>(c.endpoint, {
      query: { ...JSON.parse(tabKey), ...filters, q: query, ...(c.paginated === false ? {} : { page, limit: c.view === 'grid' ? 24 : 20 }) },
      signal: ctrl.signal,
    })
      .then((res) => {
        setRows(res.data);
        setMeta(res.meta ?? { page: 1, limit: res.data.length, total: res.data.length, totalPages: 1 });
        setLoading(false);
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        toast(e instanceof Error ? e.message : 'Không tải được dữ liệu', true);
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [c.endpoint, c.paginated, c.view, tabKey, filters, query, page, version, loaded, toast]);

  const patch = useCallback(
    async (row: Row, body: Values, message = 'Đã cập nhật') => {
      try {
        const updated = await api<Row>(`${c.endpoint}/${row.id}`, { method: 'PATCH', body });
        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...body, ...(updated && typeof updated === 'object' ? pickScalars(updated) : {}) } : r)));
        toast(message);
        refreshBadges();
        if (c.tabs) reload();
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Không cập nhật được', true);
      }
    },
    [c.endpoint, c.tabs, toast, refreshBadges, reload],
  );

  const remove = useCallback(
    async (row: Row) => {
      const ok = await confirm({ title: 'Xoá mục này?', message: 'Thao tác không thể hoàn tác.', confirmLabel: 'Xoá', danger: true });
      if (!ok) return;
      try {
        await api(`${c.endpoint}/${row.id}`, { method: 'DELETE' });
        toast('Đã xoá');
        refreshBadges();
        reload();
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Không xoá được', true);
      }
    },
    [c.endpoint, confirm, toast, refreshBadges, reload],
  );

  const edit = useCallback(
    async (row: Row) => {
      if (c.fetchOnEdit) {
        try {
          const full = await api<Row>(`${c.endpoint}/${row.id}`);
          setEditing({ mode: 'edit', row: full });
          setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...pickScalars(full) } : r)));
          refreshBadges();
          return;
        } catch {
          // dùng dữ liệu đang có
        }
      }
      setEditing({ mode: 'edit', row });
    },
    [c.endpoint, c.fetchOnEdit, refreshBadges],
  );

  const ctx: Ctx = { meta, loaded: loaded ?? {}, reload, patch, remove, edit, router };
  const actions = (c.actions ?? DEFAULT_ACTIONS)(ctx);
  const fields = c.fields?.({ loaded: loaded ?? {}, meta }) ?? [];
  const filterDefs = loaded && c.filters ? c.filters({ meta, loaded }) : [];
  const counts = (meta.counts ?? {}) as Record<string, number>;

  const onToggle = (row: Row, field: string, value: boolean) => patch(row, { [field]: value }, value ? 'Đã bật' : 'Đã tắt');
  const onReorder = async (ids: string[]) => {
    setRows((rs) => ids.map((id) => rs.find((r) => r.id === id)!));
    try {
      await api(`${c.endpoint}/reorder`, { method: 'PATCH', body: { ids } });
      toast('Đã lưu thứ tự');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không lưu được thứ tự', true);
      reload();
    }
  };

  const save = async (payload: Values) => {
    if (editing?.mode === 'edit' && editing.row) {
      await api(`${c.endpoint}/${editing.row.id}`, { method: 'PATCH', body: payload });
      toast('Đã lưu thay đổi');
    } else {
      await api(c.endpoint, { method: 'POST', body: payload });
      toast('Đã tạo mới');
    }
    setEditing(null);
    refreshBadges();
    reload();
  };

  const createButton =
    c.canCreate === false ? null : c.createHref ? (
      <Button iconLeft="plus" href={c.createHref}>
        {c.createLabel ?? 'Thêm mới'}
      </Button>
    ) : c.createLabel ? (
      <Button iconLeft="plus" onClick={() => setEditing({ mode: 'create' })} disabled={!loaded}>
        {c.createLabel}
      </Button>
    ) : null;

  return (
    <>
      <AdminHead title={c.title} description={c.description} actions={createButton} />

      <div className="lqd-toolbar">
        {tabs.length > 0 && (
          <FilterTabs
            value={tab}
            items={tabs.map((t) => ({ label: t.label, count: t.countKey ? (counts[t.countKey] ?? 0) : undefined }))}
            onChange={(i) => {
              setTab(i);
              setPage(1);
            }}
          />
        )}
        <div className="lqd-toolbar-row">
          <form
            className="lqd-admin-search lqd-toolbar-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(q);
              setPage(1);
            }}
          >
            <Icon name="search" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => q !== query && (setQuery(q), setPage(1))} placeholder={c.search ?? 'Tìm kiếm…'} aria-label="Tìm kiếm" />
          </form>
          {filterDefs.map((f) => (
            <select
              key={f.name}
              className="lqd-input lqd-select-sm"
              aria-label={f.label}
              value={filters[f.name] ?? ''}
              onChange={(e) => {
                setFilters((s) => ({ ...s, [f.name]: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">{f.label}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
          <span style={{ flex: 1 }} />
          {loading && <span className="lqd-spinner" aria-label="Đang tải" />}
        </div>
      </div>

      {c.preview && rows.length > 0 && (
        <Panel title="Xem trước trên trang chủ" flush className="lqd-preview-panel">
          {c.preview(rows)}
        </Panel>
      )}

      {!loaded || (loading && rows.length === 0) ? (
        <Spinner />
      ) : c.view === 'grid' ? (
        <>
          <MediaGrid rows={rows} card={c.card!} actions={actions} onToggle={onToggle} addLabel={c.createLabel} onAdd={c.createLabel && !c.createHref ? () => setEditing({ mode: 'create' }) : undefined} />
          {c.paginated !== false && meta.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination page={page} total={meta.totalPages} onChange={setPage} />
            </div>
          )}
        </>
      ) : (
        <DataTable
          columns={c.columns ?? []}
          rows={rows}
          actions={actions.length ? actions : undefined}
          onToggle={onToggle}
          onReorder={c.reorder && !query ? onReorder : undefined}
          rowClass={c.rowClass}
          empty={<Empty icon="inbox" title={query ? 'Không có kết quả phù hợp' : 'Chưa có dữ liệu'} />}
          footer={c.paginated === false ? undefined : { page, totalPages: meta.totalPages, total: meta.total, onPage: setPage }}
        />
      )}
      {c.reorder && rows.length > 1 && <p className="lqd-field-hint m-0">Kéo thả biểu tượng ⋮⋮ để sắp xếp thứ tự hiển thị.</p>}

      {editing && (
        <ResourceFormDrawer
          title={c.formTitle?.(editing.mode, editing.row) ?? (editing.mode === 'create' ? (c.createLabel ?? 'Thêm mới') : 'Chỉnh sửa')}
          fields={fields}
          initial={toFormValues(fields, editing.row ?? null)}
          mode={editing.mode}
          onClose={() => setEditing(null)}
          onSubmit={save}
          header={editing.row && c.detail ? <DetailList items={c.detail(editing.row)} /> : undefined}
        />
      )}
    </>
  );
}

function pickScalars(o: Row): Row {
  const out: Row = { id: o.id };
  for (const [k, v] of Object.entries(o)) if (v === null || typeof v !== 'object') out[k] = v;
  return out;
}

export function DetailList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="lqd-detail" style={{ margin: 0 }}>
      {items.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function MediaGrid({
  rows,
  card,
  actions,
  onToggle,
  addLabel,
  onAdd,
}: {
  rows: Row[];
  card: NonNullable<ResourceConfig['card']>;
  actions: RowAction[];
  onToggle: (row: Row, field: string, value: boolean) => void;
  addLabel?: string;
  onAdd?: () => void;
}) {
  return (
    <div className="lqd-mediagrid">
      {rows.map((r) => {
        const m = card(r);
        return (
          <div className="lqd-media" key={r.id}>
            <Thumb seed={seedOf(r.id)} src={m.thumb} className="lqd-media-thumb">
              {m.badge && <span className="lqd-media-badge">{m.badge}</span>}
              {m.order != null && <span className="lqd-media-order">#{m.order}</span>}
            </Thumb>
            <div className="lqd-media-body">
              <div>
                <b>{m.title}</b>
                {m.meta && <small>{m.meta}</small>}
              </div>
              <div className="lqd-media-foot">
                {m.toggleField ? <Toggle checked={!!r[m.toggleField]} label="Hiển thị" onChange={(v) => onToggle(r, m.toggleField!, v)} /> : <span />}
                <RowActions row={r} actions={actions} />
              </div>
            </div>
          </div>
        );
      })}
      {onAdd && (
        <button type="button" className="lqd-media-add" onClick={onAdd}>
          <Icon name="plus" />
          {addLabel ?? 'Thêm mới'}
        </button>
      )}
    </div>
  );
}

/** Tag trạng thái dùng chung */
export const statusTag = (map: Record<string, { label: string; tone: 'brand' | 'neutral' | 'success' | 'warning' | 'danger' }>) => (value: string) =>
  map[value] ?? { label: value, tone: 'neutral' as const };

export function LinkButton({ href, icon, children }: { href: string; icon: IconName; children: ReactNode }) {
  return (
    <Link href={href} className="lqd-link-plain">
      <Icon name={icon} />
      {children}
    </Link>
  );
}

export { Tag };
