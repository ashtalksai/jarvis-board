'use client';

import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import type { Task } from '@/app/page';

type Props = {
  id: string;
  title: string;
  icon: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
};

export default function Column({ id, title, icon, tasks, onTaskClick }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id });

  // Count unread tasks
  const unreadCount = tasks.filter(t => t.has_unread).length;

  return (
    <div
      ref={setNodeRef}
      className={`terminal-window flex flex-col h-full min-h-0 w-[85vw] sm:w-auto shrink-0 sm:shrink snap-center ${isOver ? 'drag-over' : ''}`}
      style={{
        borderColor: isOver ? 'var(--primary)' : undefined,
        background: isOver ? 'var(--bg-hover)' : undefined,
      }}
    >
      {/* Terminal window header */}
      <div className="window-header">
        <div className="window-dots">
          <span className="window-dot red" />
          <span className="window-dot yellow" />
          <span className="window-dot green" />
        </div>
        <span className="window-title flex items-center gap-2">
          <span>{icon}</span>
          <span>{title}</span>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </span>
        <span className="window-status">{tasks.length}</span>
      </div>
      
      {/* Tasks container */}
      <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto min-h-0">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onClick={() => onTaskClick(task)} 
          />
        ))}
        {tasks.length === 0 && (
          <div 
            className="flex-1 flex items-center justify-center text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="cmd-prefix">$</span>
            <span className="ml-1">empty</span>
          </div>
        )}
      </div>
    </div>
  );
}
