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
    INSERT INTO tasks (title, description, category, priority, status, source)
    VALUES (@title, @description, @category, @priority, @status, @source)
  `);
  const result = stmt.run({
    title: data.title || 'Untitled',
    description: data.description || '',
    category: data.category || 'Inbox',
    priority: data.priority || 'Medium',
    status: data.status || 'todo',
    source: data.source || '',
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
    priority=@priority, status=@status, source=@source, updated_at=@updated_at
    WHERE id=@id
  `).run(updated);
  return getTaskById(id);
}

export function deleteTask(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}
