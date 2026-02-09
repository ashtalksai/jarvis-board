'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Task } from '@/app/page';

type Comment = {
  id: number;
  task_id: number;
  author: string;
  content: string;
  created_at: string;
};

type Props = {
  task: Task;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<Task>) => void;
  onDelete: (id: number) => void;
  onRefresh?: () => void;
};

const CATEGORIES = ['Inbox', 'Learnings', 'Polymarket', 'Side Projects', 'Stravix', 'Coding', 'Workflow'];
const PRIORITIES = [
  { value: 1, label: 'Low (1)' },
  { value: 2, label: 'Medium (2)' },
  { value: 3, label: 'High (3)' },
  { value: 4, label: 'ASAP (🔥)' },
];
const STATUSES = ['backlog', 'doing', 'review', 'on_hold', 'done', 'archived'];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function highlightMentions(text: string): React.ReactNode {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.match(/^@\w+$/)) {
      return <span key={i} className="mention">{part}</span>;
    }
    return part;
  });
}

export default function TaskModal({ task, onClose, onUpdate, onDelete, onRefresh }: Props) {
  const [editing, setEditing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
    category: task.category,
    priority_level: task.priority_level || 2,
    status: task.status,
    source: task.source,
    due_date: task.due_date?.split('T')[0] || '',
    eta: task.eta?.split('T')[0] || '',
    estimated_hours: task.estimated_hours || '',
    actual_hours: task.actual_hours || '',
    tags: (task.tags || []).join(', '),
  });

  // Fetch comments
  useEffect(() => {
    fetchComments();
    markAsSeen();
  }, [task.id]);

  const fetchComments = async () => {
    const res = await fetch(`/api/tasks/${task.id}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
  };

  const markAsSeen = async () => {
    await fetch(`/api/tasks/${task.id}/seen`, { method: 'POST' });
    onRefresh?.();
  };

  const handleSave = () => {
    const tagsArray = form.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    
    const updates = {
      title: form.title,
      description: form.description,
      category: form.category,
      priority_level: Number(form.priority_level),
      status: form.status,
      source: form.source,
      due_date: form.due_date || undefined,
      eta: form.eta || undefined,
      estimated_hours: form.estimated_hours === '' ? undefined : Number(form.estimated_hours),
      actual_hours: form.actual_hours === '' ? undefined : Number(form.actual_hours),
      tags: tagsArray,
    } as Partial<Task>;
    
    onUpdate(task.id, updates);
    setEditing(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, author: 'ash' }),
      });
      
      if (res.ok) {
        setNewComment('');
        await fetchComments();
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityLabel = (level: number) => {
    switch (level) {
      case 4: return '🔥 ASAP';
      case 3: return '3 High';
      case 2: return '2 Medium';
      default: return '1 Low';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header with terminal dots */}
        <div className="modal-header">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="window-dots shrink-0">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            
            {editing ? (
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input flex-1"
                placeholder="Task title..."
              />
            ) : (
              <h2 
                className="text-lg font-semibold truncate" 
                style={{ color: 'var(--text-primary)' }}
              >
                {task.title}
              </h2>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="btn ml-4 shrink-0"
            style={{ padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-6">
          {/* Status / Priority / Category row */}
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
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
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <span className={`status-badge status-${task.status}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className={`priority-badge priority-${task.priority_level || 2}`}>
                {getPriorityLabel(task.priority_level || 2)}
              </span>
              <span 
                className="tag-pill"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                {task.category}
              </span>
            </div>
          )}

          {/* Tags */}
          {editing ? (
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Tags (comma-separated)
              </label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="bug, feature, research..."
                className="input"
              />
            </div>
          ) : task.tags && task.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {task.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="tag-pill"
                  style={{ background: 'rgba(217, 145, 120, 0.15)', color: 'var(--primary)' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Dates row */}
          {editing ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  ETA
                </label>
                <input
                  type="date"
                  value={form.eta}
                  onChange={(e) => setForm({ ...form, eta: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Est. Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.estimated_hours}
                  onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })}
                  placeholder="0"
                  className="input"
                />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Actual Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.actual_hours}
                  onChange={(e) => setForm({ ...form, actual_hours: e.target.value })}
                  placeholder="0"
                  className="input"
                />
              </div>
            </div>
          ) : (task.due_date || task.eta || task.estimated_hours || task.actual_hours) && (
            <div className="flex gap-4 flex-wrap text-sm" style={{ color: 'var(--text-muted)' }}>
              {task.due_date && (
                <span className="flex items-center gap-1">
                  <span>📅</span> Due: {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
              {task.eta && (
                <span className="flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                  <span>🎯</span> ETA: {new Date(task.eta).toLocaleDateString()}
                </span>
              )}
              {task.estimated_hours && (
                <span className="flex items-center gap-1">
                  <span>⏱</span> Est: {task.estimated_hours}h
                </span>
              )}
              {task.actual_hours && (
                <span className="flex items-center gap-1">
                  <span>✓</span> Actual: {task.actual_hours}h
                </span>
              )}
            </div>
          )}

          {/* Source */}
          {editing ? (
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Source URL
              </label>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="https://..."
                className="input"
              />
            </div>
          ) : task.source && (
            <a 
              href={task.source} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm inline-flex items-center gap-1.5 hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              🔗 {task.source.length > 50 ? task.source.slice(0, 50) + '...' : task.source}
            </a>
          )}

          {/* Description */}
          {editing ? (
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Description (Markdown)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={8}
                className="input"
                placeholder="Task description..."
              />
            </div>
          ) : (
            <div className="prose">
              {task.description ? (
                <ReactMarkdown>{task.description}</ReactMarkdown>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No description
                </p>
              )}
            </div>
          )}

          {/* Meta dates */}
          <div 
            className="text-xs flex gap-4 pt-2 border-t" 
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
          >
            <span>Created: {formatDate(task.created_at)}</span>
            <span>Updated: {formatDate(task.updated_at)}</span>
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <h3 
              className="text-sm font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <span className="cmd-prefix">$</span> comments
              <span 
                className="text-xs font-normal px-2 py-0.5 rounded"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
              >
                {comments.length}
              </span>
            </h3>

            {/* Comments list */}
            <div className="space-y-0 max-h-64 overflow-y-auto mb-4">
              {comments.length === 0 ? (
                <p 
                  className="text-sm py-4 text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No comments yet
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="comment">
                    <div className={`comment-avatar ${comment.author}`}>
                      {comment.author === 'ash' ? 'A' : 'J'}
                    </div>
                    <div className="comment-content">
                      <div className="comment-meta">
                        <span className="comment-author">
                          @{comment.author}
                        </span>
                        <span className="comment-time">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <div className="comment-text">
                        {highlightMentions(comment.content)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Add comment form */}
            <div className="flex gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment... (use @ash or @jarvis to mention)"
                rows={2}
                className="input flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleAddComment();
                  }
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
                className="btn btn-primary self-end"
                style={{ opacity: !newComment.trim() || submitting ? 0.5 : 1 }}
              >
                {submitting ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={() => { if (confirm('Delete this task?')) onDelete(task.id); }}
            className="btn btn-danger"
          >
            Delete
          </button>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn btn-primary">
                  Save
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn btn-primary">
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
