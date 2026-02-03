# Authentication Setup

Your Jarvis Board uses **hybrid authentication**:
- **HTTP Basic Auth** for browser access (you)
- **API Tokens** for programmatic access (your agent)

## Initial Setup

### 1. Generate Secure Tokens
```bash
./generate-tokens.sh
```

This will output tokens like:
```
PERSONAL_TOKEN=abc123...
AGENT_TOKEN=def456...
API_TOKENS=abc123...,def456...
BASIC_AUTH_PASS=xyz789...
```

### 2. Create .env File
```bash
cp .env.example .env
```

Edit `.env` and add your generated tokens:
```env
DB_PATH=./data/jarvis.db
API_TOKENS=your-personal-token,your-agent-token
BASIC_AUTH_USER=ash
BASIC_AUTH_PASS=your-generated-password
```

### 3. Rebuild and Start
```bash
docker compose down
docker compose up -d --build
```

## Usage

### Browser Access (You)
When you visit `http://your-server:3333`, you'll see a login prompt:
- **Username:** `ash` (or whatever you set in BASIC_AUTH_USER)
- **Password:** Your BASIC_AUTH_PASS value

Your browser will remember these credentials.

### Agent Access
Your AI agent should use the API token in requests:

```bash
# Example: Create a task
curl -X POST http://your-server:3333/api/tasks \
  -H "Authorization: Bearer your-agent-token-here" \
  -H "Content-Type: application/json" \
  -d '{"title": "New task from agent"}'

# Example: Get all tasks
curl http://your-server:3333/api/tasks \
  -H "Authorization: Bearer your-agent-token-here"
```

**In Python:**
```python
import requests

AGENT_TOKEN = "your-agent-token-here"
BASE_URL = "http://your-server:3333"

headers = {"Authorization": f"Bearer {AGENT_TOKEN}"}

# Get tasks
response = requests.get(f"{BASE_URL}/api/tasks", headers=headers)
tasks = response.json()

# Create task
new_task = {
    "title": "Task from agent",
    "description": "Created via API",
    "category": "Coding",
    "priority": "High"
}
response = requests.post(f"{BASE_URL}/api/tasks", json=new_task, headers=headers)
```

**In JavaScript/Node.js:**
```javascript
const AGENT_TOKEN = "your-agent-token-here";
const BASE_URL = "http://your-server:3333";

const headers = {
  "Authorization": `Bearer ${AGENT_TOKEN}`,
  "Content-Type": "application/json"
};

// Get tasks
const response = await fetch(`${BASE_URL}/api/tasks`, { headers });
const tasks = await response.json();

// Create task
await fetch(`${BASE_URL}/api/tasks`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    title: "Task from agent",
    category: "Coding",
    priority: "High"
  })
});
```

## Security Best Practices

1. **Keep tokens secret** - Never commit .env to git (already in .gitignore)
2. **Use HTTPS in production** - Add SSL/TLS certificate (see below)
3. **Rotate tokens periodically** - Generate new ones every few months
4. **Separate tokens** - Use different token for you vs agent (easier to revoke)

## Adding HTTPS (Recommended for Production)

### Option 1: Cloudflare Tunnel (Easiest)
Free SSL/TLS automatically:
```bash
# Install cloudflared
# Follow: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

cloudflared tunnel create jarvis-board
cloudflared tunnel route dns jarvis-board jarvis.yourdomain.com
cloudflared tunnel run jarvis-board
```

### Option 2: Let's Encrypt with Nginx
Add to Dockerfile (more complex):
```bash
# Use certbot to get SSL certificate
# Update nginx config to listen on 443
```

## Troubleshooting

**"Authentication required" when agent tries to access:**
- Check API_TOKENS is set in docker-compose.yml
- Verify token in Authorization header
- Check logs: `docker compose logs -f`

**Browser keeps asking for password:**
- Check BASIC_AUTH_USER and BASIC_AUTH_PASS are set
- Try different browser (clear cache)
- Check container logs for auth setup messages

**Check if auth is working:**
```bash
# Should be rejected (no auth)
curl http://your-server:3333/api/tasks

# Should work (with token)
curl -H "Authorization: Bearer your-token" http://your-server:3333/api/tasks

# Should work (with Basic Auth)
curl -u ash:your-password http://your-server:3333/api/tasks
```

## Revoking Access

**To revoke agent token:**
1. Remove token from API_TOKENS in .env
2. Restart: `docker compose restart`

**To change your password:**
1. Update BASIC_AUTH_PASS in .env
2. Restart: `docker compose restart`
3. Clear browser saved passwords
