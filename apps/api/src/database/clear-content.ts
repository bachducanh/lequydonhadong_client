/**
 * Xoá toàn bộ NỘI DUNG để bắt đầu nhập dữ liệu thật.
 * Giữ lại: tài khoản người dùng, cây chuyên mục (menu), kiểu thư viện.
 * Xoá: tin bài + phản hồi, văn bản, file download, chữ chạy, slider, album + ảnh, mục thư viện,
 *      hỏi đáp, góp ý, CLB kết bạn, banner, liên kết, tệp mẫu trong uploads/mau.
 *
 *   Máy chủ:  docker compose ... exec lqd-api node dist/database/clear-content.js --yes
 *   Máy dev:  npm --prefix apps/api run db:clear-content -- --yes
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { existsSync, rmSync } from 'fs';
import Redis from 'ioredis';
import { join, resolve } from 'path';

async function main() {
  if (!process.argv.includes('--yes')) {
    console.log('Lệnh này xoá toàn bộ nội dung website. Chạy lại kèm --yes để xác nhận.');
    process.exitCode = 1;
    return;
  }
  const prisma = new PrismaClient();
  try {
    const steps = [
      ['Phản hồi bài viết', prisma.comment.deleteMany()],
      ['Tin bài', prisma.post.deleteMany()],
      ['Ảnh trong album', prisma.albumPhoto.deleteMany()],
      ['Album', prisma.album.deleteMany()],
      ['Mục thư viện', prisma.libraryItem.deleteMany()],
      ['Văn bản pháp quy', prisma.legalDocument.deleteMany()],
      ['File download', prisma.downloadFile.deleteMany()],
      ['Chữ chạy', prisma.tickerItem.deleteMany()],
      ['Ảnh giới thiệu (slider)', prisma.slide.deleteMany()],
      ['Hỏi đáp', prisma.question.deleteMany()],
      ['Góp ý', prisma.feedback.deleteMany()],
      ['CLB kết bạn', prisma.clubMember.deleteMany()],
      ['Banner', prisma.banner.deleteMany()],
      ['Liên kết', prisma.link.deleteMany()],
    ] as const;
    const results = await prisma.$transaction(steps.map(([, op]) => op));
    steps.forEach(([name], i) => console.log(`  - ${name}: xoá ${results[i].count}`));

    const kept = await Promise.all([prisma.user.count(), prisma.category.count(), prisma.libraryType.count()]);
    console.log(`Giữ lại: ${kept[0]} tài khoản, ${kept[1]} chuyên mục, ${kept[2]} kiểu thư viện.`);
  } finally {
    await prisma.$disconnect();
  }

  const sampleDir = join(resolve(process.env.UPLOAD_DIR ?? './uploads'), 'mau');
  if (existsSync(sampleDir)) {
    rmSync(sampleDir, { recursive: true, force: true });
    console.log(`Đã xoá tệp mẫu: ${sampleDir}`);
  }

  // Làm mới cache dữ liệu công khai để website hiển thị ngay trạng thái mới
  if (process.env.REDIS_URL) {
    const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
    try {
      await redis.connect();
      await redis.incr('cache:version');
      console.log('Đã làm mới cache.');
    } catch {
      console.log('Không kết nối được Redis — cache cũ tự hết hạn sau tối đa 5 phút.');
    } finally {
      redis.disconnect();
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
