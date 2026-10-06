#!/usr/bin/env bash
# Triển khai / cập nhật website trên máy chủ Ubuntu có Docker.
#
#   Lần đầu:   curl -fsSL https://raw.githubusercontent.com/bachducanh/lequydonhadong_client/main/deploy/deploy.sh | bash
#   Cập nhật:  bash /opt/lequydonhadong/deploy/deploy.sh
#
# Biến tuỳ chỉnh: APP_DIR, REPO, BRANCH, DOMAIN, TUNNEL_NETWORK, WEB_LOCAL_PORT
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/lequydonhadong}"
REPO="${REPO:-https://github.com/bachducanh/lequydonhadong_client.git}"
BRANCH="${BRANCH:-main}"
DOMAIN="${DOMAIN:-lequydonhadong.lumibach.com}"
TUNNEL_NETWORK="${TUNNEL_NETWORK:-lumibach_default}"
WEB_LOCAL_PORT="${WEB_LOCAL_PORT:-3100}"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

command -v docker >/dev/null || { echo "Chưa có Docker trên máy chủ."; exit 1; }
command -v git >/dev/null || { apt-get update -qq && apt-get install -y -qq git; }

log "Lấy mã nguồn ($BRANCH) vào $APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  git clone --depth 1 -b "$BRANCH" "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

if [ ! -f .env ]; then
  log "Tạo .env với mật khẩu và khoá ngẫu nhiên"
  rand() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | cut -c1-"$1"; }
  umask 077
  cat > .env <<EOF
# Sinh tự động bởi deploy/deploy.sh — không đưa tệp này lên Git
POSTGRES_USER=lqd
POSTGRES_PASSWORD=$(rand 32)
POSTGRES_DB=lqd_hadong
JWT_ACCESS_SECRET=$(rand 48)
JWT_REFRESH_SECRET=$(rand 48)
SITE_URL=https://$DOMAIN
CORS_ORIGINS=https://$DOMAIN
TUNNEL_NETWORK=$TUNNEL_NETWORK
WEB_LOCAL_PORT=$WEB_LOCAL_PORT
# Lần chạy đầu: tạo dữ liệu mẫu + tài khoản "admin" với mật khẩu dưới đây (đổi ngay sau khi đăng nhập)
SEED_ON_START=true
SEED_DEMO_USERS=false
SEED_ADMIN_PASSWORD=$(rand 16)
EOF
  echo "Đã tạo $APP_DIR/.env"
fi

if ! docker network inspect "$TUNNEL_NETWORK" >/dev/null 2>&1; then
  echo "Không thấy mạng Docker '$TUNNEL_NETWORK' của Cloudflare Tunnel. Đặt TUNNEL_NETWORK đúng tên rồi chạy lại."
  exit 1
fi

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile app)

log "Build và khởi động (lần đầu mất vài phút)"
"${COMPOSE[@]}" up -d --build --remove-orphans
docker image prune -f >/dev/null || true

log "Chờ website sẵn sàng tại 127.0.0.1:$WEB_LOCAL_PORT"
for _ in $(seq 1 60); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$WEB_LOCAL_PORT/"; then ok=1; break; fi
  sleep 3
done
"${COMPOSE[@]}" ps
if [ "${ok:-0}" = 1 ]; then
  echo "Website đã chạy. Truy cập công khai: https://$DOMAIN (sau khi thêm Public Hostname trong Cloudflare Tunnel)."
else
  echo "Website chưa phản hồi — xem log: ${COMPOSE[*]} logs --tail 100 lqd-api lqd-web"
  exit 1
fi
