'use client';

import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import { Avatar, IconButton, Pagination, Tag, Toggle } from '@/components/ui/basics';
import { Icon, type IconName } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import { cx } from '@/lib/cx';
import { seedOf } from '@/lib/format';
import type { Tone } from '@/lib/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Row = { id: string; [key: string]: any };

export interface Column {
  key: string;
  label: string;
  type?: 'title' | 'tag' | 'toggle' | 'star' | 'muted' | 'num' | 'clamp' | 'link' | 'drag' | 'custom';
  width?: string;
  align?: 'right';
  get?: (row: Row) => ReactNode;
  sub?: (row: Row) => ReactNode;
  thumb?: (row: Row) => string | null | undefined;
  avatar?: boolean;
  indent?: (row: Row) => number;
  tag?: (row: Row) => { label: string; tone?: Tone } | null;
  href?: (row: Row) => string | null | undefined;
  /** Trường boolean được bật/tắt trực tiếp (toggle, star) */
  field?: string;
}

export interface RowAction {
  key: string;
  icon: IconName;
  label: string;
  tone?: 'danger' | 'ok';
  show?: (row: Row) => boolean;
  href?: (row: Row) => string | null | undefined;
  run?: (row: Row) => void | Promise<void>;
}

export function RowActions({ row, actions }: { row: Row; actions: RowAction[] }) {
  return (
    <div className="lqd-rowactions">
      {actions
        .filter((a) => !a.show || a.show(row))
        .map((a) => {
          const href = a.href?.(row);
          const cls = cx('lqd-iconbtn', a.tone === 'danger' && 'is-danger', a.tone === 'ok' && 'is-ok');
          if (href) {
            const external = href.startsWith('/uploads/') || href.startsWith('http') || (href.startsWith('/') && !href.startsWith('/quan-tri'));
            return external ? (
              <a key={a.key} href={href} target="_blank" rel="noopener" className={cls} aria-label={a.label} title={a.label}>
                <Icon name={a.icon} />
              </a>
            ) : (
              <Link key={a.key} href={href} className={cls} aria-label={a.label} title={a.label}>
                <Icon name={a.icon} />
              </Link>
            );
          }
          return <IconButton key={a.key} icon={a.icon} label={a.label} className={cx(a.tone === 'danger' && 'is-danger', a.tone === 'ok' && 'is-ok')} onClick={() => a.run?.(row)} />;
        })}
    </div>
  );
}

function Cell({ col, row, onToggle }: { col: Column; row: Row; onToggle: (row: Row, field: string, value: boolean) => void }) {
  const value = col.get ? col.get(row) : row[col.key];
  switch (col.type) {
    case 'title': {
      const indent = col.indent?.(row) ?? 0;
      const thumb = col.thumb?.(row);
      return (
        <div className="lqd-cell-title">
          {col.thumb && <Thumb seed={seedOf(row.id)} src={thumb} className="lqd-cell-thumb" />}
          {col.avatar && <Avatar name={String(value ?? '?')} size="sm" />}
          <div>
            <b style={indent ? { paddingLeft: indent * 20 } : undefined}>
              {indent ? '└ ' : ''}
              {value}
            </b>
            {col.sub && <small style={indent ? { paddingLeft: indent * 20 } : undefined}>{col.sub(row)}</small>}
          </div>
        </div>
      );
    }
    case 'tag': {
      const t = col.tag?.(row);
      return t ? (
        <Tag tone={t.tone ?? 'neutral'} noIcon={!t.tone || t.tone === 'neutral' || t.tone === 'brand'}>
          {t.label}
        </Tag>
      ) : (
        <span className="lqd-cell-muted">—</span>
      );
    }
    case 'toggle':
      return <Toggle checked={!!row[col.field ?? col.key]} label={col.label} onChange={(v) => onToggle(row, col.field ?? col.key, v)} />;
    case 'star': {
      const on = !!row[col.field ?? col.key];
      return (
        <button type="button" className={cx('lqd-star', on && 'is-on')} aria-pressed={on} aria-label={on ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'} title={col.label} onClick={() => onToggle(row, col.field ?? col.key, !on)}>
          <Icon name="star" />
        </button>
      );
    }
    case 'muted':
      return <span className="lqd-cell-muted">{value ?? '—'}</span>;
    case 'num':
      return <span className="lqd-cell-num">{value ?? '—'}</span>;
    case 'clamp':
      return <span className="lqd-cell-clamp">{value}</span>;
    case 'link': {
      const href = col.href?.(row);
      return href ? (
        <a href={href} target="_blank" rel="noopener" className="lqd-cell-link">
          {value}
        </a>
      ) : (
        <span className="lqd-cell-muted">{value || '—'}</span>
      );
    }
    case 'drag':
      return (
        <span className="lqd-drag">
          <Icon name="drag" />
          {value}
        </span>
      );
    default:
      return <>{value ?? '—'}</>;
  }
}

export function DataTable({
  columns,
  rows,
  actions,
  onToggle,
  onReorder,
  selectable,
  footer,
  empty,
  rowClass,
  onRowClick,
}: {
  columns: Column[];
  rows: Row[];
  actions?: RowAction[];
  onToggle?: (row: Row, field: string, value: boolean) => void;
  onReorder?: (ids: string[]) => void;
  selectable?: { selected: Set<string>; onChange: (s: Set<string>) => void };
  footer?: { page: number; totalPages: number; total: number; onPage: (p: number) => void };
  empty?: ReactNode;
  rowClass?: (row: Row) => string | undefined;
  onRowClick?: (row: Row) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const allSelected = !!selectable && rows.length > 0 && rows.every((r) => selectable.selected.has(r.id));

  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId || !onReorder) return;
    const ids = rows.map((r) => r.id).filter((id) => id !== dragId);
    ids.splice(ids.indexOf(targetId), 0, dragId);
    onReorder(ids);
  };

  return (
    <div className="lqd-table-wrap">
      <table className="lqd-table">
        <thead>
          <tr>
            {selectable && (
              <th className="lqd-th-check">
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả"
                  checked={allSelected}
                  onChange={() => selectable.onChange(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
                />
              </th>
            )}
            {columns.map((c) => (
              <th key={c.key} style={c.width ? { width: c.width } : undefined} className={c.align === 'right' ? 'is-right' : undefined}>
                {c.label}
              </th>
            ))}
            {actions && <th style={{ width: 1 }} aria-label="Thao tác" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className={cx(rowClass?.(r), dragId === r.id && 'is-dragging', overId === r.id && dragId !== r.id && 'is-drop-target', onRowClick && 'cursor-pointer')}
              draggable={!!onReorder}
              onDragStart={onReorder ? () => setDragId(r.id) : undefined}
              onDragOver={onReorder ? (e) => (e.preventDefault(), setOverId(r.id)) : undefined}
              onDragEnd={onReorder ? () => (setDragId(null), setOverId(null)) : undefined}
              onDrop={onReorder ? () => (drop(r.id), setDragId(null), setOverId(null)) : undefined}
              onClick={onRowClick ? (e) => !(e.target as HTMLElement).closest('button,a,input') && onRowClick(r) : undefined}
            >
              {selectable && (
                <td className="lqd-th-check">
                  <input
                    type="checkbox"
                    aria-label="Chọn dòng"
                    checked={selectable.selected.has(r.id)}
                    onChange={() => {
                      const s = new Set(selectable.selected);
                      if (s.has(r.id)) s.delete(r.id);
                      else s.add(r.id);
                      selectable.onChange(s);
                    }}
                  />
                </td>
              )}
              {columns.map((c) => (
                <td key={c.key} className={c.align === 'right' ? 'is-right' : undefined}>
                  <Cell col={c} row={r} onToggle={onToggle ?? (() => undefined)} />
                </td>
              ))}
              {actions && (
                <td>
                  <RowActions row={r} actions={actions} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && empty}
      {footer && rows.length > 0 && (
        <div className="lqd-table-foot">
          <span>
            Hiển thị {(footer.page - 1) * 20 + 1}–{(footer.page - 1) * 20 + rows.length} trên {footer.total}
          </span>
          <Pagination page={footer.page} total={footer.totalPages} onChange={footer.onPage} />
        </div>
      )}
    </div>
  );
}
