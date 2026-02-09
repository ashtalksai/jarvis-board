#!/usr/bin/env node

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'jarvis.db');
const MIGRATION_FILE = path.join(__dirname, '001_add_calendar_fields.sql');

console.log('Running migration...');
console.log('Database:', DB_PATH);
console.log('Migration:', MIGRATION_FILE);

const db = new Database(DB_PATH);
const migration = fs.readFileSync(MIGRATION_FILE, 'utf-8');

try {
  db.exec(migration);
  console.log('✅ Migration completed successfully');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⚠️  Columns already exist, skipping migration');
  } else {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
} finally {
  db.close();
}
