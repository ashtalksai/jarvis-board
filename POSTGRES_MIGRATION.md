# PostgreSQL Migration Guide

## Changes

This migration replaces SQLite (better-sqlite3) with PostgreSQL for production-ready scaling.

### Key Changes

1. **Database Driver**: `better-sqlite3` → `pg` (node-postgres)
2. **Async Operations**: All database operations now use `async/await`
3. **Full-Text Search**: SQLite FTS5 → PostgreSQL `tsvector` with triggers
4. **Schema**: Auto-increment SERIAL, TIMESTAMP types, PostgreSQL-specific syntax
5. **Docker**: Added Postgres service to docker-compose.yml

## Local Development

### Option 1: Local Postgres (Recommended)

Best for development - simple and fast.

1. Install Postgres:
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
```

2. Create database:
```bash
createdb jarvis
createuser jarvis -P  # password: jarvis
```

3. Set environment variable:
```bash
export DATABASE_URL="postgresql://jarvis:jarvis@localhost:5432/jarvis"
```

4. Run app:
```bash
npm run dev
```

### Option 2: Docker Compose (Optional)

For testing production-like setup locally:

```bash
# Start Postgres + App
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Deployment

See **[COOLIFY_DEPLOYMENT.md](./COOLIFY_DEPLOYMENT.md)** for complete Coolify setup guide.

**Quick version:**
1. Create Postgres database in Coolify
2. Set DATABASE_URL environment variable
3. Deploy with Node.js buildpack
4. Build: `npm install && npm run build`
5. Start: `npm start`

## Testing

```bash
# Health check
curl http://localhost:3333/api/tasks

# Create task
curl -X POST http://localhost:3333/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "category": "Inbox"}'

# Search
curl "http://localhost:3333/api/search?q=test"
```

## Data Migration (SQLite → Postgres)

If you have existing SQLite data:

```bash
# Export from SQLite
sqlite3 jarvis.db .dump > backup.sql

# Convert and import (manual editing required for syntax differences)
# Or use a tool like pgloader
```

## Breaking Changes

- All API calls remain the same (backward compatible)
- Database initialization now happens automatically on first connection
- No manual schema migrations needed (tables created automatically)

## Performance

- Better concurrent write handling
- Full-text search with ranking
- Production-ready scaling
- ACID compliance

## Troubleshooting

**Connection refused:**
- Check DATABASE_URL is correct
- Verify Postgres is running: `docker-compose ps`

**Schema errors:**
- Drop and recreate database (dev only):
  ```sql
  DROP DATABASE jarvis;
  CREATE DATABASE jarvis;
  ```

**Async errors:**
- All database functions now return Promises
- Ensure you `await` all db calls
