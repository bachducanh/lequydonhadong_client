'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, IconButton } from '@/components/ui/basics';
import { Icon } from '@/components/ui/icon';
import { api, uploadFile } from '@/lib/client-api';
import { formatDate } from '@/lib/format';
import type { AlbumDetail } from '@/lib/types';
import { AdminHead, Spinner, useConfirm, useToast } from './ui';

/** Quản lý ảnh trong album: tải nhiều ảnh, sửa chú thích, đặt làm ảnh bìa, xoá. */
export function AlbumPhotos({ id }: { id: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const input = useRef<HTMLInputElement>(null);
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const load = useCallback(() => {
    api<AlbumDetail>(`/admin/albums/${id}`)
      .then(setAlbum)
      .catch((e) => toast(e instanceof Error ? e.message : 'Không tải được album', true));
  }, [id, toast]);

  useEffect(load, [load]);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setProgress({ done: 0, total: list.length });
    const photos: { url: string; caption: string }[] = [];
    for (const f of list) {
      try {
        const r = await uploadFile(f);
        photos.push({ url: r.url, caption: f.name.replace(/\.[^.]+$/, '') });
      } catch (e) {
        toast(`${f.name}: ${e instanceof Error ? e.message : 'lỗi tải lên'}`, true);
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }
    if (photos.length) {
      const updated = await api<AlbumDetail>(`/admin/albums/${id}/photos`, { method: 'POST', body: { photos } });
      setAlbum(updated);
      toast(`Đã thêm ${photos.length} ảnh`);
    }
    setProgress(null);
    if (input.current) input.current.value = '';
  };

  const setCaption = async (photoId: string, caption: string) => {
    await api(`/admin/albums/${id}/photos/${photoId}`, { method: 'PATCH', body: { caption: caption || null } }).catch((e) => toast(e.message, true));
  };

  const setCover = async (url: string) => {
    await api(`/admin/albums/${id}`, { method: 'PATCH', body: { coverUrl: url } });
    setAlbum((a) => (a ? { ...a, coverUrl: url } : a));
    toast('Đã đặt làm ảnh bìa');
  };

  const remove = async (photoId: string) => {
    if (!(await confirm({ title: 'Xoá ảnh này?', confirmLabel: 'Xoá', danger: true }))) return;
    await api(`/admin/albums/${id}/photos/${photoId}`, { method: 'DELETE' });
    setAlbum((a) => (a ? { ...a, photos: a.photos.filter((p) => p.id !== photoId) } : a));
    toast('Đã xoá ảnh');
  };

  if (!album) return <Spinner />;

  return (
    <>
      <AdminHead
        title={album.title}
        description={`${album.photos.length} ảnh · ${formatDate(album.eventDate)}${album.schoolYear ? ` · Năm học ${album.schoolYear}` : ''}`}
        breadcrumb={[{ label: 'Albums', href: '/quan-tri/albums' }, { label: album.title }]}
        actions={
          <>
            <Button variant="secondary" iconLeft="external" href={`/thu-vien/album/${album.id}`} newTab>
              Xem trên website
            </Button>
            <Button iconLeft="upload" onClick={() => input.current?.click()} disabled={!!progress}>
              {progress ? `Đang tải ${progress.done}/${progress.total}…` : 'Tải ảnh lên'}
            </Button>
          </>
        }
      />
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
      <div
        className="lqd-upload"
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
      >
        <Icon name="images" />
        <b>Kéo thả nhiều ảnh vào đây hoặc bấm để chọn</b>
        <small>JPG, PNG, WEBP — mỗi ảnh tối đa 50 MB</small>
      </div>
      <div className="lqd-mediagrid">
        {album.photos.map((p) => (
          <div key={p.id} className="lqd-media">
            <div className="lqd-thumb lqd-media-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? ''} loading="lazy" />
              {album.coverUrl === p.url && <span className="lqd-media-badge">Ảnh bìa</span>}
            </div>
            <div className="lqd-media-body">
              <input className="lqd-input" style={{ padding: '6px 10px', fontSize: 13 }} defaultValue={p.caption ?? ''} aria-label="Chú thích ảnh" placeholder="Chú thích" onBlur={(e) => e.target.value !== (p.caption ?? '') && setCaption(p.id, e.target.value)} />
              <div className="lqd-media-foot">
                <Button variant="ghost" size="sm" onClick={() => setCover(p.url)} disabled={album.coverUrl === p.url}>
                  Đặt làm bìa
                </Button>
                <IconButton icon="trash" label="Xoá ảnh" className="is-danger" onClick={() => remove(p.id)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
