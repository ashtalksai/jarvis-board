# Backup Instructions

## Automated Backups

### Setup Cron Job (Recommended)

**Option 1: On your server (runs even if Docker is down)**
```bash
# Add to crontab (crontab -e)
0 2 * * * cd /path/to/jarvis-board && ./backup.sh >> backups/backup.log 2>&1
```

**Option 2: Inside Docker container**
Add to Dockerfile before CMD:
```dockerfile
RUN apk add --no-cache dcron
RUN echo "0 2 * * * cd /app && ./backup.sh" > /etc/crontabs/root
```

### Manual Backup
```bash
./backup.sh
```

## Backup Strategy

- **Daily backups**: Last 7 days kept in `backups/daily/`
- **Weekly backups**: Last 4 weeks kept in `backups/weekly/` (created on Sundays)
- **Automatic cleanup**: Old backups deleted automatically

## Restore from Backup

```bash
./restore.sh
# Follow prompts to select backup file
# Container will automatically restart
```

## Offsite Backup (Optional but Recommended)

**Option 1: Rsync to another server**
```bash
# Add to cron after backup.sh
rsync -avz backups/ user@backup-server:/backups/jarvis-board/
```

**Option 2: Upload to cloud storage**
```bash
# AWS S3 example
aws s3 sync backups/ s3://your-bucket/jarvis-board-backups/

# Or use rclone for any cloud provider
rclone sync backups/ remote:jarvis-board-backups/
```

## Test Your Backups!

```bash
# Do this monthly
cp data/jarvis.db data/jarvis.db.test-backup
./restore.sh  # Pick an old backup
# Check if app works
mv data/jarvis.db.test-backup data/jarvis.db  # Restore original
```

## Quick Recovery Commands

```bash
# View backup sizes
du -sh backups/daily/* backups/weekly/*

# Find latest backup
ls -t backups/daily/*.db | head -1

# Emergency restore (latest)
cp $(ls -t backups/daily/*.db | head -1) data/jarvis.db
docker compose restart
```
