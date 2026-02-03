# Jarvis Board

Kanban task board for Ash & Jarvis. Built with Next.js 15, SQLite, and Tailwind CSS.

## Quick Start

### Local Development
```bash
npm install
npm run dev
# Open http://localhost:3333
```

### Production Deployment
```bash
# 1. Generate authentication tokens
./generate-tokens.sh

# 2. Create .env file with your tokens
cp .env.example .env
# Edit .env with generated tokens

# 3. Build and deploy
docker compose up -d --build
# Open http://your-server:3333
```

See [AUTH_SETUP.md](AUTH_SETUP.md) for detailed authentication configuration.

## Docker

```bash
docker compose up -d --build
# Open http://localhost:3333
```

## Features
- Kanban board: Inbox → In Progress → Done
- Drag & drop between columns
- Category tags, priority levels, markdown descriptions
- Search and filter
- SQLite database with auto-seed
- Dark theme, mobile responsive

## Backup & Restore

**Automated backups:**
```bash
# Manual backup
./backup.sh

# Setup automated backups (runs daily at 2am)
crontab -e
# Add: 0 2 * * * cd /path/to/jarvis-board && ./backup.sh >> backups/backup.log 2>&1
```

**Restore from backup:**
```bash
./restore.sh  # Interactive restore from any backup
```

See [BACKUP_INSTRUCTIONS.md](BACKUP_INSTRUCTIONS.md) for detailed backup strategy and offsite backup options.
