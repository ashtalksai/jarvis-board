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
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header 
        className="shrink-0 z-40 border-b px-3 sm:px-4 h-12 sm:h-14 flex items-center"
        style={{ 
          borderColor: 'var(--border)',
          background: 'rgba(10, 10, 10, 0.95)',
        }}
      >
        <div className="max-w-[1800px] mx-auto w-full flex items-center gap-2 sm:gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="logo text-sm sm:text-base">J</div>
            <h1 
              className="text-sm sm:text-base font-semibold hidden sm:flex items-center gap-2" 
              style={{ color: 'var(--text-primary)' }}
            >
              <span className="cmd-prefix">$</span>
              <span>jarvis-board</span>
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount}</span>
              )}
            </h1>
          </div>

          {/* View Navigation */}
          <div className="flex gap-1 sm:gap-2 shrink-0">
            <Link href="/" className="nav-link active text-xs sm:text-sm">
              Board
            </Link>
            <Link href="/calendar" className="nav-link text-xs sm:text-sm">
              Calendar
            </Link>
            <Link href="/activities" className="nav-link text-xs sm:text-sm hidden sm:block">
              Activity
            </Link>
          </div>

          {/* Search - hidden on mobile */}
          <div className="relative w-48 shrink-0 hidden lg:block">
            <input
              type="text"
              placeholder="search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pr-10 py-1.5 text-sm"
            />
            <kbd 
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.5 text-[9px] rounded border"
              style={{ 
                background: 'var(--bg-tertiary)', 
                borderColor: 'var(--border)', 
                color: 'var(--text-muted)' 
              }}
            >
              ⌘K
            </kbd>
          </div>

          {/* Category filter - hidden on mobile */}
          <div className="flex-1 overflow-x-auto hide-scrollbar hidden md:block">
            <div className="flex gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`nav-link shrink-0 ${filterCategory === cat ? 'active' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Spacer on mobile */}
          <div className="flex-1 md:hidden" />

          {/* Add button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary shrink-0 text-xs sm:text-sm py-1.5 px-2 sm:px-3"
          >
            <span className="cmd-prefix">+</span> <span className="hidden sm:inline">add</span>
          </button>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 p-3 sm:p-6 max-w-[1800px] mx-auto w-full overflow-hidden">
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
