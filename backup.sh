#!/bin/bash
set -e

# Jarvis Board SQLite Backup Script
# Keeps last 7 daily backups + last 4 weekly backups

BACKUP_DIR="./backups"
DB_FILE="./data/jarvis.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly"

# Daily backup
DAILY_BACKUP="$BACKUP_DIR/daily/jarvis_${TIMESTAMP}.db"
cp "$DB_FILE" "$DAILY_BACKUP"
echo "✓ Daily backup created: $DAILY_BACKUP"

# Weekly backup (on Sundays)
if [ "$DAY_OF_WEEK" -eq 7 ]; then
  WEEKLY_BACKUP="$BACKUP_DIR/weekly/jarvis_${TIMESTAMP}.db"
  cp "$DB_FILE" "$WEEKLY_BACKUP"
  echo "✓ Weekly backup created: $WEEKLY_BACKUP"

  # Keep only last 4 weekly backups
  ls -t "$BACKUP_DIR/weekly"/*.db 2>/dev/null | tail -n +5 | xargs -r rm
fi

# Keep only last 7 daily backups
ls -t "$BACKUP_DIR/daily"/*.db 2>/dev/null | tail -n +8 | xargs -r rm

# Show backup status
echo ""
echo "Backup Status:"
echo "  Daily backups: $(ls -1 "$BACKUP_DIR/daily"/*.db 2>/dev/null | wc -l)"
echo "  Weekly backups: $(ls -1 "$BACKUP_DIR/weekly"/*.db 2>/dev/null | wc -l)"
echo "  Total size: $(du -sh "$BACKUP_DIR" | cut -f1)"
