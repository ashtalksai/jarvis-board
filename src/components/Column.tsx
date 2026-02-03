'use client';

import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import type { Task } from '@/app/page';

type Props = {
  id: string;
  title: string;
  emoji: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
};

export default function Column({ id, title, emoji, tasks, onTaskClick }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl border min-h-[300px] flex flex-col"
      style={{
        background: isOver ? 'var(--bg-hover)' : 'var(--bg-secondary)',
        borderColor: isOver ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
        <span>{emoji}</span>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
          {tasks.length}
        </span>
      </div>
      <div className="p-2 flex flex-col gap-2 flex-1">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
