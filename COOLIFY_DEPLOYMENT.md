# Coolify Deployment Guide (Non-Docker)

## Prerequisites

1. **PostgreSQL Database**
   - Create a managed Postgres database in Coolify
   - Note the connection string (DATABASE_URL)

## Deployment Steps

### 1. Create New Service in Coolify

- Type: **Application**
- Source: GitHub repository
- Branch: `main` (after merging this PR)

### 2. Build Configuration

**Build Pack:** Node.js

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Port:** 3000

### 3. Environment Variables

Add in Coolify:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Get this from your Coolify Postgres service.

Optional (if using API tokens):
```
API_TOKENS=your-token-here
```

### 4. Deploy

1. Push code to GitHub
2. Trigger deployment in Coolify
3. Coolify will:
   - Clone repo
   - Run `npm install`
   - Run `npm run build`
   - Start with `npm start`
   - Database schema auto-initializes on first connection

### 5. Verify

```bash
# Health check
curl https://your-domain.com/api/tasks

# Create test task
curl -X POST https://your-domain.com/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "category": "Inbox"}'
```

## Database Setup

### Option A: Coolify Managed Postgres (Recommended)

1. In Coolify, create new Database service
2. Type: PostgreSQL
3. Copy the connection string
4. Add as DATABASE_URL environment variable

### Option B: External Postgres

Use any managed Postgres (Supabase, Railway, etc.):
```
DATABASE_URL=postgresql://user:password@external-host:5432/dbname
```

## Troubleshooting

**Build fails:**
- Check Node.js version (requires Node 18+)
- Verify package.json scripts

**Database connection fails:**
- Verify DATABASE_URL format
- Ensure Postgres service is running
- Check network/firewall rules in Coolify

**App crashes on start:**
- Check Coolify logs
- Verify environment variables are set
- Ensure DATABASE_URL is accessible

## Automatic Schema Initialization

No manual database setup needed! The app automatically:
1. Creates tables on first connection
2. Sets up indices
3. Configures full-text search triggers

## Performance Tips

- Use Coolify's built-in PostgreSQL for best performance
- Enable connection pooling (already configured in code)
- Monitor database logs in Coolify

## Updating

1. Push changes to GitHub
2. Coolify auto-deploys (if enabled)
3. Or manually trigger redeploy in Coolify UI
