'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Button, Field, Toggle } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { api } from '@/lib/client-api';
import { fromLocalInput, toDateTimeInput } from '@/lib/format';
import type { PostStatus } from '@/lib/types';
import { useAdmin } from './admin-shell';
import { RichEditor } from './rich-editor';
import { AdminHead, Drawer, Panel, Spinner, UploadField, useToast } from './ui';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Category = { id: string; name: string; slug: string; depth: number };

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  imageCaption: string;
  categoryId: string;
  authorName: string;
  status: PostStatus;
  publishedAt: string;
  featured: boolean;
  allowComments: boolean;
  pushToTicker: boolean;
  badge: string;
  badgeTone: string;
}

const EMPTY: PostForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  thumbnail: '',
  imageCaption: '',
  categoryId: '',
  authorName: '',
  status: 'DRAFT',
  publishedAt: '',
  featured: false,
  allowComments: true,
  pushToTicker: false,
  badge: '',
  badgeTone: '',
};

const TONES = [
  { value: '', label: 'Mặc định' },
  { value: 'DANGER', label: 'Khẩn (đỏ)' },
  { value: 'WARNING', label: 'Hạn chót (cam)' },
  { value: 'SUCCESS', label: 'Đã công bố (xanh lá)' },
  { value: 'BRAND', label: 'Thương hiệu (xanh)' },
];

/** Soạn tin bài: tiêu đề, đường dẫn, sapo, nội dung; cột phải Xuất bản, Chuyên mục, Nhãn, Ảnh đại diện. */
export function PostEditor({ id }: { id?: string }) {
  const router = useRouter();
  const toast = useToast();
  const { user, refreshBadges } = useAdmin();
  const isNew = !id;
  const [form, setForm] = useState<PostForm | null>(isNew ? EMPTY : null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const teacher = user?.role === 'TEACHER';

  useEffect(() => {
    api<{ data: Category[] }>('/admin/categories').then((r) => setCategories(r.data)).catch(() => undefined);
    if (!id) return;
    api<any>(`/admin/posts/${id}`)
      .then((p) => {
        setForm({
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt ?? '',
          content: p.content ?? '',
          thumbnail: p.thumbnail ?? '',
          imageCaption: p.imageCaption ?? '',
          categoryId: p.categoryId ?? '',
          authorName: p.authorName ?? '',
          status: p.status,
          publishedAt: toDateTimeInput(p.publishedAt),
          featured: p.featured,
          allowComments: p.allowComments,
          pushToTicker: false,
          badge: p.badge ?? '',
          badgeTone: p.badgeTone ?? '',
        });
        setPublicSlug(p.status === 'PUBLISHED' ? p.slug : null);
      })
      .catch((e) => {
        toast(e instanceof Error ? e.message : 'Không tải được bài viết', true);
        router.replace('/quan-tri/tin-bai');
      });
  }, [id, router, toast]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof PostForm>(key: K, value: PostForm[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setDirty(true);
  };

  const statusOptions = useMemo(
    () => [
      { value: 'DRAFT', label: 'Nháp' },
      { value: 'PENDING', label: 'Chờ duyệt' },
      ...(teacher ? [] : [{ value: 'PUBLISHED', label: 'Đã đăng' }]),
    ],
    [teacher],
  );

  if (!form) return <Spinner />;

  const save = async (status?: PostStatus) => {
    if (!form.title.trim()) return toast('Vui lòng nhập tiêu đề', true);
    setBusy(true);
    const body = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      thumbnail: form.thumbnail || null,
      imageCaption: form.imageCaption.trim() || null,
      categoryId: form.categoryId || null,
      authorName: form.authorName.trim() || null,
      status: status ?? form.status,
      publishedAt: fromLocalInput(form.publishedAt),
      featured: form.featured,
      allowComments: form.allowComments,
      pushToTicker: form.pushToTicker,
      badge: form.badge.trim() || null,
      badgeTone: form.badgeTone || null,
    };
    try {
      const saved = await api<any>(isNew ? '/admin/posts' : `/admin/posts/${id}`, { method: isNew ? 'POST' : 'PATCH', body });
      setDirty(false);
      refreshBadges();
      const label = saved.status === 'PUBLISHED' ? 'Đã đăng bài' : saved.status === 'PENDING' ? 'Đã gửi bài chờ duyệt' : 'Đã lưu nháp';
      toast(label);
      setForm((f) => (f ? { ...f, slug: saved.slug, status: saved.status, publishedAt: toDateTimeInput(saved.publishedAt), pushToTicker: false } : f));
      setPublicSlug(saved.status === 'PUBLISHED' ? saved.slug : null);
      if (isNew) router.replace(`/quan-tri/tin-bai/${saved.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không lưu được bài viết', true);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save();
  };

  return (
    <>
      <AdminHead
        title={isNew ? 'Viết bài mới' : 'Sửa bài viết'}
        breadcrumb={[{ label: 'Quản lý tin bài', href: '/quan-tri/tin-bai' }, { label: isNew ? 'Viết bài mới' : 'Sửa bài viết' }]}
        actions={
          <>
            {publicSlug ? (
              <Button variant="secondary" iconLeft="external" href={`/tin-tuc/${publicSlug}`} newTab>
                Xem trên website
              </Button>
            ) : (
              <Button variant="secondary" iconLeft="eye" onClick={() => setPreview(true)}>
                Xem trước
              </Button>
            )}
            <Button variant="secondary" onClick={() => save('DRAFT')} disabled={busy}>
              Lưu nháp
            </Button>
            <Button iconLeft="check" onClick={() => save(teacher ? 'PENDING' : 'PUBLISHED')} disabled={busy}>
              {busy ? 'Đang lưu…' : teacher ? 'Gửi duyệt' : form.status === 'PUBLISHED' ? 'Cập nhật' : 'Đăng bài'}
            </Button>
          </>
        }
      />
      <form className="lqd-editor" onSubmit={onSubmit}>
        <div className="lqd-stack">
          <Panel>
            <div className="lqd-stack">
              <Field label="Tiêu đề" required>
                <input className="lqd-input lqd-input-lg" value={form.title} onChange={(e) => set('title', e.target.value)} required maxLength={300} placeholder="Tiêu đề bài viết" />
              </Field>
              <Field label="Đường dẫn" hint="Để trống để tạo tự động từ tiêu đề">
                <div className="lqd-input-group">
                  <span>/tin-tuc/</span>
                  <input className="lqd-input" value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="ngay-hoi-stem" />
                </div>
              </Field>
              <Field label="Tóm tắt (sapo)" hint="1–2 câu, hiển thị trên thẻ tin và kết quả tìm kiếm.">
                <textarea className="lqd-input" rows={2} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} maxLength={600} />
              </Field>
              <div className="lqd-field">
                <span className="lqd-field-label">Nội dung</span>
                <RichEditor value={form.content} onChange={(html) => set('content', html)} />
              </div>
            </div>
          </Panel>
        </div>
        <div className="lqd-stack">
          <Panel title="Xuất bản">
            <div className="lqd-stack">
              <Field label="Trạng thái">
                <select className="lqd-input" value={form.status} onChange={(e) => set('status', e.target.value as PostStatus)}>
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                  {teacher && form.status === 'PUBLISHED' && <option value="PUBLISHED">Đã đăng</option>}
                </select>
              </Field>
              <Field label="Ngày đăng" hint="Để trống: lấy thời điểm đăng bài">
                <input className="lqd-input" type="datetime-local" value={form.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} />
              </Field>
              <div className="lqd-switchrow">
                <span>Tin nổi bật</span>
                <Toggle checked={form.featured} label="Tin nổi bật" onChange={(v) => set('featured', v)} />
              </div>
              <div className="lqd-switchrow">
                <span>Cho phép phản hồi</span>
                <Toggle checked={form.allowComments} label="Cho phép phản hồi" onChange={(v) => set('allowComments', v)} />
              </div>
              <div className="lqd-switchrow">
                <span>Đưa lên chữ chạy</span>
                <Toggle checked={form.pushToTicker} label="Đưa lên chữ chạy" onChange={(v) => set('pushToTicker', v)} />
              </div>
            </div>
          </Panel>
          <Panel title="Chuyên mục">
            <div className="lqd-checklist">
              {categories.map((c) => (
                <label key={c.id} className="lqd-check" style={{ paddingLeft: c.depth * 18 }}>
                  <input type="radio" name="categoryId" checked={form.categoryId === c.id} onChange={() => set('categoryId', c.id)} />
                  {c.name}
                </label>
              ))}
              <label className="lqd-check">
                <input type="radio" name="categoryId" checked={!form.categoryId} onChange={() => set('categoryId', '')} />
                Không thuộc chuyên mục
              </label>
            </div>
          </Panel>
          <Panel title="Ảnh đại diện">
            <div className="lqd-stack">
              <UploadField
                value={form.thumbnail || null}
                image
                hint="16:9, tối thiểu 1200×675, tối đa 5 MB"
                onUploaded={(r) => set('thumbnail', r.url)}
                onClear={() => set('thumbnail', '')}
              />
              <Field label="Chú thích ảnh">
                <input className="lqd-input" value={form.imageCaption} onChange={(e) => set('imageCaption', e.target.value)} />
              </Field>
            </div>
          </Panel>
          <Panel title="Hiển thị">
            <div className="lqd-stack">
              <Field label="Người / đơn vị đăng" hint="Vd: Đoàn trường, Phòng Giáo vụ">
                <input className="lqd-input" value={form.authorName} onChange={(e) => set('authorName', e.target.value)} placeholder={user?.fullName} />
              </Field>
              <Field label="Nhãn thông báo" hint="Hiện ở danh sách thông báo, vd: Khẩn, Hạn chót">
                <input className="lqd-input" value={form.badge} onChange={(e) => set('badge', e.target.value)} maxLength={40} />
              </Field>
              <Field label="Màu nhãn">
                <select className="lqd-input" value={form.badgeTone} onChange={(e) => set('badgeTone', e.target.value)}>
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Panel>
        </div>
      </form>
      {preview && (
        <Drawer title="Xem trước bài viết" onClose={() => setPreview(false)}>
          <article className="lqd-stack">
            <h1 style={{ fontSize: 28, lineHeight: '36px', margin: 0 }}>{form.title || 'Chưa có tiêu đề'}</h1>
            {form.excerpt && <p className="lqd-article-lead" style={{ margin: 0 }}>{form.excerpt}</p>}
            {form.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.thumbnail} alt="" style={{ borderRadius: 16 }} />
            )}
            <div className="lqd-prose" dangerouslySetInnerHTML={{ __html: form.content || '<p><i>Chưa có nội dung</i></p>' }} />
            <p className="lqd-field-hint flex items-center gap-1">
              <Icon name="alert" size={14} /> Bản xem trước; nội dung được làm sạch khi lưu.
            </p>
          </article>
        </Drawer>
      )}
    </>
  );
}
