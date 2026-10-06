# Hướng dẫn phát hành lên máy chủ

Máy chủ hiện tại: Ubuntu 24.04, Docker, **Cloudflare Tunnel** (container `lumibach-cloudflared`, mạng `lumibach_default`).
Website chạy ở `/opt/lequydonhadong`, đi ra Internet qua tunnel — **không mở cổng 80/443**, không cần Nginx hay chứng chỉ SSL
(Cloudflare cấp HTTPS cho `*.lumibach.com`).

```
Trình duyệt ──HTTPS──▶ Cloudflare ──Tunnel──▶ lumibach-cloudflared ──▶ lqd-web:3000 ──▶ lqd-api:4000 ──▶ lqd-postgres / lqd-redis
```

## 1. Cài / cập nhật trên máy chủ

```bash
ssh root@222.255.182.231
curl -fsSL https://raw.githubusercontent.com/bachducanh/lequydonhadong_client/main/deploy/deploy.sh | bash
```

Script sẽ: tải mã nguồn từ GitHub → tạo `/opt/lequydonhadong/.env` (mật khẩu CSDL, khoá JWT, mật khẩu admin đều ngẫu nhiên)
→ build và chạy 4 container `lqd-postgres`, `lqd-redis`, `lqd-api`, `lqd-web` → kiểm tra website tại `127.0.0.1:3100`.

Cập nhật phiên bản mới sau khi đẩy code lên GitHub: `bash /opt/lequydonhadong/deploy/deploy.sh`.

## 2. Tạo subdomain `lequydonhadong.lumibach.com` trên Cloudflare

Tên miền `lumibach.com` đang dùng DNS của Cloudflare và tunnel được quản lý trên dashboard, nên subdomain được tạo
**ngay trong cấu hình tunnel** — Cloudflare tự thêm bản ghi DNS (CNAME → `<id>.cfargotunnel.com`).

1. Đăng nhập https://one.dash.cloudflare.com → chọn tài khoản chứa `lumibach.com`.
2. Vào **Networks → Tunnels** (giao diện mới: **Networks → Connectors → Cloudflare Tunnels**).
3. Bấm vào tunnel đang chạy cho lumibach.com (trạng thái *Healthy*) → **Edit / Configure**.
4. Tab **Public Hostname** (giao diện mới: **Published application routes**) → **Add a public hostname / Add route**:

   | Ô | Giá trị |
   | --- | --- |
   | Subdomain | `lequydonhadong` |
   | Domain | `lumibach.com` |
   | Path | *(để trống)* |
   | Service — Type | `HTTP` |
   | Service — URL | `lqd-web:3000` |

5. **Save**. Sau 1–2 phút mở https://lequydonhadong.lumibach.com.

Lưu ý:
- Nếu báo *“record already exists”*: vào **DNS → Records** của `lumibach.com`, xoá bản ghi `lequydonhadong` cũ rồi lưu lại.
- Không đổi các hostname đang có của lumibach.com (đang trỏ `http://web:3000`).
- Subdomain một cấp (`lequydonhadong.lumibach.com`) được SSL miễn phí của Cloudflare bao phủ; tên hai cấp như
  `api.lequydonhadong.lumibach.com` thì **không** — nếu cần tên riêng cho API hãy dùng dạng `lequydonhadong-api.lumibach.com`.

### (Tuỳ chọn) Mở API cho ứng dụng di động trên cùng tên miền

Thêm 2 public hostname nữa, **đặt phía trên** dòng ở bước 4 (route có Path phải đứng trước route bắt mọi đường dẫn):

| Subdomain | Domain | Path | Service |
| --- | --- | --- | --- |
| `lequydonhadong` | `lumibach.com` | `^/api/v1/` | `HTTP` · `lqd-api:4000` |
| `lequydonhadong` | `lumibach.com` | `^/docs` | `HTTP` · `lqd-api:4000` |

App di động khi đó dùng `https://lequydonhadong.lumibach.com/api/v1`, tài liệu API ở `/docs`.

## 3. Đăng nhập lần đầu

Tài khoản quản trị: `admin`. Mật khẩu ngẫu nhiên nằm trong `.env` trên máy chủ:

```bash
grep SEED_ADMIN_PASSWORD /opt/lequydonhadong/.env
```

Đăng nhập tại `/dang-nhap` → bấm tên tài khoản góc phải → **Đổi mật khẩu**. Dữ liệu mẫu (tin bài, văn bản, album…)
có thể sửa/xoá trong trang quản trị.

## 4. Vận hành

```bash
cd /opt/lequydonhadong
C="docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile app"
$C ps                              # trạng thái
$C logs -f --tail 100 lqd-api lqd-web   # xem log
$C restart lqd-web                 # khởi động lại web
bash deploy/backup.sh              # sao lưu CSDL + tệp tải lên vào ./backups
```

Sao lưu tự động hằng ngày: `crontab -e` rồi thêm dòng
`0 2 * * * bash /opt/lequydonhadong/deploy/backup.sh >> /var/log/lqd-backup.log 2>&1`.

Khôi phục CSDL từ bản sao lưu:

```bash
gunzip -c backups/db-YYYYMMDD-HHMMSS.sql.gz | $C exec -T lqd-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```
