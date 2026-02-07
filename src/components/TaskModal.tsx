'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Task } from '@/app/page';

type Props = {
  task: Task;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<Task>) => void;
  onDelete: (id: number) => void;
};

const CATEGORIES = ['Learnings', 'Polymarket', 'Side Projects', 'Stravix', 'Coding', 'Workflow'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['todo', 'doing', 'review', 'on_hold', 'done'];

export default function TaskModal({ task, onClose, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    status: task.status,
    source: task.source,
    due_date: task.due_date || '',
    estimated_hours: task.estimated_hours || '',
    actual_hours: task.actual_hours || '',
  });

  const handleSave = () => {
    onUpdate(task.id, form);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          {editing ? (
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="text-lg font-semibold bg-transparent border-b outline-none flex-1 mr-4"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--accent)' }}
            />
          ) : (
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{task.title}</h2>
          )}
          <button onClick={onClose} className="text-lg shrink-0" style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Status / Priority / Category */}
          {editing ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-md text-sm border outline-none"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-md text-sm border outline-none"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-md text-sm border outline-none"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {task.status.replace('_', ' ')}
              </span>
              <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {task.priority}
              </span>
              <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {task.category}
              </span>
            </div>
          )}

          {/* Source */}
          {editing ? (
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Source URL</label>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-1.5 rounded-md text-sm border outline-none"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          ) : task.source ? (
            <a href={task.source} target="_blank" rel="noopener noreferrer"
              className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--accent)' }}>
              🔗 {task.source.length > 50 ? task.source.slice(0, 50) + '...' : task.source}
            </a>
          ) : null}

          {/* Calendar Fields */}
          {editing ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-md text-sm border outline-none"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Est. Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.estimated_hours}
                  onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })}
                  placeholder="0"
                  className="w-full px-2 py-1.5 rounded-md text-sm border outline-none"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Actual Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.actual_hours}
                  onChange={(e) => setForm({ ...form, actual_hours: e.target.value })}
                  placeholder="0"
                  className="w-full px-2 py-1.5 rounded-md text-sm border outline-none"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          ) : (task.due_date || task.estimated_hours || task.actual_hours) ? (
            <div className="flex gap-2 flex-wrap text-xs" style={{ color: 'var(--text-muted)' }}>
              {task.due_date && <span>📅 Due: {new Date(task.due_date).toLocaleDateString()}</span>}
              {task.estimated_hours && <span>⏱️ Est: {task.estimated_hours}h</span>}
              {task.actual_hours && <span>✓ Actual: {task.actual_hours}h</span>}
            </div>
          ) : null}

          {/* Description */}
          {editing ? (
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Description (Markdown)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 rounded-md text-sm border outline-none resize-y"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-sm" style={{ color: 'var(--text-secondary)' }}>
              {task.description ? (
                <ReactMarkdown>{task.description}</ReactMarkdown>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No description</p>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="text-xs flex gap-4" style={{ color: 'var(--text-muted)' }}>
            <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
            <span>Updated: {new Date(task.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => { if (confirm('Delete this task?')) onDelete(task.id); }}
            className="px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: '#ef444420', color: '#ef4444' }}
          >
            Delete
          </button>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-md text-xs"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
                <button onClick={handleSave} className="px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{ background: 'var(--accent)', color: '#fff' }}>Save</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ background: 'var(--accent)', color: '#fff' }}>Edit</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
