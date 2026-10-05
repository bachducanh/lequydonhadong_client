'use client';

import { notFound } from 'next/navigation';
import { AlbumPhotos } from './album-photos';
import { Dashboard } from './dashboard';
import { PostEditor } from './post-editor';
import { QAScreen } from './qa-screen';
import { ResourceScreen } from './resource-screen';
import { RESOURCES } from './resources';

export { Dashboard };

/** /quan-tri/[resource] */
export function AdminResourcePage({ resource }: { resource: string }) {
  if (resource === 'hoi-dap') return <QAScreen />;
  const config = RESOURCES[resource];
  if (!config) notFound();
  return <ResourceScreen key={resource} config={config} />;
}

/** /quan-tri/[resource]/[id] */
export function AdminDetailPage({ resource, id }: { resource: string; id: string }) {
  if (resource === 'tin-bai') return <PostEditor key={id} id={id === 'moi' ? undefined : id} />;
  if (resource === 'albums') return <AlbumPhotos id={id} />;
  notFound();
}
