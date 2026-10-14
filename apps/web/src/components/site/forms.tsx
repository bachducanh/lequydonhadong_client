'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { Avatar, Button, Field, LOGO_SRC } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { api, ClientApiError, compact } from '@/lib/client-api';
import { formatDate } from '@/lib/format';
import { type Dict, label, type Lang } from '@/lib/i18n';
import { ASKER_ROLES, CLUB_LANGUAGES, QA_TOPICS } from '@/lib/site';
import type { CommentItem } from '@/lib/types';

type Status = { kind: 'idle' } | { kind: 'busy' } | { kind: 'ok'; message: string } | { kind: 'error'; message: string };

/** Thông báo lỗi theo ngôn ngữ: tiếng Việt dùng thông báo chi tiết của API, tiếng Anh dùng câu chung. */
function errorMessage(e: unknown, lang: Lang, t: Dict) {
  if (e instanceof ClientApiError) {
    if (e.status === 429) return t.errors.tooMany;
    if (lang === 'vi') return e.message;
    return e.status === 400 ? t.errors.invalid : t.errors.generic;
  }
  return t.errors.generic;
}

function useSubmit() {
  const { lang, t } = useI18n();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const run = async (fn: () => Promise<unknown>, success: string) => {
    setStatus({ kind: 'busy' });
    try {
      await fn();
      setStatus({ kind: 'ok', message: success });
      return true;
    } catch (e) {
      setStatus({ kind: 'error', message: errorMessage(e, lang, t) });
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
  const { t } = useI18n();
  const c = t.comments;
  const { status, run, busy } = useSubmit();
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = await run(() => api(`/posts/${encodeURIComponent(slug)}/comments`, { method: 'POST', body: compact(values(form)) }), c.success);
    if (ok) form.reset();
  };
  return (
    <div className="lqd-comments" id="phan-hoi">
      <h3>{c.title(items.length)}</h3>
      {allowComments ? (
        <form className="lqd-comment-form" onSubmit={onSubmit}>
          <div className="lqd-form-row">
            <Field label={c.name} required>
              <input className="lqd-input" name="name" placeholder={c.namePlaceholder} required maxLength={80} autoComplete="name" />
            </Field>
            <Field label={c.email}>
              <input className="lqd-input" name="email" type="email" placeholder="email@example.com" autoComplete="email" />
            </Field>
          </div>
          <Field label={c.content} required hint={c.hint}>
            <textarea className="lqd-input" name="content" rows={3} required maxLength={2000} />
          </Field>
          <StatusMessage status={status} />
          <div>
            <Button type="submit" disabled={busy}>
              {busy ? t.common.sending : c.submit}
            </Button>
          </div>
        </form>
      ) : (
        <p className="lqd-field-hint">{c.closed}</p>
      )}
      {items.map((it) => (
        <div className="lqd-comment" key={it.id}>
          <Avatar name={it.name} />
          <div>
            <div className="lqd-comment-head">
              <b>{it.name}</b>
              <span>{formatDate(it.createdAt)}</span>
            </div>
            <p>{it.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Gửi câu hỏi / góp ý ---------- */

export function AskForm() {
  const { lang, t } = useI18n();
  const a = t.ask;
  const [kind, setKind] = useState<'question' | 'feedback'>('question');
  const { status, run, busy } = useSubmit();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const v = values(form);
    const ok =
      kind === 'question'
        ? await run(
            () => api('/questions', { method: 'POST', body: compact({ askerName: v.name, askerRole: v.role, askerEmail: v.email, topic: v.topic, question: v.content }) }),
            a.successQuestion,
          )
        : await run(
            () => api('/feedbacks', { method: 'POST', body: compact({ name: v.name, role: v.role, email: v.email, phone: v.phone, title: v.title, content: v.content }) }),
            a.successFeedback,
          );
    if (ok) form.reset();
  };

  return (
    <form className="lqd-card lqd-formcard" onSubmit={onSubmit} id="gui-cau-hoi">
      <h3>{a.title}</h3>
      <p>{a.desc}</p>
      <div className="lqd-tabs" role="radiogroup" aria-label={a.kind}>
        <button type="button" role="radio" aria-checked={kind === 'question'} aria-selected={kind === 'question'} onClick={() => setKind('question')}>
          {a.question}
        </button>
        <button type="button" role="radio" aria-checked={kind === 'feedback'} aria-selected={kind === 'feedback'} onClick={() => setKind('feedback')}>
          {a.feedback}
        </button>
      </div>
      <div className="lqd-form-row">
        <Field label={a.name} required>
          <input className="lqd-input" name="name" placeholder={t.comments.namePlaceholder} required maxLength={80} autoComplete="name" />
        </Field>
        <Field label={a.role} required>
          <select className="lqd-input" name="role" required defaultValue={ASKER_ROLES[0]}>
            {ASKER_ROLES.map((r) => (
              <option key={r} value={r}>
                {label(lang, 'role', r)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="lqd-form-row">
        <Field label={a.email} required={kind === 'feedback'}>
          <input className="lqd-input" name="email" type="email" placeholder="email@example.com" required={kind === 'feedback'} autoComplete="email" />
        </Field>
        {kind === 'feedback' ? (
          <Field label={a.phone}>
            <input className="lqd-input" name="phone" type="tel" placeholder="09xx xxx xxx" pattern="[0-9 +().\-]{8,20}" autoComplete="tel" />
          </Field>
        ) : (
          <Field label={a.topic} required>
            <select className="lqd-input" name="topic" required defaultValue={QA_TOPICS[0]}>
              {QA_TOPICS.map((tp) => (
                <option key={tp} value={tp}>
                  {label(lang, 'topic', tp)}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
      {kind === 'feedback' && (
        <Field label={a.subject} required>
          <input className="lqd-input" name="title" required maxLength={200} />
        </Field>
      )}
      <Field label={kind === 'question' ? a.questionLabel : a.content} required>
        <textarea className="lqd-input" name="content" rows={4} required maxLength={kind === 'question' ? 2000 : 5000} />
      </Field>
      <StatusMessage status={status} />
      <div>
        <Button variant="cta" type="submit" icon="arrow" disabled={busy}>
          {busy ? t.common.sending : a.submit}
        </Button>
      </div>
    </form>
  );
}

/* ---------- Đăng ký câu lạc bộ ---------- */

export function ClubForm() {
  const { lang, t } = useI18n();
  const c = t.club;
  const { status, run, busy } = useSubmit();
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = await run(() => api('/club-members', { method: 'POST', body: compact(values(form)) }), c.success);
    if (ok) form.reset();
  };
  return (
    <form className="lqd-card lqd-formcard" onSubmit={onSubmit}>
      <h3>{c.formTitle}</h3>
      <p>{c.formDesc}</p>
      <div className="lqd-form-row">
        <Field label={c.fullName} required>
          <input className="lqd-input" name="fullName" required maxLength={80} placeholder={t.comments.namePlaceholder} autoComplete="name" />
        </Field>
        <Field label={c.className} required>
          <input className="lqd-input" name="className" required maxLength={20} placeholder="10A2" />
        </Field>
      </div>
      <div className="lqd-form-row">
        <Field label={c.hobbies}>
          <input className="lqd-input" name="hobbies" maxLength={200} placeholder={c.hobbiesPlaceholder} />
        </Field>
        <Field label={c.language}>
          <select className="lqd-input" name="language" defaultValue={CLUB_LANGUAGES[0]}>
            {CLUB_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {label(lang, 'language', l)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="lqd-form-row">
        <Field label={c.email}>
          <input className="lqd-input" name="email" type="email" placeholder="email@example.com" autoComplete="email" />
        </Field>
        <Field label={c.phone}>
          <input className="lqd-input" name="phone" type="tel" placeholder="09xx xxx xxx" autoComplete="tel" />
        </Field>
      </div>
      <Field label={c.intro}>
        <textarea className="lqd-input" name="introduction" rows={3} maxLength={1000} />
      </Field>
      <StatusMessage status={status} />
      <div>
        <Button variant="cta" type="submit" icon="arrow" disabled={busy}>
          {busy ? t.common.sending : c.submit}
        </Button>
      </div>
    </form>
  );
}

/* ---------- Đăng nhập ---------- */

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { lang, t } = useI18n();
  const l = t.login;
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
      if (res?.status === 429) setError(t.errors.tooMany);
      else if (res?.status === 401) setError(lang === 'vi' ? (data?.message ?? l.wrong) : l.wrong);
      else setError(lang === 'vi' && data?.message ? data.message : l.failed);
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
        <img src={LOGO_SRC} alt={l.logoAlt} width={72} height={72} />
        <h1>{l.title}</h1>
        <p>{l.desc}</p>
        <form className="lqd-stack" onSubmit={onSubmit}>
          <Field label={l.username}>
            <input className="lqd-input" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus />
          </Field>
          <Field label={l.password}>
            <input className="lqd-input" name="password" type="password" autoComplete="current-password" required />
          </Field>
          <div className="lqd-login-row">
            <label className="lqd-check">
              <input type="checkbox" name="remember" defaultChecked />
              {l.remember}
            </label>
            <span className="lqd-field-hint" title={l.forgotHint}>
              {l.forgot}
            </span>
          </div>
          {error && (
            <div className="lqd-alert lqd-alert-error" role="alert">
              <Icon name="alert" />
              {error}
            </div>
          )}
          <Button variant="primary" size="lg" type="submit" className="lqd-btn-block" disabled={busy}>
            {busy ? l.busy : l.submit}
          </Button>
        </form>
        <Link href="/" className="lqd-login-back">
          <Icon name="arrowLeft" />
          {l.back}
        </Link>
      </div>
    </div>
  );
}
