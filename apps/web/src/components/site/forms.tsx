'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Avatar, Button, Field, LOGO_SRC } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { api, compact } from '@/lib/client-api';
import { formatDate } from '@/lib/format';
import { ASKER_ROLES, CLUB_LANGUAGES, QA_TOPICS } from '@/lib/site';
import type { CommentItem } from '@/lib/types';
import Link from 'next/link';

type Status = { kind: 'idle' } | { kind: 'busy' } | { kind: 'ok'; message: string } | { kind: 'error'; message: string };

function useSubmit() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const run = async (fn: () => Promise<string | undefined>) => {
    setStatus({ kind: 'busy' });
    try {
      const message = await fn();
      setStatus({ kind: 'ok', message: message ?? 'Đã gửi thành công.' });
      return true;
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : 'Đã có lỗi xảy ra' });
      return false;
    }
  };
  return { status, run, busy: status.kind === 'busy' };
}

function StatusMessage({ status }: { status: Status }) {
  if (status.kind === 'ok')
    return (
      <div className="lqd-alert lqd-alert-success" role="status">
        <Icon name="check" />
        {status.message}
      </div>
    );
  if (status.kind === 'error')
    return (
      <div className="lqd-alert lqd-alert-error" role="alert">
        <Icon name="alert" />
        {status.message}
      </div>
    );
  return null;
}

const values = (form: HTMLFormElement) => Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

/* ---------- Phản hồi bài viết ---------- */

export function CommentSection({ slug, items, allowComments }: { slug: string; items: CommentItem[]; allowComments: boolean }) {
  const { status, run, busy } = useSubmit();
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = await run(async () => {
      const res = await api<{ message: string }>(`/posts/${encodeURIComponent(slug)}/comments`, { method: 'POST', body: compact(values(form)) });
      return res.message;
    });
    if (ok) form.reset();
  };
  return (
    <div className="lqd-comments" id="phan-hoi">
      <h3>Phản hồi ({items.length})</h3>
      {allowComments ? (
        <form className="lqd-comment-form" onSubmit={onSubmit}>
          <div className="lqd-form-row">
            <Field label="Họ tên" required>
              <input className="lqd-input" name="name" placeholder="Nguyễn Văn A" required maxLength={80} />
            </Field>
            <Field label="Email">
              <input className="lqd-input" name="email" type="email" placeholder="email@example.com" />
            </Field>
          </div>
          <Field label="Nội dung phản hồi" required hint="Phản hồi được hiển thị sau khi nhà trường duyệt.">
            <textarea className="lqd-input" name="content" rows={3} required maxLength={2000} />
          </Field>
          <StatusMessage status={status} />
          <div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Đang gửi…' : 'Gửi phản hồi'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="lqd-field-hint">Bài viết này không nhận phản hồi.</p>
      )}
      {items.map((c) => (
        <div className="lqd-comment" key={c.id}>
          <Avatar name={c.name} />
          <div>
            <div className="lqd-comment-head">
              <b>{c.name}</b>
              <span>{formatDate(c.createdAt)}</span>
            </div>
            <p>{c.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Gửi câu hỏi / góp ý ---------- */

export function AskForm({ title = 'Gửi câu hỏi hoặc góp ý', description = 'Mọi góp ý được Ban giám hiệu tiếp nhận và phản hồi trong 5 ngày làm việc.' }: { title?: string; description?: string }) {
  const [kind, setKind] = useState<'question' | 'feedback'>('question');
  const { status, run, busy } = useSubmit();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const v = values(form);
    const ok = await run(async () => {
      if (kind === 'question') {
        const res = await api<{ message: string }>('/questions', {
          method: 'POST',
          body: compact({ askerName: v.name, askerRole: v.role, askerEmail: v.email, topic: v.topic, question: v.content }),
        });
        return res.message;
      }
      const res = await api<{ message: string }>('/feedbacks', {
        method: 'POST',
        body: compact({ name: v.name, role: v.role, email: v.email, phone: v.phone, title: v.title, content: v.content }),
      });
      return res.message;
    });
    if (ok) form.reset();
  };

  return (
    <form className="lqd-card lqd-formcard" onSubmit={onSubmit} id="gui-cau-hoi">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="lqd-tabs" role="radiogroup" aria-label="Loại">
        <button type="button" role="radio" aria-checked={kind === 'question'} aria-selected={kind === 'question'} onClick={() => setKind('question')}>
          Đặt câu hỏi
        </button>
        <button type="button" role="radio" aria-checked={kind === 'feedback'} aria-selected={kind === 'feedback'} onClick={() => setKind('feedback')}>
          Góp ý
        </button>
      </div>
      <div className="lqd-form-row">
        <Field label="Họ tên" required>
          <input className="lqd-input" name="name" placeholder="Nguyễn Văn A" required maxLength={80} />
        </Field>
        <Field label="Bạn là" required>
          <select className="lqd-input" name="role" required defaultValue={ASKER_ROLES[0]}>
            {ASKER_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="lqd-form-row">
        <Field label="Email" required={kind === 'feedback'}>
          <input className="lqd-input" name="email" type="email" placeholder="email@example.com" required={kind === 'feedback'} />
        </Field>
        {kind === 'feedback' ? (
          <Field label="Điện thoại">
            <input className="lqd-input" name="phone" placeholder="09xx xxx xxx" pattern="[0-9 +().\-]{8,20}" />
          </Field>
        ) : (
          <Field label="Chủ đề" required>
            <select className="lqd-input" name="topic" required defaultValue={QA_TOPICS[0]}>
              {QA_TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        )}
      </div>
      {kind === 'feedback' && (
        <Field label="Tiêu đề" required>
          <input className="lqd-input" name="title" required maxLength={200} />
        </Field>
      )}
      <Field label={kind === 'question' ? 'Câu hỏi' : 'Nội dung'} required>
        <textarea className="lqd-input" name="content" rows={4} required maxLength={kind === 'question' ? 2000 : 5000} />
      </Field>
      <StatusMessage status={status} />
      <div>
        <Button variant="cta" type="submit" icon="arrow" disabled={busy}>
          {busy ? 'Đang gửi…' : 'Gửi'}
        </Button>
      </div>
    </form>
  );
}

/* ---------- Đăng ký câu lạc bộ ---------- */

export function ClubForm() {
  const { status, run, busy } = useSubmit();
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = await run(async () => (await api<{ message: string }>('/club-members', { method: 'POST', body: compact(values(form)) })).message);
    if (ok) form.reset();
  };
  return (
    <form className="lqd-card lqd-formcard" onSubmit={onSubmit}>
      <h3>Đăng ký tham gia</h3>
      <p>Ban chủ nhiệm câu lạc bộ duyệt đăng ký và liên hệ với bạn qua giáo viên chủ nhiệm.</p>
      <div className="lqd-form-row">
        <Field label="Họ tên" required>
          <input className="lqd-input" name="fullName" required maxLength={80} placeholder="Nguyễn Văn A" />
        </Field>
        <Field label="Lớp" required>
          <input className="lqd-input" name="className" required maxLength={20} placeholder="10A2" />
        </Field>
      </div>
      <div className="lqd-form-row">
        <Field label="Sở thích">
          <input className="lqd-input" name="hobbies" maxLength={200} placeholder="Đọc sách, cầu lông" />
        </Field>
        <Field label="Ngôn ngữ giao lưu">
          <select className="lqd-input" name="language" defaultValue={CLUB_LANGUAGES[0]}>
            {CLUB_LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="lqd-form-row">
        <Field label="Email">
          <input className="lqd-input" name="email" type="email" placeholder="email@example.com" />
        </Field>
        <Field label="Điện thoại">
          <input className="lqd-input" name="phone" placeholder="09xx xxx xxx" />
        </Field>
      </div>
      <Field label="Giới thiệu bản thân">
        <textarea className="lqd-input" name="introduction" rows={3} maxLength={1000} />
      </Field>
      <StatusMessage status={status} />
      <div>
        <Button variant="cta" type="submit" icon="arrow" disabled={busy}>
          {busy ? 'Đang gửi…' : 'Đăng ký'}
        </Button>
      </div>
    </form>
  );
}

/* ---------- Đăng nhập ---------- */

export function LoginForm({ footer }: { footer?: ReactNode }) {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: v.get('username'), password: v.get('password'), remember: v.get('remember') === 'on' }),
    }).catch(() => null);
    if (!res?.ok) {
      const data = (await res?.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? 'Không đăng nhập được, vui lòng thử lại');
      setBusy(false);
      return;
    }
    const next = search.get('next');
    router.replace(next && next.startsWith('/quan-tri') ? next : '/quan-tri');
    router.refresh();
  };

  return (
    <div className="lqd-login">
      <div className="lqd-login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SRC} alt="Logo Trường THPT Lê Quý Đôn – Hà Đông" width={72} height={72} />
        <h1>Đăng nhập</h1>
        <p>Dành cho cán bộ, giáo viên quản trị nội dung website.</p>
        <form className="lqd-stack" onSubmit={onSubmit}>
          <Field label="Tên đăng nhập hoặc email">
            <input className="lqd-input" name="username" autoComplete="username" required autoFocus />
          </Field>
          <Field label="Mật khẩu">
            <input className="lqd-input" name="password" type="password" autoComplete="current-password" required />
          </Field>
          <div className="lqd-login-row">
            <label className="lqd-check">
              <input type="checkbox" name="remember" defaultChecked />
              Ghi nhớ đăng nhập
            </label>
            <span className="lqd-field-hint" title="Liên hệ quản trị viên nhà trường để đặt lại mật khẩu">
              Quên mật khẩu?
            </span>
          </div>
          {error && (
            <div className="lqd-alert lqd-alert-error" role="alert">
              <Icon name="alert" />
              {error}
            </div>
          )}
          <Button variant="primary" size="lg" type="submit" className="lqd-btn-block" disabled={busy}>
            {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </form>
        <Link href="/" className="lqd-login-back">
          <Icon name="arrowLeft" />
          Về trang chủ
        </Link>
        {footer}
      </div>
    </div>
  );
}
