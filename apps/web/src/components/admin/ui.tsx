'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Breadcrumb, Button, IconButton } from '@/components/ui/basics';
import { Icon, type IconName } from '@/components/ui/icon';
import { uploadFile } from '@/lib/client-api';
import { cx } from '@/lib/cx';
import { formatSize } from '@/lib/format';
import type { UploadResult } from '@/lib/types';

/* ---------- Thông báo nổi ---------- */

type Toast = { id: number; message: string; error?: boolean };
const ToastCtx = createContext<(message: string, error?: boolean) => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);

/* ---------- Hộp thoại xác nhận ---------- */

type ConfirmOptions = { title: string; message?: string; confirmLabel?: string; danger?: boolean };
const ConfirmCtx = createContext<(o: ConfirmOptions) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function AdminProviders({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const toast = useCallback((message: string, error?: boolean) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, error }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), error ? 6000 : 3500);
  }, []);

  const ask = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => setConfirm({ ...o, resolve })), []);
  const close = (v: boolean) => {
    confirm?.resolve(v);
    setConfirm(null);
  };

  return (
    <ToastCtx.Provider value={toast}>
      <ConfirmCtx.Provider value={ask}>
        {children}
        <div className="lqd-toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={cx('lqd-toast', t.error && 'is-error')} role={t.error ? 'alert' : 'status'}>
              <Icon name={t.error ? 'alert' : 'check'} />
              {t.message}
            </div>
          ))}
        </div>
        {confirm && (
          <Modal center onClose={() => close(false)} label={confirm.title}>
            <div className="lqd-dialog">
              <h3>{confirm.title}</h3>
              {confirm.message && <p>{confirm.message}</p>}
              <div className="lqd-row" style={{ justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => close(false)}>
                  Huỷ
                </Button>
                <Button variant={confirm.danger ? 'cta' : 'primary'} onClick={() => close(true)} autoFocus>
                  {confirm.confirmLabel ?? 'Đồng ý'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}

/* ---------- Modal / Drawer ---------- */

export function Modal({ children, onClose, center, label }: { children: ReactNode; onClose: () => void; center?: boolean; label: string }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div className={cx('lqd-modal-backdrop', center && 'is-center')} onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={label}>
      {children}
    </div>
  );
}

export function Drawer({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <Modal onClose={onClose} label={title}>
      <div className="lqd-drawer">
        <div className="lqd-drawer-head">
          <h2>{title}</h2>
          <IconButton icon="x" label="Đóng" onClick={onClose} />
        </div>
        <div className="lqd-drawer-body">{children}</div>
        {footer && <div className="lqd-drawer-foot">{footer}</div>}
      </div>
    </Modal>
  );
}

/* ---------- Bố cục trang quản trị ---------- */

export function AdminHead({ title, description, breadcrumb, actions }: { title: string; description?: string; breadcrumb?: { label: string; href?: string }[]; actions?: ReactNode }) {
  return (
    <div className="lqd-admin-head">
      <div>
        <Breadcrumb items={[{ label: 'Quản trị', href: '/quan-tri' }, ...(breadcrumb ?? [{ label: title }])]} />
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="lqd-row">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, flush, className, children }: { title?: string; action?: ReactNode; flush?: boolean; className?: string; children: ReactNode }) {
  return (
    <section className={cx('lqd-panel', className)}>
      {title && (
        <div className="lqd-panel-head">
          <h3>{title}</h3>
          {action}
        </div>
      )}
      <div className={flush ? undefined : 'lqd-panel-body'}>{children}</div>
    </section>
  );
}

export function StatCard({ icon, label, value, note, noteTone }: { icon: IconName; label: string; value: ReactNode; note?: string; noteTone?: 'up' | 'warn' }) {
  return (
    <div className="lqd-statcard">
      <span className="lqd-statcard-icon">
        <Icon name={icon} />
      </span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        {note && <span className={cx('lqd-statcard-note', noteTone && `is-${noteTone}`)}>{note}</span>}
      </div>
    </div>
  );
}

export function Spinner({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 text-sm text-ink-muted" role="status">
      <span className="lqd-spinner" />
      {label}
    </div>
  );
}

/* ---------- Tải tệp ---------- */

export function UploadField({
  value,
  fileName,
  size,
  accept,
  image,
  hint,
  onUploaded,
  onClear,
}: {
  value?: string | null;
  fileName?: string | null;
  size?: number | null;
  accept?: string;
  image?: boolean;
  hint?: string;
  onUploaded: (r: UploadResult) => void;
  onClear?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const toast = useToast();

  const handle = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      onUploaded(await uploadFile(file));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Tải lên thất bại', true);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const picker = <input ref={input} type="file" accept={accept} hidden onChange={(e) => handle(e.target.files?.[0])} />;

  if (value) {
    return (
      <div className="lqd-filefield">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="lqd-filefield-preview" src={value} alt="" />
        ) : (
          <span className="lqd-doc-icon" style={{ width: 40, height: 48 }}>
            <Icon name="fileText" />
          </span>
        )}
        <div className="lqd-filefield-name">
          <a href={value} target="_blank" rel="noopener" className="text-link hover:underline">
            {fileName || value.split('/').pop()}
          </a>
          <small>{size ? formatSize(size) : value}</small>
        </div>
        <Button variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? 'Đang tải…' : 'Đổi tệp'}
        </Button>
        {onClear && <IconButton icon="x" label="Bỏ tệp" className="is-danger" onClick={onClear} />}
        {picker}
      </div>
    );
  }

  return (
    <div
      className="lqd-upload"
      style={drag ? { borderColor: 'var(--focus-ring)', background: 'var(--accent-soft)' } : { cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files?.[0]);
      }}
    >
      <Icon name="upload" />
      <b>{busy ? 'Đang tải lên…' : 'Kéo thả tệp vào đây hoặc bấm để chọn'}</b>
      <small>{hint ?? (image ? 'PNG, JPG, WEBP tối đa 5 MB' : 'PDF, DOCX, XLSX, PPTX… tối đa 50 MB')}</small>
      {picker}
    </div>
  );
}
