#!/bin/bash
# MongoDB backup for Irancell shop
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/irancell}"
ENV_FILE="$APP_DIR/backend/.env"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/irancell-mongodb}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^(MONGODB_URI)=' "$ENV_FILE" | sed 's/\r$//')
  set +a
fi

MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/irancell_shop}"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="$BACKUP_DIR/$STAMP"

mongodump --uri="$MONGODB_URI" --out="$OUT_DIR" --gzip
tar -czf "$BACKUP_DIR/irancell_${STAMP}.tar.gz" -C "$BACKUP_DIR" "$STAMP"
rm -rf "$OUT_DIR"

find "$BACKUP_DIR" -maxdepth 1 -name 'irancell_*.tar.gz' -mtime +"$KEEP_DAYS" -delete

echo "Backup saved: $BACKUP_DIR/irancell_${STAMP}.tar.gz"
