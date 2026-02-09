#!/bin/bash
set -e

# Jarvis Board SQLite Restore Script

BACKUP_DIR="./backups"
DB_FILE="./data/jarvis.db"

echo "Available backups:"
echo ""
echo "DAILY:"
ls -lh "$BACKUP_DIR/daily"/*.db 2>/dev/null | awk '{print $9, "(" $5 ")"}'
echo ""
echo "WEEKLY:"
ls -lh "$BACKUP_DIR/weekly"/*.db 2>/dev/null | awk '{print $9, "(" $5 ")"}'
echo ""

read -p "Enter full path to backup file: " BACKUP_FILE

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found"
  exit 1
fi

# Create safety backup of current DB
if [ -f "$DB_FILE" ]; then
  SAFETY_BACKUP="$BACKUP_DIR/pre-restore_$(date +%Y%m%d_%H%M%S).db"
  cp "$DB_FILE" "$SAFETY_BACKUP"
  echo "✓ Current DB backed up to: $SAFETY_BACKUP"
fi

# Restore
cp "$BACKUP_FILE" "$DB_FILE"
echo "✓ Database restored from: $BACKUP_FILE"
echo ""
echo "Restart your Docker container:"
echo "  docker compose restart"
