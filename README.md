# Jarvis Board

A minimal, fast kanban board built for humans and AI agents to collaborate on tasks. Built with Next.js 15, PostgreSQL, and Tailwind CSS.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Kanban board** — Drag & drop tasks between columns (Backlog → Todo → In Progress → Review → Done)
- **Calendar view** — See tasks by due date
- **Activity feed** — Track all changes with timestamps
- **API-first** — Full REST API for agent/automation access
- **Multi-user** — Filter by user, supports multiple operators
- **Priorities** — 4-level priority system (Low → Urgent)
- **Categories** — Tag tasks by type (work, dev, research, etc.)
- **Markdown** — Full markdown support in descriptions
- **Dark theme** — Easy on the eyes
- **Mobile responsive** — Works on any device

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Docker)

### Local Development

```bash
# Clone the repo
git clone https://github.com/yourusername/jarvis-board.git
cd jarvis-board

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database URL and API tokens

# Run database migrations
npm run migrate

# Start dev server
npm run dev
```

Open [http://localhost:3333](http://localhost:3333)

### Docker (Recommended)

```bash
# Clone and setup env
git clone https://github.com/yourusername/jarvis-board.git
cd jarvis-board
cp .env.example .env

# Generate secure API tokens
./generate-tokens.sh

# Start everything (app + postgres)
docker compose up -d --build
```

Open [http://localhost:3333](http://localhost:3333)

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/jarvis` |
| `API_TOKENS` | Comma-separated API tokens for authentication | `token1,token2` |
| `BASIC_AUTH_USER` | (Optional) HTTP Basic Auth username | `admin` |
| `BASIC_AUTH_PASS` | (Optional) HTTP Basic Auth password | `secret` |

### Generate Secure Tokens

```bash
# Generate a random 32-byte hex token
openssl rand -hex 32

# Or use the helper script
./generate-tokens.sh
```

## API Reference

All endpoints accept JSON and return JSON. Authentication via `Authorization: Bearer <token>` header.

### Tasks

#### List Tasks
```bash
GET /api/tasks
GET /api/tasks?status=todo
GET /api/tasks?category=dev
GET /api/tasks?search=keyword
GET /api/tasks?userId=ash
```

#### Get Task
```bash
GET /api/tasks/:id
```

#### Create Task
```bash
POST /api/tasks
Content-Type: application/json

{
  "title": "Build feature X",
  "description": "Optional markdown description",
  "status": "todo",           # backlog|todo|doing|review|done
  "category": "dev",          # Optional
  "priority_level": 3,        # 1=Low, 2=Medium, 3=High, 4=Urgent
  "due_date": "2024-02-15",   # Optional, ISO date
  "user_id": "ash"            # Optional, defaults to "ash"
}
```

#### Update Task
```bash
PATCH /api/tasks/:id
Content-Type: application/json

{
  "status": "doing",
  "priority_level": 4
}
```

#### Delete Task
```bash
DELETE /api/tasks/:id
```

### Activities

#### List Activities
```bash
GET /api/activities
GET /api/activities?limit=50
```

### Quick Examples

```bash
# List all tasks
curl -s http://localhost:3333/api/tasks | jq

# Create a task
curl -X POST http://localhost:3333/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Review PR #42", "status": "todo", "priority_level": 3}'

# Move task to done
curl -X PATCH http://localhost:3333/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'

# Search tasks
curl -s "http://localhost:3333/api/tasks?search=deploy" | jq
```

## Project Structure

```
jarvis-board/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # REST API routes
│   │   ├── calendar/     # Calendar view
│   │   ├── activities/   # Activity feed
│   │   └── page.tsx      # Kanban board
│   ├── components/       # React components
│   └── lib/              # Database & utilities
├── migrations/           # SQL migrations
├── docker-compose.yml    # Docker setup
└── Dockerfile
```

## Deployment

### Docker Compose (Self-hosted)

```bash
# Production deployment
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Coolify

See [COOLIFY_DEPLOYMENT.md](COOLIFY_DEPLOYMENT.md) for one-click deployment to Coolify.

### Manual

```bash
npm run build
npm start
```

## Backup & Restore

```bash
# Create backup
./backup.sh

# Restore from backup
./restore.sh
```

For automated daily backups, add to crontab:
```bash
0 2 * * * cd /path/to/jarvis-board && ./backup.sh >> backups/backup.log 2>&1
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL with raw SQL
- **Styling:** Tailwind CSS 4
- **Drag & Drop:** dnd-kit
- **Markdown:** react-markdown

## License

MIT — do whatever you want with it.

---

Built for getting shit done. 🚀
