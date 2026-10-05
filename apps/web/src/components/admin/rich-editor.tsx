'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/ui/icon';
import { uploadFile } from '@/lib/client-api';
import { useToast } from './ui';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Trình soạn thảo gọn nhẹ (contentEditable): tiêu đề, in đậm/nghiêng/gạch chân, danh sách, trích dẫn,
 * liên kết, chèn ảnh và tệp (tải lên API). HTML được API làm sạch khi lưu.
 */
export function RichEditor({ value, onChange, placeholder = 'Nhập nội dung bài viết…' }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const saved = useRef<Range | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
    // chỉ nạp nội dung ban đầu; sau đó trình soạn thảo tự quản lý DOM
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => onChange(ref.current?.innerHTML ?? '');

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) saved.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (saved.current && sel) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
  };

  const exec = (cmd: string, arg?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, arg);
    saveSelection();
    emit();
  };

  const insertUpload = async (file: File | undefined, kind: 'image' | 'file') => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await uploadFile(file);
      const html =
        kind === 'image'
          ? `<img src="${esc(r.url)}" alt="${esc(r.fileName.replace(/\.[^.]+$/, ''))}" /><p></p>`
          : `<a href="${esc(r.url)}" target="_blank">${esc(r.fileName)}</a>&nbsp;`;
      exec('insertHTML', html);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Tải lên thất bại', true);
    } finally {
      setBusy(false);
      if (imgInput.current) imgInput.current.value = '';
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const tools: ([IconName | string, string, () => void] | 'sep')[] = [
    ['heading', 'Tiêu đề lớn (H2)', () => exec('formatBlock', '<h2>')],
    ['H3', 'Tiêu đề nhỏ (H3)', () => exec('formatBlock', '<h3>')],
    ['type', 'Đoạn văn thường', () => exec('formatBlock', '<p>')],
    'sep',
    ['bold', 'In đậm', () => exec('bold')],
    ['italic', 'In nghiêng', () => exec('italic')],
    ['underline', 'Gạch chân', () => exec('underline')],
    'sep',
    ['list', 'Danh sách', () => exec('insertUnorderedList')],
    ['listOrdered', 'Danh sách số', () => exec('insertOrderedList')],
    ['quote', 'Trích dẫn', () => exec('formatBlock', '<blockquote>')],
    'sep',
    [
      'link',
      'Chèn liên kết',
      () => {
        const url = window.prompt('Địa chỉ liên kết (https://… hoặc /tin-tuc/…)');
        if (url) exec('createLink', url);
      },
    ],
    ['image', 'Chèn ảnh', () => imgInput.current?.click()],
    ['fileText', 'Đính kèm tệp', () => fileInput.current?.click()],
    'sep',
    ['undo', 'Hoàn tác', () => exec('undo')],
  ];

  return (
    <div className="lqd-rte">
      <div className="lqd-rte-bar" role="toolbar" aria-label="Định dạng" onMouseDown={(e) => e.preventDefault()}>
        {tools.map((t, i) =>
          t === 'sep' ? (
            <span key={i} className="lqd-rte-sep" />
          ) : (
            <button key={i} type="button" title={t[1]} aria-label={t[1]} onClick={t[2]} disabled={busy}>
              {t[0].length <= 2 ? <b style={{ fontSize: 13 }}>{t[0]}</b> : <Icon name={t[0]} />}
            </button>
          ),
        )}
        {busy && <span className="lqd-spinner" style={{ marginLeft: 8 }} aria-label="Đang tải lên" />}
      </div>
      <div
        ref={ref}
        className="lqd-rte-body"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Nội dung"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={() => {
          saveSelection();
          emit();
        }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onPaste={(e) => {
          // Dán dạng chữ thuần để tránh định dạng rác từ Word/web
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
          emit();
        }}
      />
      <input ref={imgInput} type="file" accept="image/*" hidden onChange={(e) => insertUpload(e.target.files?.[0], 'image')} />
      <input ref={fileInput} type="file" hidden onChange={(e) => insertUpload(e.target.files?.[0], 'file')} />
    </div>
  );
}
