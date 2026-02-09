'use client';

import { DndContext, DragEndEvent, DragStartEvent, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useState } from 'react';
import Column from './Column';
import TaskCard from './TaskCard';
import type { Task } from '@/app/page';

type Props = {
  tasks: Task[];
  onStatusChange: (taskId: number, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
};

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', icon: '📥' },
  { id: 'doing', title: 'Doing', icon: '⚡' },
  { id: 'review', title: 'Review', icon: '👀' },
  { id: 'on_hold', title: 'On Hold', icon: '⏸' },
  { id: 'done', title: 'Done', icon: '✓' },
  { id: 'archived', title: 'Archived', icon: '📦' },
];

export default function Board({ tasks, onStatusChange, onTaskClick }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === Number(event.active.id));
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = Number(active.id);
    const overId = String(over.id);

    // Determine target status
    let targetStatus: string | null = null;
    if (COLUMNS.some((c) => c.id === overId)) {
      targetStatus = overId;
    } else {
      const overTask = tasks.find((t) => t.id === Number(overId));
      if (overTask) targetStatus = overTask.status;
    }

    if (targetStatus) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetStatus) {
        onStatusChange(taskId, targetStatus);
      }
    }
  };

  // Filter out archived tasks from main view unless viewing archived column
  const visibleTasks = tasks;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 h-full">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            title={col.title}
            icon={col.icon}
            tasks={visibleTasks.filter((t) => t.status === col.id)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} onClick={() => {}} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
