import { resolve } from 'path';

export const uploadRoot = () => resolve(process.env.UPLOAD_DIR ?? './uploads');
export const uploadMaxBytes = () => Number(process.env.UPLOAD_MAX_MB ?? 50) * 1024 * 1024;

/** Định dạng được phép tải lên */
export const ALLOWED_EXT = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar',
  'mp4', 'webm', 'mp3',
];
