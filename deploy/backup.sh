#!/usr/bin/env bash
# Sao lưu CSDL + tệp tải lên, giữ 14 bản gần nhất.
#   bash /opt/lequydonhadong/deploy/backup.sh
# Chạy tự động 2h sáng mỗi ngày (crontab -e):
#   0 2 * * * bash /opt/lequydonhadong/deploy/backup.sh >> /var/log/lqd-backup.log 2>&1
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/lequydonhadong}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
KEEP="${KEEP:-14}"
cd "$APP_DIR"
set -a; . ./.env; set +a
mkdir -p "$BACKUP_DIR"
stamp=$(date +%Y%m%d-%H%M%S)
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile app)

"${COMPOSE[@]}" exec -T lqd-postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner | gzip > "$BACKUP_DIR/db-$stamp.sql.gz"
"${COMPOSE[@]}" exec -T lqd-api tar -czf - -C /app uploads > "$BACKUP_DIR/uploads-$stamp.tar.gz"

ls -1t "$BACKUP_DIR"/db-*.sql.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f
ls -1t "$BACKUP_DIR"/uploads-*.tar.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f
echo "$(date '+%F %T') Đã sao lưu: db-$stamp.sql.gz, uploads-$stamp.tar.gz"
