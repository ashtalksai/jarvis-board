import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'jarvis.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'Inbox',
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'todo',
        source TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Activities table
    db.exec(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        details TEXT,
        session_id TEXT,
        tokens_used INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Create indices if they don't exist
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_activities_action ON activities(action);
      CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);
      CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
    `);

    // Create FTS5 virtual table for full-text search
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
        title,
        description,
        category,
        content='tasks',
        content_rowid='id'
      )
    `);

    // Triggers to keep FTS index in sync
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS tasks_ai AFTER INSERT ON tasks BEGIN
        INSERT INTO tasks_fts(rowid, title, description, category)
        VALUES (new.id, new.title, new.description, new.category);
      END
    `);

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS tasks_ad AFTER DELETE ON tasks BEGIN
        INSERT INTO tasks_fts(tasks_fts, rowid, title, description, category)
        VALUES('delete', old.id, old.title, old.description, old.category);
      END
    `);

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS tasks_au AFTER UPDATE ON tasks BEGIN
        INSERT INTO tasks_fts(tasks_fts, rowid, title, description, category)
        VALUES('delete', old.id, old.title, old.description, old.category);
        INSERT INTO tasks_fts(rowid, title, description, category)
        VALUES (new.id, new.title, new.description, new.category);
      END
    `);

  }
  return db;
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

export function getAllTasks(status?: string, category?: string, search?: string): Task[] {
  const db = getDb();
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: Record<string, string> = {};

  if (status) {
    query += ' AND status = @status';
    params.status = status;
  }
  if (category) {
    query += ' AND category = @category';
    params.category = category;
  }
  if (search) {
    query += ' AND (title LIKE @search OR description LIKE @search)';
    params.search = `%${search}%`;
  }

  query += ' ORDER BY CASE priority WHEN \'Urgent\' THEN 0 WHEN \'High\' THEN 1 WHEN \'Medium\' THEN 2 WHEN \'Low\' THEN 3 END, updated_at DESC';

  return db.prepare(query).all(params) as Task[];
}

export function getTaskById(id: number): Task | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
}

export function createTask(data: Partial<Task>): Task {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, category, priority, status, source, due_date, estimated_hours, actual_hours)
    VALUES (@title, @description, @category, @priority, @status, @source, @due_date, @estimated_hours, @actual_hours)
  `);
  const result = stmt.run({
    title: data.title || 'Untitled',
    description: data.description || '',
    category: data.category || 'Inbox',
    priority: data.priority || 'Medium',
    status: data.status || 'todo',
    source: data.source || '',
    due_date: data.due_date || null,
    estimated_hours: data.estimated_hours || null,
    actual_hours: data.actual_hours || null,
  });
  return getTaskById(result.lastInsertRowid as number)!;
}

export function updateTask(id: number, data: Partial<Task>): Task | undefined {
  const db = getDb();
  const existing = getTaskById(id);
  if (!existing) return undefined;

  const updated = { ...existing, ...data, updated_at: new Date().toISOString().replace('T', ' ').split('.')[0] };
  db.prepare(`
    UPDATE tasks SET title=@title, description=@description, category=@category,
    priority=@priority, status=@status, source=@source, updated_at=@updated_at,
    due_date=@due_date, estimated_hours=@estimated_hours, actual_hours=@actual_hours
    WHERE id=@id
  `).run(updated);
  return getTaskById(id);
}

export function deleteTask(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}

<<<<<<< HEAD
export function getTasksByDateRange(startDate: string, endDate: string): Task[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM tasks 
    WHERE due_date IS NOT NULL 
    AND due_date >= @startDate 
    AND due_date <= @endDate
    ORDER BY due_date ASC, 
    CASE priority WHEN 'Urgent' THEN 0 WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END
  `).all({ startDate, endDate }) as Task[];
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

export function createActivity(data: ActivityInput): Activity {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO activities (action, entity_type, entity_id, details, session_id, tokens_used)
    VALUES (@action, @entity_type, @entity_id, @details, @session_id, @tokens_used)
  `);
  
  const result = stmt.run({
    action: data.action,
    entity_type: data.entity_type || null,
    entity_id: data.entity_id || null,
    details: data.details ? JSON.stringify(data.details) : null,
    session_id: data.session_id || null,
    tokens_used: data.tokens_used || null,
  });
  
  return db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid) as Activity;
}

export function getActivities(filters: ActivityFilters = {}): Activity[] {
  const db = getDb();
  let query = 'SELECT * FROM activities WHERE 1=1';
  const params: Record<string, any> = {};

  if (filters.action) {
    query += ' AND action = @action';
    params.action = filters.action;
  }
  if (filters.entity_type) {
    query += ' AND entity_type = @entity_type';
    params.entity_type = filters.entity_type;
  }
  if (filters.entity_id) {
    query += ' AND entity_id = @entity_id';
    params.entity_id = filters.entity_id;
  }
  if (filters.start_date) {
    query += ' AND created_at >= @start_date';
    params.start_date = filters.start_date;
  }
  if (filters.end_date) {
    query += ' AND created_at <= @end_date';
    params.end_date = filters.end_date;
  }

  query += ' ORDER BY created_at DESC';

  if (filters.limit) {
    query += ' LIMIT @limit';
    params.limit = filters.limit;
  }
  if (filters.offset) {
    query += ' OFFSET @offset';
    params.offset = filters.offset;
  }

  return db.prepare(query).all(params) as Activity[];
}

export function getActivityStats(): {
  total_activities: number;
  total_tokens: number;
  by_action: Record<string, number>;
  by_entity_type: Record<string, number>;
  recent_24h: number;
} {
  const db = getDb();
  
  const total = db.prepare('SELECT COUNT(*) as count FROM activities').get() as { count: number };
  const totalTokens = db.prepare('SELECT SUM(tokens_used) as sum FROM activities WHERE tokens_used IS NOT NULL').get() as { sum: number | null };
  
  const byAction = db.prepare('SELECT action, COUNT(*) as count FROM activities GROUP BY action').all() as Array<{ action: string; count: number }>;
  const byEntityType = db.prepare('SELECT entity_type, COUNT(*) as count FROM activities WHERE entity_type IS NOT NULL GROUP BY entity_type').all() as Array<{ entity_type: string; count: number }>;
  
  const recent24h = db.prepare("SELECT COUNT(*) as count FROM activities WHERE created_at >= datetime('now', '-1 day')").get() as { count: number };
  
  return {
    total_activities: total.count,
    total_tokens: totalTokens.sum || 0,
    by_action: Object.fromEntries(byAction.map(row => [row.action, row.count])),
    by_entity_type: Object.fromEntries(byEntityType.map(row => [row.entity_type, row.count])),
    recent_24h: recent24h.count,
  };
}

// ============================================================
// SEARCH
// ============================================================

export type SearchResult = Task & {
  rank: number;
};

export function searchTasks(query: string, limit: number = 10): SearchResult[] {
  const db = getDb();
  // Use FTS5 for full-text search with ranking
  const results = db.prepare(`
    SELECT tasks.*, tasks_fts.rank
    FROM tasks_fts
    JOIN tasks ON tasks.id = tasks_fts.rowid
    WHERE tasks_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(query, limit) as SearchResult[];
  
  return results;
}
