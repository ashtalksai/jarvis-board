'use client';

import { useState, useEffect, useCallback } from 'react';
import Board from '@/components/Board';
import AddTaskForm from '@/components/AddTaskForm';
import TaskModal from '@/components/TaskModal';

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

const CATEGORIES = ['All', 'Learnings', 'Polymarket', 'Side Projects', 'Stravix', 'Coding', 'Workflow'];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterCategory !== 'All') params.set('category', filterCategory);
    if (searchQuery) params.set('search', searchQuery);
    const res = await fetch(`/api/tasks?${params}`);
    const data = await res.json();
    setTasks(data);
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
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="border-b px-4 sm:px-6 py-4" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'var(--accent)' }}>J</div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Jarvis Board</h1>
            <a 
              href="/activities"
              className="ml-2 px-2.5 py-1 rounded-md text-xs font-medium transition-colors hover:opacity-80"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              📊 Activity
            </a>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-md text-sm border outline-none focus:ring-1 sm:w-64"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            />

            {/* Category filter */}
            <div className="flex gap-1 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                  style={{
                    background: filterCategory === cat ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: filterCategory === cat ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Add button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 rounded-md text-sm font-medium sm:ml-auto shrink-0"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              + Add Task
            </button>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="p-4 sm:p-6 max-w-[1600px] mx-auto">
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
