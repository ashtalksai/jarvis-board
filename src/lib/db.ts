import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://jarvis:jarvis@localhost:5432/jarvis',
});

let initialized = false;

async function initDb() {
  if (initialized) return;

  const client = await pool.connect();
  try {
    // Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'Inbox',
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'todo',
        source TEXT DEFAULT '',
        due_date TIMESTAMP,
        estimated_hours NUMERIC,
        actual_hours NUMERIC,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
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

    // Create indices if they don't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activities_action ON activities(action)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id)
    `);

    // Add full-text search columns
    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS search_vector tsvector
    `);
    
    // Create or replace trigger function for updating search vector
    await client.query(`
      CREATE OR REPLACE FUNCTION tasks_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `);

    // Create trigger if it doesn't exist
    await client.query(`
      DROP TRIGGER IF EXISTS tasks_search_vector_trigger ON tasks
    `);
    await client.query(`
      CREATE TRIGGER tasks_search_vector_trigger
      BEFORE INSERT OR UPDATE ON tasks
      FOR EACH ROW EXECUTE FUNCTION tasks_search_vector_update()
    `);

    // Create index on search vector
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING gin(search_vector)
    `);

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
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  due_date?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
};

export async function getAllTasks(status?: string, category?: string, search?: string): Promise<Task[]> {
  await initDb();
  
  let query = 'SELECT id, title, description, category, priority, status, source, created_at, updated_at, due_date, estimated_hours, actual_hours FROM tasks WHERE 1=1';
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
    CASE priority 
      WHEN 'Urgent' THEN 0 
      WHEN 'High' THEN 1 
      WHEN 'Medium' THEN 2 
      WHEN 'Low' THEN 3 
    END, 
    updated_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getTaskById(id: number): Promise<Task | undefined> {
  await initDb();
  const result = await pool.query(
    'SELECT id, title, description, category, priority, status, source, created_at, updated_at, due_date, estimated_hours, actual_hours FROM tasks WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  await initDb();
  const result = await pool.query(
    `INSERT INTO tasks (title, description, category, priority, status, source, due_date, estimated_hours, actual_hours)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, title, description, category, priority, status, source, created_at, updated_at, due_date, estimated_hours, actual_hours`,
    [
      data.title || 'Untitled',
      data.description || '',
      data.category || 'Inbox',
      data.priority || 'Medium',
      data.status || 'todo',
      data.source || '',
      data.due_date || null,
      data.estimated_hours || null,
      data.actual_hours || null,
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
     SET title=$1, description=$2, category=$3, priority=$4, status=$5, 
         source=$6, due_date=$7, estimated_hours=$8, actual_hours=$9, updated_at=NOW()
     WHERE id=$10
     RETURNING id, title, description, category, priority, status, source, created_at, updated_at, due_date, estimated_hours, actual_hours`,
    [
      updated.title,
      updated.description,
      updated.category,
      updated.priority,
      updated.status,
      updated.source,
      updated.due_date || null,
      updated.estimated_hours || null,
      updated.actual_hours || null,
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
    `SELECT id, title, description, category, priority, status, source, created_at, updated_at, due_date, estimated_hours, actual_hours
     FROM tasks 
     WHERE due_date IS NOT NULL 
       AND due_date >= $1 
       AND due_date <= $2
     ORDER BY due_date ASC, 
       CASE priority 
         WHEN 'Urgent' THEN 0 
         WHEN 'High' THEN 1 
         WHEN 'Medium' THEN 2 
         WHEN 'Low' THEN 3 
       END`,
    [startDate, endDate]
  );
  return result.rows;
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
  
  const tokensResult = await pool.query('SELECT SUM(tokens_used) as sum FROM activities WHERE tokens_used IS NOT NULL');
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
// SEARCH
// ============================================================

export type SearchResult = Task & {
  rank: number;
};

export async function searchTasks(query: string, limit: number = 10): Promise<SearchResult[]> {
  await initDb();
  
  const result = await pool.query(
    `SELECT 
       id, title, description, category, priority, status, source, 
       created_at, updated_at, due_date, estimated_hours, actual_hours,
       ts_rank(search_vector, to_tsquery('english', $1)) as rank
     FROM tasks
     WHERE search_vector @@ to_tsquery('english', $1)
     ORDER BY rank DESC
     LIMIT $2`,
    [query.split(' ').join(' & '), limit]
  );
  
  return result.rows;
}
