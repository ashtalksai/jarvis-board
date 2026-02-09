'use client';

import { useState } from 'react';
import type { Task } from '@/app/page';

type Props = {
  onClose: () => void;
  onCreate: (data: Partial<Task>) => void;
};

const CATEGORIES = ['Inbox', 'Learnings', 'Polymarket', 'Side Projects', 'Stravix', 'Coding', 'Workflow'];
const PRIORITIES = [
  { value: 1, label: 'Low (1)' },
  { value: 2, label: 'Medium (2)' },
  { value: 3, label: 'High (3)' },
  { value: 4, label: 'ASAP (🔥)' },
];
const STATUSES = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'doing', label: 'Doing' },
  { value: 'review', label: 'Review' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'done', label: 'Done' },
];

export default function AddTaskForm({ onClose, onCreate }: Props) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Inbox',
    priority_level: 2,
    status: 'backlog',
    source: '',
    due_date: '',
    eta: '',
    tags: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    const tagsArray = form.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    
    onCreate({
      ...form,
      priority_level: Number(form.priority_level),
      due_date: form.due_date || undefined,
      eta: form.eta || undefined,
      tags: tagsArray,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-fade-in" 
        style={{ maxWidth: '600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with terminal dots */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              <span className="cmd-prefix">$</span> new task
            </h2>
          </div>
          <button onClick={onClose} className="btn" style={{ padding: '4px 8px' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Title *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="Task title..."
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="input"
                placeholder="Markdown supported..."
              />
            </div>

            {/* Category / Priority / Status row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Category
                </label>
                <select 
                  value={form.category} 
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Priority
                </label>
                <select 
                  value={form.priority_level} 
                  onChange={(e) => setForm({ ...form, priority_level: Number(e.target.value) })}
                  className="input"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Status
                </label>
                <select 
                  value={form.status} 
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  ETA (when Jarvis will work on it)
                </label>
                <input
                  type="date"
                  value={form.eta}
                  onChange={(e) => setForm({ ...form, eta: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Tags (comma-separated)
              </label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="input"
                placeholder="bug, feature, research..."
              />
            </div>

            {/* Source */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Source URL
              </label>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="input"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div /> {/* Spacer */}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn">
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!form.title.trim()}
                style={{ opacity: form.title.trim() ? 1 : 0.5 }}
              >
                <span className="cmd-prefix">+</span> Create
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
