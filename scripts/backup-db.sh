#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +%Y%m%d)
OUT_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/backup-$DATE.sql"

if [ -f "$FILE" ]; then
  echo "[info] Já existe dump para hoje: $FILE" >&2
  exit 0
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL não definido" >&2
  exit 1
fi

echo "Gerando dump em $FILE" >&2
pg_dump --no-owner --no-privileges "$DATABASE_URL" > "$FILE"
echo "OK" >&2