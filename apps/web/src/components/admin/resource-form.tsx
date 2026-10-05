'use client';

import { type FormEvent, type ReactNode, useState } from 'react';
import { Button, Field, Toggle } from '@/components/ui/basics';
import { ICON_NAMES, Icon } from '@/components/ui/icon';
import { cx } from '@/lib/cx';
import { fromLocalInput, toDateInput, toDateTimeInput } from '@/lib/format';
import type { UploadResult } from '@/lib/types';
import { Drawer, UploadField } from './ui';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Values = Record<string, any>;
export type Option = { value: string; label: string };

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'toggle' | 'date' | 'datetime' | 'number' | 'password' | 'email' | 'file' | 'image' | 'icon';
  required?: boolean | ((mode: 'create' | 'edit') => boolean);
  hint?: string;
  placeholder?: string;
  options?: Option[];
  /** Ô rộng nửa hàng (xếp 2 cột) */
  half?: boolean;
  rows?: number;
  /** Với file/image: tên trường lưu tên tệp, dung lượng, kiểu tệp */
  fileName?: string;
  fileSize?: string;
  mimeType?: string;
  accept?: string;
  /** Gán thêm giá trị khi tải tệp xong (vd ảnh -> thumbnail) */
  onUpload?: (r: UploadResult, values: Values) => Values;
  showIf?: (values: Values) => boolean;
  /** Trường chỉ đọc khi sửa */
  createOnly?: boolean;
  /** Danh sách gợi ý cho ô text */
  suggestions?: string[];
}

/** Chuyển giá trị từ bản ghi API sang giá trị ô nhập. */
export function toFormValues(fields: FieldDef[], row: Values | null): Values {
  const v: Values = {};
  for (const f of fields) {
    const raw = row?.[f.name];
    if (f.type === 'toggle') v[f.name] = raw ?? (f.name === 'visible' || f.name === 'showInMenu' || f.name === 'openNewTab' ? true : false);
    else if (f.type === 'date') v[f.name] = toDateInput(raw);
    else if (f.type === 'datetime') v[f.name] = toDateTimeInput(raw);
    else if (f.type === 'password') v[f.name] = '';
    else if (f.type === 'number') v[f.name] = raw ?? '';
    else v[f.name] = raw ?? (f.type === 'select' && f.options?.length && f.required ? f.options[0].value : '');
    if (f.fileName) v[f.fileName] = row?.[f.fileName] ?? null;
    if (f.fileSize) v[f.fileSize] = row?.[f.fileSize] ?? null;
    if (f.mimeType) v[f.mimeType] = row?.[f.mimeType] ?? null;
  }
  return v;
}

/** Chuyển giá trị ô nhập sang payload gửi API (chuỗi rỗng -> null, bỏ số rỗng, bỏ mật khẩu rỗng). */
export function toPayload(fields: FieldDef[], values: Values, mode: 'create' | 'edit'): Values {
  const out: Values = {};
  for (const f of fields) {
    if (f.showIf && !f.showIf(values)) continue;
    if (f.createOnly && mode === 'edit') continue;
    const v = values[f.name];
    if (f.type === 'toggle') out[f.name] = !!v;
    else if (f.type === 'number') {
      if (v !== '' && v !== null && v !== undefined) out[f.name] = Number(v);
    } else if (f.type === 'password') {
      if (v) out[f.name] = v;
    } else if (f.type === 'date' || f.type === 'datetime') out[f.name] = fromLocalInput(v);
    else if (f.required === true && typeof v === 'string') out[f.name] = v.trim();
    else out[f.name] = typeof v === 'string' ? v.trim() || null : (v ?? null);
    if (f.fileName) out[f.fileName] = values[f.fileName] ?? null;
    if (f.fileSize) out[f.fileSize] = values[f.fileSize] ?? null;
    if (f.mimeType) out[f.mimeType] = values[f.mimeType] ?? null;
  }
  return out;
}

export function FormFields({ fields, values, setValues, mode }: { fields: FieldDef[]; values: Values; setValues: (fn: (v: Values) => Values) => void; mode: 'create' | 'edit' }) {
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }));
  const visible = fields.filter((f) => (!f.showIf || f.showIf(values)) && !(f.createOnly && mode === 'edit'));
  const rows: FieldDef[][] = [];
  for (const f of visible) {
    const last = rows[rows.length - 1];
    if (f.half && last && last.length === 1 && last[0].half) last.push(f);
    else rows.push([f]);
  }
  return (
    <>
      {rows.map((row, i) => (
        <div key={i} className={cx(row.length > 1 && 'lqd-form-row')}>
          {row.map((f) => (
            <FieldInput key={f.name} field={f} values={values} set={set} setValues={setValues} mode={mode} />
          ))}
        </div>
      ))}
    </>
  );
}

function FieldInput({ field: f, values, set, setValues, mode }: { field: FieldDef; values: Values; set: (n: string, v: unknown) => void; setValues: (fn: (v: Values) => Values) => void; mode: 'create' | 'edit' }) {
  const required = typeof f.required === 'function' ? f.required(mode) : !!f.required;
  const value = values[f.name];
  let input: ReactNode;
  switch (f.type) {
    case 'textarea':
      input = <textarea className="lqd-input" rows={f.rows ?? 3} value={value ?? ''} required={required} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />;
      break;
    case 'select':
      input = (
        <select className="lqd-input" value={value ?? ''} required={required} onChange={(e) => set(f.name, e.target.value)}>
          {!required && <option value="">— Không chọn —</option>}
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'toggle':
      return (
        <div className="lqd-switchrow" style={{ flex: 1 }}>
          <span>
            {f.label}
            {f.hint && <small className="lqd-field-hint block">{f.hint}</small>}
          </span>
          <Toggle checked={!!value} label={f.label} onChange={(v) => set(f.name, v)} />
        </div>
      );
    case 'date':
    case 'datetime':
      input = <input className="lqd-input" type={f.type === 'date' ? 'date' : 'datetime-local'} value={value ?? ''} required={required} onChange={(e) => set(f.name, e.target.value)} />;
      break;
    case 'number':
      input = <input className="lqd-input" type="number" value={value ?? ''} required={required} onChange={(e) => set(f.name, e.target.value)} />;
      break;
    case 'icon':
      input = (
        <div className="flex items-center gap-2">
          <span className="lqd-quick-icon" style={{ width: 40, height: 40 }}>
            <Icon name={value || 'link'} />
          </span>
          <select className="lqd-input" value={value ?? ''} onChange={(e) => set(f.name, e.target.value)}>
            <option value="">— Mặc định —</option>
            {ICON_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      );
      break;
    case 'file':
    case 'image':
      input = (
        <UploadField
          value={value || null}
          fileName={f.fileName ? values[f.fileName] : undefined}
          size={f.fileSize ? values[f.fileSize] : undefined}
          image={f.type === 'image'}
          accept={f.accept ?? (f.type === 'image' ? 'image/*' : undefined)}
          hint={f.hint}
          onUploaded={(r) =>
            setValues((v) => {
              let next: Values = { ...v, [f.name]: r.url };
              if (f.fileName) next[f.fileName] = r.fileName;
              if (f.fileSize) next[f.fileSize] = r.size;
              if (f.mimeType) next[f.mimeType] = r.mimeType;
              if (f.onUpload) next = f.onUpload(r, next);
              return next;
            })
          }
          onClear={() =>
            setValues((v) => ({
              ...v,
              [f.name]: '',
              ...(f.fileName ? { [f.fileName]: null } : {}),
              ...(f.fileSize ? { [f.fileSize]: null } : {}),
              ...(f.mimeType ? { [f.mimeType]: null } : {}),
            }))
          }
        />
      );
      return (
        <div className="lqd-field">
          <span className="lqd-field-label">
            {f.label}
            {required && <i aria-hidden="true"> *</i>}
          </span>
          {input}
        </div>
      );
    default: {
      const listId = f.suggestions ? `dl-${f.name}` : undefined;
      input = (
        <>
          <input
            className="lqd-input"
            type={f.type === 'password' ? 'password' : f.type === 'email' ? 'email' : 'text'}
            value={value ?? ''}
            required={required}
            placeholder={f.placeholder}
            list={listId}
            minLength={f.type === 'password' && value ? 8 : undefined}
            autoComplete={f.type === 'password' ? 'new-password' : undefined}
            onChange={(e) => set(f.name, e.target.value)}
          />
          {f.suggestions && (
            <datalist id={listId}>
              {f.suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
        </>
      );
    }
  }
  return (
    <Field label={f.label} required={required} hint={f.hint}>
      {input}
    </Field>
  );
}

export function ResourceFormDrawer({
  title,
  fields,
  initial,
  mode,
  onClose,
  onSubmit,
  header,
  submitLabel,
}: {
  title: string;
  fields: FieldDef[];
  initial: Values;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (payload: Values) => Promise<void>;
  header?: ReactNode;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Values>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = 'resource-form';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const missing = fields.find((f) => (f.type === 'file' || f.type === 'image') && (typeof f.required === 'function' ? f.required(mode) : f.required) && !values[f.name]);
    if (missing) return setError(`Vui lòng tải lên ${missing.label.toLowerCase()}`);
    setBusy(true);
    setError(null);
    try {
      await onSubmit(toPayload(fields, values, mode));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" form={formId} disabled={busy} iconLeft="check">
            {busy ? 'Đang lưu…' : (submitLabel ?? (mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'))}
          </Button>
        </>
      }
    >
      {header}
      <form id={formId} className="lqd-stack" onSubmit={submit} noValidate={false}>
        <FormFields fields={fields} values={values} setValues={setValues} mode={mode} />
        {error && (
          <div className="lqd-alert lqd-alert-error" role="alert">
            <Icon name="alert" />
            {error}
          </div>
        )}
      </form>
    </Drawer>
  );
}
