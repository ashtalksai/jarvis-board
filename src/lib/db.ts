import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://jarvis:jarvis@localhost:5432/jarvis',
});

let initialized = false;

async function initDb() {
  if (initialized) return;

  const client = await pool.connect();
  try {
    // Tasks table - basic columns first
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'Inbox',
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'backlog',
        source TEXT DEFAULT '',
        due_date TIMESTAMP,
        estimated_hours NUMERIC,
        actual_hours NUMERIC,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add new columns if they don't exist (for existing databases)
    try { await client.query(`ALTER TABLE tasks ADD COLUMN priority_level INTEGER DEFAULT 2`); } catch (e) { /* column exists */ }
    try { await client.query(`ALTER TABLE tasks ADD COLUMN eta DATE`); } catch (e) { /* column exists */ }
    try { await client.query(`ALTER TABLE tasks ADD COLUMN last_activity_at TIMESTAMP DEFAULT NOW()`); } catch (e) { /* column exists */ }
    try { await client.query(`ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT '{}'`); } catch (e) { /* column exists */ }

    // Task comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Task last seen table (for notifications)
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_last_seen (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        last_seen_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(task_id, user_id)
      )
    `);

    // Activities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        details TEXT,
        session_id TEXT,
        tokens_used INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indices
    try { await client.query(`CREATE INDEX IF NOT EXISTS idx_activities_action ON activities(action)`); } catch (e) {}
    try { await client.query(`CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at)`); } catch (e) {}
    try { await client.query(`CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id)`); } catch (e) {}
    try { await client.query(`CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id)`); } catch (e) {}
    try { await client.query(`CREATE INDEX IF NOT EXISTS idx_task_comments_created ON task_comments(created_at)`); } catch (e) {}
    try { await client.query(`CREATE INDEX IF NOT EXISTS idx_task_last_seen_user ON task_last_seen(user_id)`); } catch (e) {}

    initialized = true;
  } finally {
    client.release();
  }
}

export type Task = {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  priority_level: number;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  due_date?: string | null;
  eta?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  last_activity_at?: string | null;
  tags?: string[];
  has_unread?: boolean;
};

export async function getAllTasks(status?: string, category?: string, search?: string, userId?: string): Promise<Task[]> {
  await initDb();
  
  let query = `
    SELECT 
      id, title, description, category, priority, 
      COALESCE(priority_level, 2) as priority_level, 
      status, source, 
      created_at, updated_at, due_date, 
      COALESCE(eta, NULL) as eta, 
      estimated_hours, actual_hours, 
      COALESCE(last_activity_at, updated_at) as last_activity_at, 
      COALESCE(tags, '{}') as tags,
      false as has_unread
    FROM tasks
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramCount = 1;

  if (status) {
    query += ` AND status = $${paramCount++}`;
    params.push(status);
  }
  if (category) {
    query += ` AND category = $${paramCount++}`;
    params.push(category);
  }
  if (search) {
    query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  query += ` ORDER BY 
    COALESCE(priority_level, 2) DESC,
    updated_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getTaskById(id: number): Promise<Task | undefined> {
  await initDb();
  const result = await pool.query(
    `SELECT id, title, description, category, priority, 
            COALESCE(priority_level, 2) as priority_level, 
            status, source, created_at, updated_at, due_date, 
            eta, estimated_hours, actual_hours, 
            COALESCE(last_activity_at, updated_at) as last_activity_at, 
            COALESCE(tags, '{}') as tags 
     FROM tasks WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  await initDb();
  
  // Use basic insert that works with all versions of the schema
  const result = await pool.query(
    `INSERT INTO tasks (title, description, category, priority, priority_level, status, source, due_date, eta, estimated_hours, actual_hours, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, title, description, category, priority, 
               COALESCE(priority_level, 2) as priority_level, 
               status, source, created_at, updated_at, due_date, 
               eta, estimated_hours, actual_hours, 
               COALESCE(last_activity_at, created_at) as last_activity_at, 
               COALESCE(tags, '{}') as tags`,
    [
      data.title || 'Untitled',
      data.description || '',
      data.category || 'Inbox',
      data.priority || 'Medium',
      data.priority_level || 2,
      data.status || 'backlog',
      data.source || '',
      data.due_date || null,
      data.eta || null,
      data.estimated_hours || null,
      data.actual_hours || null,
      data.tags || [],
    ]
  );
  return result.rows[0];
}

export async function updateTask(id: number, data: Partial<Task>): Promise<Task | undefined> {
  await initDb();
  const existing = await getTaskById(id);
  if (!existing) return undefined;

  const updated = { ...existing, ...data };
  const result = await pool.query(
    `UPDATE tasks 
     SET title=$1, description=$2, category=$3, priority=$4, priority_level=$5, status=$6, 
         source=$7, due_date=$8, eta=$9, estimated_hours=$10, actual_hours=$11, tags=$12,
         updated_at=NOW(), last_activity_at=NOW()
     WHERE id=$13
     RETURNING id, title, description, category, priority, 
               COALESCE(priority_level, 2) as priority_level, 
               status, source, created_at, updated_at, due_date, 
               eta, estimated_hours, actual_hours, 
               COALESCE(last_activity_at, updated_at) as last_activity_at, 
               COALESCE(tags, '{}') as tags`,
    [
      updated.title,
      updated.description,
      updated.category,
      updated.priority,
      updated.priority_level || 2,
      updated.status,
      updated.source,
      updated.due_date || null,
      updated.eta || null,
      updated.estimated_hours || null,
      updated.actual_hours || null,
      updated.tags || [],
      id,
    ]
  );
  return result.rows[0];
}

export async function deleteTask(id: number): Promise<boolean> {
  await initDb();
  const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
}

export async function getTasksByDateRange(startDate: string, endDate: string): Promise<Task[]> {
  await initDb();
  const result = await pool.query(
    `SELECT id, title, description, category, priority, 
            COALESCE(priority_level, 2) as priority_level, 
            status, source, created_at, updated_at, due_date, 
            eta, estimated_hours, actual_hours, 
            COALESCE(last_activity_at, updated_at) as last_activity_at, 
            COALESCE(tags, '{}') as tags
     FROM tasks 
     WHERE (due_date IS NOT NULL AND due_date >= $1 AND due_date <= $2)
        OR (eta IS NOT NULL AND eta >= $1 AND eta <= $2)
     ORDER BY COALESCE(eta, due_date) ASC, 
       COALESCE(priority_level, 2) DESC`,
    [startDate, endDate]
  );
  return result.rows;
}

// ============================================================
// COMMENTS
// ============================================================

export type Comment = {
  id: number;
  task_id: number;
  author: string;
  content: string;
  created_at: string;
};

export async function getComments(taskId: number): Promise<Comment[]> {
  await initDb();
  const result = await pool.query(
    'SELECT id, task_id, author, content, created_at FROM task_comments WHERE task_id = $1 ORDER BY created_at ASC',
    [taskId]
  );
  return result.rows;
}

export async function createComment(taskId: number, author: string, content: string): Promise<Comment> {
  await initDb();
  
  // Update task's last_activity_at
  try {
    await pool.query('UPDATE tasks SET last_activity_at = NOW() WHERE id = $1', [taskId]);
  } catch (e) {
    // Column might not exist
  }
  
  const result = await pool.query(
    `INSERT INTO task_comments (task_id, author, content)
     VALUES ($1, $2, $3)
     RETURNING id, task_id, author, content, created_at`,
    [taskId, author, content]
  );
  return result.rows[0];
}

// ============================================================
// NOTIFICATIONS / LAST SEEN
// ============================================================

export async function markTaskSeen(taskId: number, userId: string): Promise<void> {
  await initDb();
  try {
    await pool.query(
      `INSERT INTO task_last_seen (task_id, user_id, last_seen_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (task_id, user_id) 
       DO UPDATE SET last_seen_at = NOW()`,
      [taskId, userId]
    );
  } catch (e) {
    // Table might not exist
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  await initDb();
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM tasks t
       LEFT JOIN task_last_seen ls ON t.id = ls.task_id AND ls.user_id = $1
       WHERE ls.last_seen_at IS NULL OR t.last_activity_at > ls.last_seen_at`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  } catch (e) {
    return 0;
  }
}

// ============================================================
// ACTIVITIES
// ============================================================

export type Activity = {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  session_id: string | null;
  tokens_used: number | null;
  created_at: string;
};

export type ActivityInput = {
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
  session_id?: string;
  tokens_used?: number;
};

export type ActivityFilters = {
  action?: string;
  entity_type?: string;
  entity_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
};

export async function createActivity(data: ActivityInput): Promise<Activity> {
  await initDb();
  const result = await pool.query(
    `INSERT INTO activities (action, entity_type, entity_id, details, session_id, tokens_used)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, action, entity_type, entity_id, details, session_id, tokens_used, created_at`,
    [
      data.action,
      data.entity_type || null,
      data.entity_id || null,
      data.details ? JSON.stringify(data.details) : null,
      data.session_id || null,
      data.tokens_used || null,
    ]
  );
  return result.rows[0];
}

export async function getActivities(filters: ActivityFilters = {}): Promise<Activity[]> {
  await initDb();
  let query = 'SELECT id, action, entity_type, entity_id, details, session_id, tokens_used, created_at FROM activities WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  if (filters.action) {
    query += ` AND action = $${paramCount++}`;
    params.push(filters.action);
  }
  if (filters.entity_type) {
    query += ` AND entity_type = $${paramCount++}`;
    params.push(filters.entity_type);
  }
  if (filters.entity_id) {
    query += ` AND entity_id = $${paramCount++}`;
    params.push(filters.entity_id);
  }
  if (filters.start_date) {
    query += ` AND created_at >= $${paramCount++}`;
    params.push(filters.start_date);
  }
  if (filters.end_date) {
    query += ` AND created_at <= $${paramCount++}`;
    params.push(filters.end_date);
  }

  query += ' ORDER BY created_at DESC';

  if (filters.limit) {
    query += ` LIMIT $${paramCount++}`;
    params.push(filters.limit);
  }
  if (filters.offset) {
    query += ` OFFSET $${paramCount++}`;
    params.push(filters.offset);
  }

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getActivityStats(): Promise<{
  total_activities: number;
  total_tokens: number;
  by_action: Record<string, number>;
  by_entity_type: Record<string, number>;
  recent_24h: number;
}> {
  await initDb();
  
  const totalResult = await pool.query('SELECT COUNT(*) as count FROM activities');
  const total = parseInt(totalResult.rows[0].count);
  
  const tokensResult = await pool.query('SELECT COALESCE(SUM(tokens_used), 0) as sum FROM activities WHERE tokens_used IS NOT NULL');
  const totalTokens = parseInt(tokensResult.rows[0].sum || '0');
  
  const byActionResult = await pool.query('SELECT action, COUNT(*) as count FROM activities GROUP BY action');
  const byAction = Object.fromEntries(byActionResult.rows.map(row => [row.action, parseInt(row.count)]));
  
  const byEntityResult = await pool.query('SELECT entity_type, COUNT(*) as count FROM activities WHERE entity_type IS NOT NULL GROUP BY entity_type');
  const byEntityType = Object.fromEntries(byEntityResult.rows.map(row => [row.entity_type, parseInt(row.count)]));
  
  const recent24hResult = await pool.query("SELECT COUNT(*) as count FROM activities WHERE created_at >= NOW() - INTERVAL '1 day'");
  const recent24h = parseInt(recent24hResult.rows[0].count);
  
  return {
    total_activities: total,
    total_tokens: totalTokens,
    by_action: byAction,
    by_entity_type: byEntityType,
    recent_24h: recent24h,
  };
}

// ============================================================
// SEARCH (simplified - no full-text search)
// ============================================================

export type SearchResult = Task & {
  rank: number;
};

export async function searchTasks(query: string, limit: number = 10): Promise<SearchResult[]> {
  await initDb();
  
  const result = await pool.query(
    `SELECT 
       id, title, description, category, priority, 
       COALESCE(priority_level, 2) as priority_level, 
       status, source, created_at, updated_at, due_date, 
       eta, estimated_hours, actual_hours, 
       COALESCE(last_activity_at, updated_at) as last_activity_at, 
       COALESCE(tags, '{}') as tags,
       1 as rank
     FROM tasks
     WHERE title ILIKE $1 OR description ILIKE $1
     ORDER BY updated_at DESC
     LIMIT $2`,
    [`%${query}%`, limit]
  );
  
  return result.rows;
}
