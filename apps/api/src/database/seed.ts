/**
 * Dữ liệu mẫu theo bản thiết kế (tin bài, thông báo, văn bản, album, hỏi đáp…).
 *
 *   npm run prisma:seed            -> chỉ chạy khi CSDL còn trống
 *   npm run prisma:seed -- --reset -> xoá sạch rồi tạo lại
 */
import 'dotenv/config';
import { BannerPosition, ClubStatus, CommentStatus, FeedbackStatus, LinkPosition, PostStatus, PrismaClient, QuestionStatus, Role, Tone, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { slugify } from '../common/text';
import { sampleDocx, samplePdf, sampleSvg, sampleXlsx } from './sample-files';

const prisma = new PrismaClient();
const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR ?? './uploads');
const d = (date: string, time = '08:00') => new Date(`${date}T${time}:00+07:00`);

function writeSample(name: string, data: Buffer) {
  const dir = join(UPLOAD_DIR, 'mau');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), data);
  return { url: `/uploads/mau/${name}`, size: data.length };
}

function sampleFile(title: string, ext: 'pdf' | 'docx' | 'xlsx') {
  const name = `${slugify(title)}.${ext}`;
  const data = ext === 'pdf' ? samplePdf(title) : ext === 'docx' ? sampleDocx(title) : sampleXlsx(title);
  const mime = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }[ext];
  const { url, size } = writeSample(name, data);
  return { fileUrl: url, fileName: name, fileSize: size, mimeType: mime };
}

const para = (...lines: string[]) => lines.map((l) => `<p>${l}</p>`).join('');

async function reset() {
  await prisma.$transaction([
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.category.deleteMany(),
    prisma.albumPhoto.deleteMany(),
    prisma.album.deleteMany(),
    prisma.libraryItem.deleteMany(),
    prisma.libraryType.deleteMany(),
    prisma.legalDocument.deleteMany(),
    prisma.downloadFile.deleteMany(),
    prisma.tickerItem.deleteMany(),
    prisma.slide.deleteMany(),
    prisma.question.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.clubMember.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.link.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main() {
  if (process.argv.includes('--reset')) {
    console.log('Xoá dữ liệu cũ…');
    await reset();
  } else if ((await prisma.user.count()) > 0) {
    console.log('CSDL đã có dữ liệu — bỏ qua seed (dùng --reset để tạo lại).');
    return;
  }

  /* ---------- Người dùng ---------- */
  // SEED_DEMO_USERS=false (máy chủ thật): chỉ tạo tài khoản admin, không tạo biên tập/giáo viên mẫu
  const demoUsers = process.env.SEED_DEMO_USERS !== 'false';
  const password = await hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: process.env.SEED_ADMIN_EMAIL ?? 'minhanh@lqdhd.edu.vn',
      fullName: process.env.SEED_ADMIN_NAME ?? (demoUsers ? 'Trần Minh Anh' : 'Quản trị viên'),
      role: Role.ADMIN,
      department: 'Văn phòng',
      passwordHash: password,
    },
  });
  const editor = demoUsers
    ? await prisma.user.create({
        data: { username: 'hongnhung', email: 'hongnhung@lqdhd.edu.vn', fullName: 'Nguyễn Hồng Nhung', role: Role.EDITOR, department: 'Đoàn trường', passwordHash: password, lastLoginAt: d('2026-10-04', '16:40') },
      })
    : admin;
  const teacher = demoUsers
    ? await prisma.user.create({
        data: { username: 'quocviet', email: 'quocviet@lqdhd.edu.vn', fullName: 'Phạm Quốc Việt', role: Role.TEACHER, department: 'Tổ Toán – Tin', passwordHash: password, lastLoginAt: d('2026-10-02') },
      })
    : admin;
  if (demoUsers) {
    await prisma.user.create({
      data: { username: 'thanhhuong', email: 'thanhhuong@lqdhd.edu.vn', fullName: 'Lý Thanh Hương', role: Role.TEACHER, department: 'Tổ Ngoại ngữ', status: UserStatus.LOCKED, passwordHash: password, lastLoginAt: d('2026-06-12') },
    });
  }

  /* ---------- Chuyên mục ---------- */
  const cat: Record<string, string> = {};
  const addCat = async (slug: string, name: string, order: number, parent?: string, showInMenu = true) => {
    const c = await prisma.category.create({ data: { slug, name, order, showInMenu, parentId: parent ? cat[parent] : null } });
    cat[slug] = c.id;
  };
  await addCat('gioi-thieu', 'Giới thiệu', 1);
  await addCat('ban-giam-hieu', 'Ban giám hiệu', 1, 'gioi-thieu');
  await addCat('to-chuyen-mon', 'Tổ chuyên môn', 2, 'gioi-thieu');
  await addCat('tin-tuc', 'Tin tức – Thông báo', 2);
  await addCat('tin-hoat-dong', 'Tin tức', 1, 'tin-tuc');
  await addCat('thong-bao', 'Thông báo', 2, 'tin-tuc');
  await addCat('su-kien', 'Sự kiện', 3, 'tin-tuc');
  await addCat('huong-nghiep', 'Hướng nghiệp', 4, 'tin-tuc', false);
  await addCat('cong-khai', 'Công khai', 5, 'tin-tuc', false);
  await addCat('tuyen-sinh', 'Tuyển sinh', 3);

  /* ---------- Tin bài ---------- */
  type SeedPost = {
    title: string; category: string; excerpt: string; date: string; content?: string; featured?: boolean;
    badge?: string; badgeTone?: Tone; views?: number; authorName?: string; status?: PostStatus; authorId?: string; caption?: string;
  };
  const posts: SeedPost[] = [
    {
      title: 'Khai giảng năm học 2026–2027: hành trình hội nhập', category: 'su-kien', date: '2026-09-05', featured: true, views: 3120,
      excerpt: 'Toàn trường bước vào năm học mới với chương trình ngoại ngữ, STEM và trao đổi quốc tế.', authorName: 'Ban biên tập',
      content: para(
        'Sáng 05/09/2026, thầy cô và học sinh Trường THPT Lê Quý Đôn – Hà Đông long trọng tổ chức lễ khai giảng năm học 2026–2027.',
        'Năm học mới nhà trường tiếp tục triển khai chương trình ngoại ngữ tăng cường, mở rộng các câu lạc bộ STEM và hoạt động giao lưu quốc tế cho học sinh ở cả ba khối.',
      ) + '<h2>Những điểm mới của năm học</h2><ul><li>Lớp tiếng Anh tăng cường theo chuẩn quốc tế cho khối 10.</li><li>Phòng học STEM và câu lạc bộ Robotics mở cửa mỗi chiều thứ Năm.</li><li>Sổ liên lạc điện tử cập nhật kết quả học tập hằng tuần.</li></ul>',
    },
    {
      title: 'Học sinh tham gia ngày hội STEM cấp thành phố', category: 'tin-hoat-dong', date: '2026-10-02', views: 1204, authorName: 'Đoàn trường',
      excerpt: 'Các đội dự án khoa học kỹ thuật của trường giới thiệu sản phẩm tại ngày hội STEM cấp thành phố, thu hút đông đảo học sinh và phụ huynh.',
      caption: 'Đội Robotics giới thiệu sản phẩm. (Ảnh minh hoạ)',
      content: para('Sáng 02/10/2026, các đội dự án của Trường THPT Lê Quý Đôn – Hà Đông đã tham gia ngày hội STEM cấp thành phố với ba sản phẩm thuộc các lĩnh vực robot, môi trường và ứng dụng di động.') +
        '<h2>Ba dự án tiêu biểu</h2>' +
        para('Mỗi dự án được học sinh tự thiết kế, thử nghiệm trong câu lạc bộ STEM của trường dưới sự hướng dẫn của giáo viên tổ Khoa học tự nhiên và tổ Toán – Tin.', 'Ngày hội là dịp để các em giao lưu, học hỏi kinh nghiệm từ các trường bạn và chuẩn bị cho cuộc thi khoa học kỹ thuật cấp thành phố sắp tới.'),
    },
    { title: 'Điều chỉnh lịch học do thời tiết', category: 'thong-bao', date: '2026-10-05', badge: 'Khẩn', badgeTone: Tone.DANGER, views: 860, excerpt: 'Áp dụng cho tất cả các khối.', authorName: 'Văn phòng nhà trường' },
    { title: 'Đăng ký thi IELTS tại trường', category: 'thong-bao', date: '2026-10-03', badge: 'Hạn chót', badgeTone: Tone.WARNING, views: 645, excerpt: 'Hạn nộp hồ sơ: 15/10/2026.', authorName: 'Tổ Ngoại ngữ' },
    { title: 'Lịch kiểm tra giữa học kỳ I năm học 2026–2027', category: 'thong-bao', date: '2026-09-30', views: 2210, featured: true, excerpt: 'Học sinh xem lịch chi tiết theo khối lớp và phòng thi.', authorName: 'Phòng Giáo vụ' },
    { title: 'Kết quả thi chọn học sinh giỏi cấp trường', category: 'thong-bao', date: '2026-09-28', badge: 'Đã công bố', badgeTone: Tone.SUCCESS, views: 1530, excerpt: 'Danh sách học sinh đạt giải và lịch tập huấn đội tuyển.', authorName: 'Phòng Giáo vụ' },
    { title: 'Tư vấn du học và chứng chỉ quốc tế cho học sinh khối 12', category: 'huong-nghiep', date: '2026-09-28', views: 740, excerpt: 'Buổi chia sẻ về IELTS, SAT và lộ trình học bổng.', authorName: 'Tổ Ngoại ngữ' },
    { title: 'Giải bóng đá học sinh khối 10 khởi tranh', category: 'su-kien', date: '2026-09-26', views: 980, excerpt: '16 đội bóng tranh tài trong 3 tuần tại sân trường.', authorName: 'Đoàn trường' },
    { title: 'Công khai dự toán ngân sách năm 2026', category: 'cong-khai', date: '2026-09-24', views: 410, excerpt: 'Báo cáo công khai theo quy định hiện hành.', authorName: 'Kế toán' },
    { title: 'Câu lạc bộ Robotics giành giải Nhất cuộc thi sáng tạo trẻ', category: 'tin-hoat-dong', date: '2026-09-15', views: 1320, excerpt: 'Sản phẩm robot phân loại rác của nhóm học sinh lớp 11A1 được ban giám khảo đánh giá cao.', authorName: 'Đoàn trường' },
    { title: 'Tuyển sinh lớp 10 năm học 2027–2028: chỉ tiêu và lịch thi', category: 'tuyen-sinh', date: '2026-10-01', views: 4120, excerpt: 'Thông tin chỉ tiêu, lịch thi và hướng dẫn đăng ký dự tuyển vào lớp 10.', authorName: 'Ban tuyển sinh' },
    { title: 'Hướng dẫn chuẩn bị hồ sơ nhập học lớp 10', category: 'tuyen-sinh', date: '2026-09-20', views: 1890, excerpt: 'Danh mục giấy tờ cần nộp và thời gian tiếp nhận hồ sơ tại văn phòng nhà trường.', authorName: 'Ban tuyển sinh' },
    { title: 'Lễ tri ân và trưởng thành học sinh khối 12', category: 'su-kien', date: '2026-05-25', views: 2050, excerpt: 'Khoảnh khắc xúc động của học sinh khối 12 trước kỳ thi tốt nghiệp.', authorName: 'Đoàn trường' },
    {
      title: 'Giới thiệu chung về nhà trường', category: 'gioi-thieu', date: '2026-08-01', views: 2600, authorName: 'Nhà trường',
      excerpt: 'Môi trường học tập hiện đại, hội nhập quốc tế, lấy học sinh làm trung tâm.',
      content: para(
        'Trang giới thiệu mẫu. Nhà trường cập nhật lịch sử hình thành, sứ mệnh, tầm nhìn và các thành tích tiêu biểu tại mục Quản lý tin bài trong trang quản trị.',
        'Địa chỉ: 04 Nhuệ Giang, phường Hà Đông, Hà Nội. Điện thoại: (0433) 525.618. Email: c3lequydon-hadong@hanoiedu.vn.',
      ),
    },
    { title: 'Ban giám hiệu nhà trường', category: 'ban-giam-hieu', date: '2026-08-01', views: 1200, authorName: 'Nhà trường', excerpt: 'Thông tin Hiệu trưởng, các Phó Hiệu trưởng và lĩnh vực phụ trách.', content: para('Nội dung mẫu — cập nhật danh sách Ban giám hiệu, ảnh và lĩnh vực phụ trách trong trang quản trị.') },
    { title: 'Các tổ chuyên môn', category: 'to-chuyen-mon', date: '2026-08-01', views: 900, authorName: 'Nhà trường', excerpt: 'Tổ Ngoại ngữ, Toán – Tin, Khoa học tự nhiên, Khoa học xã hội và các câu lạc bộ học thuật.', content: para('Nội dung mẫu — mỗi tổ chuyên môn có thể có một bài giới thiệu riêng với danh sách giáo viên và hoạt động tiêu biểu.') },
    { title: 'Kế hoạch tổ chức Hội thao chào mừng 20/11', category: 'su-kien', date: '2026-10-04', status: PostStatus.PENDING, authorId: teacher.id, authorName: 'Tổ Thể dục', excerpt: 'Dự kiến các nội dung thi đấu và thời gian đăng ký của các lớp.' },
    { title: 'Thông báo lịch họp phụ huynh học kỳ I', category: 'thong-bao', date: '2026-10-05', status: PostStatus.DRAFT, authorId: editor.id, authorName: 'Văn phòng nhà trường', excerpt: 'Thời gian, địa điểm họp phụ huynh theo từng khối lớp.' },
  ];

  const postIds: Record<string, string> = {};
  for (const p of posts) {
    const status = p.status ?? PostStatus.PUBLISHED;
    const created = await prisma.post.create({
      data: {
        title: p.title,
        slug: slugify(p.title),
        excerpt: p.excerpt,
        content: p.content ?? para(p.excerpt, 'Thông tin chi tiết được nhà trường cập nhật tại đây. Phụ huynh và học sinh theo dõi website thường xuyên để nhận thông báo mới nhất.'),
        imageCaption: p.caption ?? null,
        categoryId: cat[p.category],
        authorId: p.authorId ?? admin.id,
        authorName: p.authorName,
        status,
        publishedAt: status === PostStatus.PUBLISHED ? d(p.date) : null,
        featured: p.featured ?? false,
        badge: p.badge ?? null,
        badgeTone: p.badgeTone ?? null,
        views: p.views ?? 0,
        createdAt: d(p.date),
      },
    });
    postIds[p.title] = created.id;
  }

  /* ---------- Phản hồi ---------- */
  const stem = postIds['Học sinh tham gia ngày hội STEM cấp thành phố'];
  const exam = postIds['Lịch kiểm tra giữa học kỳ I năm học 2026–2027'];
  const abroad = postIds['Tư vấn du học và chứng chỉ quốc tế cho học sinh khối 12'];
  await prisma.comment.createMany({
    data: [
      { postId: stem, name: 'Nguyễn Thu Hà', content: 'Chúc mừng các em! Mong nhà trường tiếp tục tổ chức nhiều hoạt động như thế này.', status: CommentStatus.APPROVED, createdAt: d('2026-10-03', '09:15') },
      { postId: stem, name: 'Lê Quang Huy', content: 'Đội Robotics quá đỉnh, năm sau em sẽ đăng ký tham gia.', status: CommentStatus.APPROVED, createdAt: d('2026-10-02', '20:05') },
      { postId: exam, name: 'Nguyễn Thu Hà', email: 'phụ huynh lớp 10A3', content: 'Nhà trường cho hỏi lịch kiểm tra môn Tin học của khối 10 có thay đổi không ạ?', createdAt: d('2026-10-05', '08:12') },
      { postId: stem, name: 'Lê Quang Huy', email: 'học sinh 12A1', content: 'Chúc mừng các bạn đội STEM! Mong năm sau trường tổ chức thêm cuộc thi cấp trường.', createdAt: d('2026-10-04', '21:40') },
      { postId: abroad, name: 'Phạm Minh Tuấn', email: 'cựu học sinh K2019', content: 'Rất tự hào về trường. Em có thể đăng ký chia sẻ kinh nghiệm du học không ạ?', createdAt: d('2026-10-04', '10:05') },
      { postId: exam, name: 'Hoàng Lan', email: 'phụ huynh lớp 11D2', content: 'Đề nghị nhà trường đăng kèm file PDF lịch thi để tiện in.', createdAt: d('2026-10-03', '19:22') },
      { postId: exam, name: 'Quảng cáo', content: 'Khuyến mãi lớn, truy cập ngay…', status: CommentStatus.SPAM, createdAt: d('2026-10-01', '02:10') },
    ].map((c) => ({ status: CommentStatus.PENDING, ...c })),
  });

  /* ---------- Văn bản pháp quy ---------- */
  const legal = [
    { code: '29/2024/TT-BGDĐT', title: 'Thông tư quy định về dạy thêm, học thêm', issuer: 'Bộ GD&ĐT', type: 'Thông tư', date: '2024-12-30' },
    { code: '22/2021/TT-BGDĐT', title: 'Thông tư quy định về đánh giá học sinh trung học cơ sở và trung học phổ thông', issuer: 'Bộ GD&ĐT', type: 'Thông tư', date: '2021-07-20' },
    { code: '32/2020/TT-BGDĐT', title: 'Điều lệ trường trung học cơ sở, trường trung học phổ thông và trường phổ thông có nhiều cấp học', issuer: 'Bộ GD&ĐT', type: 'Thông tư', date: '2020-09-15' },
    { code: '43/2019/QH14', title: 'Luật Giáo dục', issuer: 'Quốc hội', type: 'Luật', date: '2019-06-14' },
    { code: 'CV-SGDĐT', title: 'Hướng dẫn nhiệm vụ năm học 2026–2027', issuer: 'Sở GD&ĐT Hà Nội', type: 'Công văn', date: '2026-08-28' },
    { code: 'QĐ-THPTLQĐ', title: 'Quy chế chi tiêu nội bộ năm 2026', issuer: 'Nhà trường', type: 'Quyết định', date: '2026-01-15' },
    { code: 'QĐ-THPTLQĐ/KH', title: 'Kế hoạch giáo dục nhà trường năm học 2026–2027', issuer: 'Nhà trường', type: 'Quyết định', date: '2026-09-10' },
  ];
  for (const doc of legal) {
    const f = sampleFile(doc.title, doc.type === 'Công văn' ? 'docx' : 'pdf');
    await prisma.legalDocument.create({
      data: { code: doc.code, title: doc.title, issuer: doc.issuer, type: doc.type, issuedAt: d(doc.date), fileUrl: f.fileUrl, fileName: f.fileName, fileSize: f.fileSize },
    });
  }

  /* ---------- Tài liệu tải về ---------- */
  const downloads: { name: string; category: string; ext: 'pdf' | 'docx' | 'xlsx'; downloads: number; date: string; visible?: boolean }[] = [
    { name: 'Đơn xin nghỉ học', category: 'Biểu mẫu', ext: 'docx', downloads: 1204, date: '2026-08-12' },
    { name: 'Hồ sơ nhập học lớp 10', category: 'Tuyển sinh', ext: 'pdf', downloads: 2931, date: '2026-07-01' },
    { name: 'Đề cương ôn tập học kỳ I – Toán 11', category: 'Ôn tập', ext: 'pdf', downloads: 842, date: '2026-10-01' },
    { name: 'Mẫu đăng ký câu lạc bộ', category: 'Biểu mẫu', ext: 'xlsx', downloads: 95, date: '2026-09-15' },
    { name: 'Phiếu đăng ký dự tuyển lớp 10', category: 'Tuyển sinh', ext: 'docx', downloads: 1560, date: '2026-09-25' },
    { name: 'Đề cương ôn tập học kỳ I – Ngữ văn 10', category: 'Ôn tập', ext: 'pdf', downloads: 510, date: '2026-10-02' },
  ];
  for (const f of downloads) {
    const file = sampleFile(f.name, f.ext);
    await prisma.downloadFile.create({
      data: { name: f.name, category: f.category, downloads: f.downloads, visible: f.visible ?? true, createdAt: d(f.date), ...file },
    });
  }

  /* ---------- Chữ chạy ---------- */
  await prisma.tickerItem.createMany({
    data: [
      { text: 'Lịch kiểm tra giữa học kỳ I đã được công bố', link: `/tin-tuc/${slugify('Lịch kiểm tra giữa học kỳ I năm học 2026–2027')}`, startAt: d('2026-09-30'), endAt: d('2026-10-20', '23:59'), order: 1 },
      { text: 'Đăng ký thi IELTS tại trường trước ngày 15/10/2026', link: `/tin-tuc/${slugify('Đăng ký thi IELTS tại trường')}`, startAt: d('2026-10-03'), endAt: d('2026-10-15', '23:59'), order: 2 },
      { text: 'Công khai dự toán ngân sách năm 2026', link: `/tin-tuc/${slugify('Công khai dự toán ngân sách năm 2026')}`, startAt: d('2026-09-24'), endAt: d('2026-12-31', '23:59'), order: 3 },
      { text: 'Chào mừng ngày Nhà giáo Việt Nam 20/11', link: null, startAt: d('2026-11-10'), endAt: d('2026-11-21', '23:59'), order: 4 },
      { text: 'Khai giảng năm học 2026–2027', link: `/tin-tuc/${slugify('Khai giảng năm học 2026–2027: hành trình hội nhập')}`, startAt: d('2026-09-01'), endAt: d('2026-09-10', '23:59'), order: 5 },
    ],
  });

  /* ---------- Slider ---------- */
  await prisma.slide.createMany({
    data: [
      { order: 1, eyebrow: 'Năm học 2026–2027', title: 'Học tập hôm nay, vươn ra thế giới ngày mai', lead: 'Chào đón năm học mới với chương trình ngoại ngữ tăng cường, câu lạc bộ STEM và giao lưu quốc tế.', ctaLabel: 'Khám phá nhà trường', ctaHref: '/gioi-thieu', secondaryLabel: 'Xem tin khai giảng', secondaryHref: `/tin-tuc/${slugify('Khai giảng năm học 2026–2027: hành trình hội nhập')}`, caption: 'Lễ khai giảng 05/09/2026' },
      { order: 2, eyebrow: 'Tuyển sinh', title: 'Tuyển sinh lớp 10 năm học 2027–2028', lead: 'Chỉ tiêu, lịch thi, hồ sơ và hướng dẫn nhập học — cập nhật đầy đủ tại một nơi.', ctaLabel: 'Xem thông tin tuyển sinh', ctaHref: '/tuyen-sinh', secondaryLabel: 'Tải hồ sơ', secondaryHref: '/van-ban', caption: 'Ảnh minh hoạ' },
      { order: 3, eyebrow: 'Câu lạc bộ', title: 'STEM, Robotics và hơn 20 câu lạc bộ học sinh', lead: 'Nơi học sinh thử nghiệm ý tưởng, làm dự án và thi đấu cùng bạn bè.', ctaLabel: 'Tìm câu lạc bộ', ctaHref: '/cau-lac-bo', caption: 'Ảnh minh hoạ' },
      { order: 4, eyebrow: 'Quốc tế', title: 'Giao lưu quốc tế 2025', lead: 'Học sinh giao lưu văn hoá cùng các trường bạn.', ctaLabel: 'Xem album', ctaHref: '/thu-vien', visible: false },
    ],
  });

  /* ---------- Albums ---------- */
  const albums = [
    { title: 'Lễ khai giảng 2026–2027', date: '2026-09-05', year: '2026–2027', photos: 12 },
    { title: 'Ngày hội STEM', date: '2026-10-02', year: '2026–2027', photos: 8 },
    { title: 'Giải bóng đá khối 10', date: '2026-09-26', year: '2026–2027', photos: 9 },
    { title: 'Lễ tri ân khối 12', date: '2026-05-25', year: '2025–2026', photos: 10 },
    { title: 'Giao lưu quốc tế', date: '2026-04-12', year: '2025–2026', photos: 6 },
    { title: 'Hội trại 26/3', date: '2026-03-26', year: '2025–2026', photos: 11 },
  ];
  for (const [i, a] of albums.entries()) {
    const album = await prisma.album.create({ data: { title: a.title, eventDate: d(a.date), schoolYear: a.year, description: `Hình ảnh ${a.title.toLowerCase()} (ảnh minh hoạ).` } });
    const slug = slugify(a.title);
    await prisma.albumPhoto.createMany({
      data: Array.from({ length: a.photos }, (_, k) => {
        const { url } = writeSample(`${slug}-${k + 1}.svg`, sampleSvg(i + k, `${a.title} · ảnh ${k + 1}`));
        return { albumId: album.id, url, caption: `${a.title} — ảnh ${k + 1}`, order: k + 1 };
      }),
    });
  }

  /* ---------- Thư viện ---------- */
  const types: Record<string, string> = {};
  for (const [order, t] of [
    { name: 'Ảnh', slug: 'anh', description: 'Ảnh hoạt động, sự kiện', allowedFormats: 'JPG, PNG, WEBP' },
    { name: 'Video', slug: 'video', description: 'Video giới thiệu, phóng sự', allowedFormats: 'MP4, YouTube' },
    { name: 'Bài giảng', slug: 'bai-giang', description: 'Bài giảng điện tử của giáo viên', allowedFormats: 'PPTX, PDF' },
    { name: 'Tài liệu', slug: 'tai-lieu', description: 'Đề cương, tài liệu ôn tập', allowedFormats: 'PDF, DOCX' },
  ].entries()) {
    types[t.slug] = (await prisma.libraryType.create({ data: { ...t, order: order + 1 } })).id;
  }
  const img = (name: string, seed: number) => {
    const { url, size } = writeSample(name, sampleSvg(seed, 'Ảnh minh hoạ'));
    return { fileUrl: url, fileName: name, fileSize: size, mimeType: 'image/svg+xml', thumbnail: url };
  };
  await prisma.libraryItem.createMany({
    data: [
      { title: 'Sân trường buổi sáng', typeId: types.anh, ...img('san-truong-buoi-sang.svg', 0) },
      { title: 'Đội tuyển học sinh giỏi', typeId: types.anh, ...img('doi-tuyen-hsg.svg', 2) },
      { title: 'Video giới thiệu trường', typeId: types.video, description: 'Gắn link YouTube trong trang quản trị.' },
      { title: 'Bài giảng Hoá 11 – Chương 2', typeId: types['bai-giang'], ...sampleFile('Bài giảng Hoá 11 – Chương 2', 'pdf') },
      { title: 'Bài giảng Vật lý 10 – Động học', typeId: types['bai-giang'], ...sampleFile('Bài giảng Vật lý 10 – Động học', 'pdf') },
      { title: 'Đề cương ôn tập Toán 10', typeId: types['tai-lieu'], ...sampleFile('Đề cương ôn tập Toán 10', 'pdf') },
      { title: 'Tài liệu ôn thi IELTS Writing', typeId: types['tai-lieu'], ...sampleFile('Tài liệu ôn thi IELTS Writing', 'docx') },
    ],
  });

  /* ---------- Hỏi đáp ---------- */
  await prisma.question.createMany({
    data: [
      { question: 'Thủ tục chuyển trường giữa năm học cần những giấy tờ gì?', askerName: 'Lê Văn Bình', askerRole: 'Phụ huynh', topic: 'Thủ tục', status: QuestionStatus.ANSWERED, answer: 'Phụ huynh chuẩn bị đơn xin chuyển trường, học bạ, giấy giới thiệu của trường đi và bản sao giấy khai sinh, nộp tại văn phòng nhà trường trong giờ hành chính.', answeredBy: 'Văn phòng nhà trường', answeredAt: d('2026-09-21'), createdAt: d('2026-09-20') },
      { question: 'Học sinh lớp 10 có được tham gia câu lạc bộ ngay từ học kỳ I không?', askerName: 'Nguyễn Thu Hà', askerRole: 'Phụ huynh', topic: 'Học tập', status: QuestionStatus.ANSWERED, answer: 'Có. Các câu lạc bộ tuyển thành viên trong tháng 9 và tháng 10; học sinh đăng ký qua giáo viên chủ nhiệm.', answeredBy: 'Đoàn trường', answeredAt: d('2026-09-16'), createdAt: d('2026-09-15') },
      { question: 'Lịch tiếp phụ huynh của Ban giám hiệu như thế nào?', askerName: 'Đỗ Mai', askerRole: 'Phụ huynh', topic: 'Khác', status: QuestionStatus.ANSWERED, answer: 'Ban giám hiệu tiếp phụ huynh sáng thứ Bảy hằng tuần, từ 8h00 đến 11h00, tại phòng tiếp dân.', answeredBy: 'Văn phòng nhà trường', answeredAt: d('2026-09-11'), createdAt: d('2026-09-10') },
      { question: 'Hồ sơ dự tuyển lớp 10 nộp trực tuyến hay trực tiếp?', askerName: 'Trần Hải', askerRole: 'Phụ huynh', topic: 'Tuyển sinh', status: QuestionStatus.ANSWERED, answer: 'Phụ huynh đăng ký trực tuyến theo hướng dẫn của Sở GD&ĐT Hà Nội, sau đó nộp bản giấy tại trường khi trúng tuyển.', answeredBy: 'Ban tuyển sinh', answeredAt: d('2026-09-06'), createdAt: d('2026-09-05') },
      { question: 'Học sinh lớp 10 có được đăng ký học thêm tiếng Nhật không?', askerName: 'Nguyễn Thu Hà', askerRole: 'Phụ huynh', topic: 'Học tập', createdAt: d('2026-10-05', '07:30') },
      { question: 'Khi nào nhà trường công bố lịch thi học kỳ I?', askerName: 'Lê Văn Bình', askerRole: 'Phụ huynh', topic: 'Học tập', createdAt: d('2026-10-04') },
      { question: 'Trường có xe đưa đón học sinh không ạ?', askerName: 'Đỗ Mai', askerRole: 'Phụ huynh', topic: 'Khác', createdAt: d('2026-10-02') },
    ],
  });

  /* ---------- Góp ý ---------- */
  await prisma.feedback.createMany({
    data: [
      { name: 'Hoàng Lan', role: 'Phụ huynh', email: 'hoanglan@example.com', title: 'Đề nghị lắp thêm mái che khu để xe', content: 'Khu để xe phía cổng sau bị dột khi mưa, đề nghị nhà trường lắp thêm mái che.', createdAt: d('2026-10-05', '07:45') },
      { name: 'Vũ Đức Long', role: 'Học sinh', email: 'duclong@example.com', title: 'Kéo dài giờ mở cửa thư viện', content: 'Em mong thư viện mở đến 17h30 để ôn thi.', createdAt: d('2026-10-04') },
      { name: 'Ngô Thanh Tâm', role: 'Cựu học sinh', email: 'thanhtam@example.com', title: 'Thành lập mạng lưới cựu học sinh', content: 'Chúng tôi muốn hỗ trợ các em khối 12 định hướng nghề nghiệp.', status: FeedbackStatus.SEEN, createdAt: d('2026-10-01') },
      { name: 'Đinh Quang Minh', role: 'Phụ huynh', email: 'quangminh@example.com', title: 'Cảm ơn nhà trường về buổi họp phụ huynh', content: 'Buổi họp rất chu đáo, thông tin rõ ràng.', status: FeedbackStatus.RESOLVED, note: 'Đã gửi thư cảm ơn.', createdAt: d('2026-09-20') },
    ],
  });

  /* ---------- CLB kết bạn ---------- */
  await prisma.clubMember.createMany({
    data: [
      { fullName: 'Bùi Khánh Linh', className: '10A2', hobbies: 'Đọc sách, cầu lông', language: 'Tiếng Anh', createdAt: d('2026-10-05') },
      { fullName: 'Đặng Gia Huy', className: '11A1', hobbies: 'Robot, cờ vua', language: 'Tiếng Anh', createdAt: d('2026-10-04') },
      { fullName: 'Trịnh Ngọc Mai', className: '10D1', hobbies: 'Vẽ, âm nhạc', language: 'Tiếng Pháp', createdAt: d('2026-10-03') },
      { fullName: 'Lương Hoài An', className: '12A5', hobbies: 'Nhiếp ảnh', language: 'Tiếng Anh', status: ClubStatus.APPROVED, createdAt: d('2026-09-12') },
      { fullName: 'Phan Bảo Ngọc', className: '11D2', hobbies: 'Bóng rổ, du lịch', language: 'Tiếng Hàn', status: ClubStatus.APPROVED, createdAt: d('2026-09-10') },
    ],
  });

  /* ---------- Banner ---------- */
  await prisma.banner.createMany({
    data: [
      { name: 'Tuyển sinh lớp 10 năm 2027', eyebrow: 'Tuyển sinh 2027–2028', title: 'Tuyển sinh lớp 10 đã mở cổng đăng ký', description: 'Xem chỉ tiêu, lịch thi và tải hồ sơ nhập học.', ctaLabel: 'Xem thông tin tuyển sinh', link: '/tuyen-sinh', size: '1200×320', position: BannerPosition.HOME, startAt: d('2026-10-01'), endAt: d('2027-06-30', '23:59'), clicks: 1842 },
      { name: 'Thi IELTS tại trường', eyebrow: 'Thi IELTS', title: 'Thi IELTS tại trường', description: 'Hạn đăng ký 15/10/2026.', ctaLabel: 'Đăng ký', link: `/tin-tuc/${slugify('Đăng ký thi IELTS tại trường')}`, size: '360×480', position: BannerPosition.SIDEBAR, startAt: d('2026-10-03'), endAt: d('2026-10-15', '23:59'), clicks: 406 },
      { name: 'Chào mừng 20/11', eyebrow: 'Ngày Nhà giáo Việt Nam', title: 'Tri ân thầy cô 20/11', ctaLabel: 'Xem hoạt động', link: '/tin-tuc', size: '1200×320', position: BannerPosition.HOME, startAt: d('2026-11-10'), endAt: d('2026-11-21', '23:59') },
    ],
  });

  /* ---------- Liên kết ---------- */
  await prisma.link.createMany({
    data: [
      { name: 'Bộ Giáo dục và Đào tạo', sub: 'moet.gov.vn', url: 'https://moet.gov.vn', icon: 'globe', position: LinkPosition.HOME, order: 1 },
      { name: 'Sở GD&ĐT Hà Nội', sub: 'hanoi.edu.vn', url: 'https://hanoi.edu.vn', icon: 'scale', position: LinkPosition.HOME, order: 2 },
      { name: 'Tra cứu điểm thi', sub: 'Kết quả học tập', url: null, icon: 'search', position: LinkPosition.HOME, openNewTab: false, order: 3 },
      { name: 'Sổ liên lạc điện tử', sub: 'Dành cho phụ huynh', url: null, icon: 'book', position: LinkPosition.HOME, openNewTab: false, order: 4 },
      { name: 'Cổng thông tin tuyển sinh Hà Nội', sub: 'tuyensinh10.hanoi.edu.vn', url: 'https://hanoi.edu.vn', icon: 'external', position: LinkPosition.FOOTER, order: 5 },
    ],
  });

  console.log('Đã tạo dữ liệu mẫu.');
  console.log(`Đăng nhập quản trị: admin / ${process.env.SEED_ADMIN_PASSWORD ? '(SEED_ADMIN_PASSWORD)' : 'Admin@123'}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
