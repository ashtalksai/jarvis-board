'use client';

import { useDraggable } from '@dnd-kit/core';
import type { Task } from '@/app/page';

type Props = {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
};

const priorityColors: Record<string, string> = {
  Urgent: 'var(--urgent)',
  High: 'var(--high)',
  Medium: 'var(--medium)',
  Low: 'var(--low)',
};

const categoryColors: Record<string, string> = {
  Learnings: '#8b5cf6',
  Polymarket: '#06b6d4',
  'Side Projects': '#10b981',
  Stravix: '#f59e0b',
  Coding: '#ec4899',
  Workflow: '#6366f1',
};

export default function TaskCard({ task, onClick, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        ...style,
        background: 'var(--bg-tertiary)',
        borderColor: 'var(--border)',
        opacity: isDragging ? 0.8 : 1,
      }}
      className="task-card rounded-lg border p-3 cursor-grab active:cursor-grabbing"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('[data-no-click]')) onClick();
      }}
    >
      {/* Priority indicator + Title */}
      <div className="flex items-start gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
          style={{ background: priorityColors[task.priority] || 'var(--low)' }}
        />
        <h3 className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
          {task.title}
        </h3>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{
            background: `${categoryColors[task.category] || 'var(--accent)'}20`,
            color: categoryColors[task.category] || 'var(--accent)',
          }}
        >
          {task.category}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {task.priority}
        </span>
        {task.source && (
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>🔗</span>
        )}
      </div>
    </div>
  );
}
