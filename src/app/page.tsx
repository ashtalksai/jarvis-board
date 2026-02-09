'use client';

import { useState, useEffect, useCallback } from 'react';
import Board from '@/components/Board';
import AddTaskForm from '@/components/AddTaskForm';
import TaskModal from '@/components/TaskModal';
import Link from 'next/link';

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
  due_date?: string;
  eta?: string;
  estimated_hours?: number;
  actual_hours?: number;
  last_activity_at?: string;
  tags?: string[];
  has_unread?: boolean;
};

const CATEGORIES = ['All', 'Inbox', 'Learnings', 'Polymarket', 'Side Projects', 'Stravix', 'Coding', 'Workflow'];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterCategory !== 'All') params.set('category', filterCategory);
    if (searchQuery) params.set('search', searchQuery);
    const res = await fetch(`/api/tasks?${params}`);
    const data = await res.json();
    setTasks(data);
    
    // Count unread
    const unread = data.filter((t: Task) => t.has_unread).length;
    setUnreadCount(unread);
  }, [filterCategory, searchQuery]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  const handleTaskUpdate = async (taskId: number, data: Partial<Task>) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchTasks();
    setSelectedTask(null);
  };

  const handleDelete = async (taskId: number) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    fetchTasks();
    setSelectedTask(null);
  };

  const handleCreate = async (data: Partial<Task>) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchTasks();
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-40 border-b px-4 py-3"
        style={{ 
          borderColor: 'var(--border)',
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="logo">J</div>
            <div>
              <h1 
                className="text-base font-semibold flex items-center gap-2" 
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="cmd-prefix">$</span>
                <span>jarvis-board</span>
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* View Navigation */}
            <div className="flex gap-2">
              <Link href="/" className="nav-link active">
                Board
              </Link>
              <Link href="/calendar" className="nav-link">
                Calendar
              </Link>
              <Link href="/activities" className="nav-link">
                Activity
              </Link>
            </div>

            {/* Search */}
            <div className="relative sm:w-64">
              <input
                type="text"
                placeholder="search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pr-16"
              />
              <kbd 
                className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] rounded border"
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  borderColor: 'var(--border)', 
                  color: 'var(--text-muted)' 
                }}
              >
                ⌘K
              </kbd>
            </div>

            {/* Category filter */}
            <div className="flex gap-1 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`nav-link ${filterCategory === cat ? 'active' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Add button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary sm:ml-auto shrink-0"
            >
              <span className="cmd-prefix">+</span> add task
            </button>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1800px] mx-auto w-full overflow-x-auto">
        <Board
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onTaskClick={setSelectedTask}
        />
      </main>

      {/* Modals */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleDelete}
          onRefresh={fetchTasks}
        />
      )}
      {showAddForm && (
        <AddTaskForm
          onClose={() => setShowAddForm(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
