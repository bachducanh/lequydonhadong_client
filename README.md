# Website Trường THPT Lê Quý Đôn – Hà Đông

Website công khai + trang quản trị nội dung, dựng theo hệ thống thiết kế **“Lê Quý Đôn Hà Đông”**
(bố cục edX, xanh nhà trường, điểm nhấn đỏ/vàng từ logo, font Be Vietnam Pro).

API và Web tách riêng để sau này làm **ứng dụng di động** dùng chung API.

```
┌──────────────┐   HTTPS / JSON (Bearer JWT)   ┌──────────────────┐     ┌────────────┐
│ App di động  │ ─────────────────────────────▶ │                  │ ──▶ │ PostgreSQL │
└──────────────┘                                │   API (NestJS)   │     └────────────┘
┌──────────────┐  /api/bff/* (cookie httpOnly)  │   /api/v1/*      │     ┌────────────┐
│ Web (Next.js)│ ─────────────────────────────▶ │   /uploads/*     │ ──▶ │   Redis    │
└──────────────┘                                └──────────────────┘     └────────────┘
```

| Thư mục | Công nghệ | Cổng |
| --- | --- | --- |
| `apps/api` | NestJS 11, Prisma 6, PostgreSQL 17, Redis 7, JWT, Swagger | 4000 |
| `apps/web` | Next.js 16 (App Router), React 19, Tailwind CSS 4 | 3000 |
| `docker-compose.yml` | Postgres, Redis (+ API, Web với profile `app`) | 5433, 6380 |

## Chạy nhanh bằng Docker (toàn bộ hệ thống)

```bash
cp .env.example .env
docker compose --profile app up -d --build
```

- Website: http://localhost:3000 · Quản trị: http://localhost:3000/quan-tri
- API: http://localhost:4000/api/v1 · Tài liệu API (Swagger): http://localhost:4000/docs
- Lần đầu API tự chạy migration và tạo dữ liệu mẫu (`SEED_ON_START=true`).

Tài khoản mẫu (mật khẩu = `SEED_ADMIN_PASSWORD`, mặc định `Admin@123`):

| Tên đăng nhập | Vai trò | Ghi chú |
| --- | --- | --- |
| `admin` | Quản trị | Toàn quyền, kể cả quản lý người dùng |
| `hongnhung` | Biên tập | Mọi nội dung, không quản lý người dùng |
| `quocviet` | Giáo viên | Viết bài (chỉ gửi duyệt), thư viện, file download |
| `thanhhuong` | Giáo viên | Đang bị khoá |

> Đổi mật khẩu các tài khoản mẫu và hai khoá `JWT_*_SECRET` trước khi đưa lên mạng.

## Phát hành lên máy chủ

Xem [deploy/HUONG-DAN.md](deploy/HUONG-DAN.md): một lệnh `deploy/deploy.sh` trên máy chủ (Docker + Cloudflare Tunnel,
không mở cổng ra Internet) và cách tạo subdomain `lequydonhadong.lumibach.com` trong Cloudflare.
Trên máy chủ thật `SEED_DEMO_USERS=false`: chỉ tạo tài khoản `admin` với mật khẩu ngẫu nhiên.

## Chạy để phát triển

Yêu cầu: Node.js ≥ 20, Docker.

```bash
npm run setup          # cài thư viện cho root, apps/api, apps/web
npm run db:up          # Postgres (5433) + Redis (6380) trong Docker
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:migrate     # tạo bảng (prisma migrate dev)
npm run db:seed        # dữ liệu mẫu; thêm "-- --reset" để xoá và tạo lại
npm run dev            # API :4000 + Web :3000 (tự nạp lại khi sửa mã)
```

Lệnh khác: `npm run build` (build cả hai), `npm --prefix apps/api run prisma:studio` (xem CSDL).

## Trang & chức năng

**Công khai** (`apps/web/src/app/(site)`)

| Đường dẫn | Nội dung |
| --- | --- |
| `/` | Chữ chạy → Slider → Tìm kiếm nổi → Tin nổi bật → Thông báo + Văn bản mới → Banner → Tổ chuyên môn → Thư viện ảnh → Liên kết |
| `/tin-tuc` | Danh sách tin, lọc chuyên mục, tìm kiếm, sắp xếp, phân trang, cột bên (thông báo, xem nhiều) |
| `/tin-tuc/[slug]` | Chi tiết bài, đếm lượt xem, chia sẻ, phản hồi (chờ duyệt), tin liên quan, banner cột bên |
| `/van-ban` | Văn bản pháp quy (lọc loại, cơ quan) + tài liệu tải về (đếm lượt tải) |
| `/thu-vien`, `/thu-vien/album/[id]` | Album ảnh theo năm học, video/bài giảng/tài liệu theo kiểu thư viện, xem ảnh lớn |
| `/hoi-dap` | Hỏi đáp theo chủ đề + biểu mẫu gửi câu hỏi / góp ý |
| `/gioi-thieu`, `/tuyen-sinh`, `/cau-lac-bo` | Giới thiệu, tuyển sinh lớp 10, đăng ký CLB kết bạn |
| `/tim-kiem` | Tìm chung trong tin bài, văn bản, tài liệu, hỏi đáp |
| `/dang-nhap` | Đăng nhập quản trị |

**Quản trị** (`/quan-tri`) — 16 màn hình theo thiết kế: bảng điều khiển; tin bài (trình soạn thảo, ảnh,
nổi bật, đưa lên chữ chạy); chuyên mục (cây); phản hồi (duyệt/spam); văn bản pháp quy; chữ chạy (kéo thả,
lịch chạy, xem trước); ảnh giới thiệu/slider (xem trước); albums (tải nhiều ảnh, ảnh bìa); thư viện;
kiểu thư viện; file download; hỏi đáp (trả lời/xuất bản); góp ý; CLB kết bạn; banner (lịch hiển thị,
lượt nhấp); liên kết (kéo thả); người dùng (phân quyền, khoá).

## API cho web và app di động

- Tiền tố `/api/v1`. Tài liệu đầy đủ, thử trực tiếp tại `/docs` (OpenAPI — có thể sinh client cho Flutter/React Native/Swift/Kotlin từ `/docs-json`).
- Route công khai: `GET /home`, `/posts`, `/posts/:slug`, `/categories`, `/legal-documents`, `/downloads`, `/albums`,
  `/library-types`, `/library-items`, `/questions`, `/banners`, `/links`, `/tickers`, `/slides`, `/search`;
  gửi dữ liệu: `POST /posts/:slug/comments`, `/questions`, `/feedbacks`, `/club-members` (giới hạn tần suất theo IP).
- Xác thực: `POST /auth/login` → `{ accessToken (15 phút), refreshToken (30 ngày) }`; `POST /auth/refresh` (xoay vòng token,
  lưu trong Redis), `POST /auth/logout`, `GET /auth/me`. Gửi `Authorization: Bearer <accessToken>`.
- Route quản trị: `/api/v1/admin/*` (phân quyền ADMIN / EDITOR / TEACHER). Tải tệp: `POST /admin/uploads` (multipart `file`)
  → `{ url: "/uploads/2026/10/..." }`.
- Phân trang: `?page=&limit=` → `{ data, meta: { page, limit, total, totalPages, counts? } }`. Lỗi trả về thông báo tiếng Việt.

Web không giữ JWT trong trình duyệt: Next.js đặt token vào cookie httpOnly và chuyển tiếp qua `/api/bff/*`
(tự làm mới token khi hết hạn). App di động gọi thẳng API bằng Bearer token.

## Redis dùng để làm gì

- Cache dữ liệu công khai (trang chủ, danh sách, chi tiết). Mỗi thao tác ghi ở `/admin` tăng `cache:version`
  nên cache cũ tự hết hiệu lực ngay. Redis lỗi → API vẫn chạy, đọc thẳng Postgres.
- Lưu refresh token (thu hồi khi đăng xuất / xoay vòng).
- Giới hạn tần suất gửi biểu mẫu, đăng nhập; chống đếm trùng lượt xem bài.

## Cấu trúc mã

```
apps/api/
  prisma/schema.prisma          # 17 bảng: User, Category, Post, Comment, LegalDocument, TickerItem, Slide,
                                # Album, AlbumPhoto, LibraryType, LibraryItem, DownloadFile, Question,
                                # Feedback, ClubMember, Banner, Link
  src/common/                   # guard JWT/role/rate-limit, phân trang, slug tiếng Việt, làm sạch HTML, lỗi tiếng Việt
  src/modules/<tên>/            # mỗi module: route công khai + route /admin, service, DTO
  src/database/seed.ts          # dữ liệu mẫu theo bản thiết kế (+ tệp PDF/DOCX/XLSX/ảnh minh hoạ)
apps/web/src/
  app/(site)/                   # trang công khai (Server Components, gọi API phía máy chủ)
  app/quan-tri/                 # trang quản trị (Client Components gọi /api/bff)
  app/api/bff, app/api/auth     # lớp BFF + đăng nhập/đăng xuất (cookie httpOnly)
  components/ui, site, admin    # component chuyển từ bản thiết kế (lớp CSS lqd-*)
  styles/tokens.css             # design tokens theme Sáng/Tối
  styles/design.css             # CSS component của bản thiết kế
  app/globals.css               # Tailwind 4 + ánh xạ token vào @theme (bg-surface, text-ink, …)
```

## Ghi chú

- Ảnh slider/tin bài trong dữ liệu mẫu là khối hình học giữ chỗ (như bản thiết kế); tải ảnh thật trong quản trị.
- Nội dung giới thiệu, ban giám hiệu trong dữ liệu mẫu là văn bản mẫu — cần nhà trường cập nhật.
- Tệp tải lên lưu ở `apps/api/uploads` (Docker: volume `uploads`). Khi cần mở rộng có thể thay bằng S3/MinIO trong `modules/uploads`.
- Tìm kiếm hiện phân biệt dấu tiếng Việt (“tuyen sinh” ≠ “tuyển sinh”); có thể bật extension `unaccent` của Postgres để tìm không dấu.
