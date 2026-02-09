'use client';

import { useState, useEffect } from 'react';
import type { Task } from '@/app/page';

type ViewMode = 'week' | 'month';

export default function CalendarView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [currentDate, viewMode]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      const response = await fetch(`/api/tasks/calendar?start=${start}&end=${end}`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Failed to load calendar tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end.setDate(start.getDate() + 6);
    } else {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    const days = [];
    
    // Add days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Add days from next month to complete the grid
    const remaining = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      const dueMatch = task.due_date?.startsWith(dateStr);
      const etaMatch = task.eta?.startsWith(dateStr);
      return dueMatch || etaMatch;
    }).map(task => ({
      ...task,
      isEta: task.eta?.startsWith(dateStr) && !task.due_date?.startsWith(dateStr),
      isDue: task.due_date?.startsWith(dateStr),
    }));
  };

  const formatDateHeader = () => {
    if (viewMode === 'week') {
      const weekDays = getWeekDays();
      return `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getPriorityLabel = (level: number) => {
    switch (level) {
      case 4: return '🔥';
      case 3: return '3';
      case 2: return '2';
      default: return '1';
    }
  };

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Header Controls */}
      <div className="terminal-window mb-6">
        <div className="window-header">
          <div className="window-dots">
            <span className="window-dot red" />
            <span className="window-dot yellow" />
            <span className="window-dot green" />
          </div>
          <span className="window-title">calendar-view</span>
          <span className="window-status">{formatDateHeader()}</span>
        </div>
        
        <div className="window-content">
          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('week')}
                className={`nav-link ${viewMode === 'week' ? 'active' : ''}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`nav-link ${viewMode === 'month' ? 'active' : ''}`}
              >
                Month
              </button>
            </div>

            {/* Navigation */}
            <div className="flex gap-1">
              <button onClick={navigatePrevious} className="btn">
                ←
              </button>
              <button onClick={navigateToday} className="btn">
                Today
              </button>
              <button onClick={navigateNext} className="btn">
                →
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'rgba(217, 145, 120, 0.3)', borderLeft: '2px solid var(--primary)' }} />
                <span>ETA (Jarvis work)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'rgba(239, 68, 68, 0.3)', borderLeft: '2px solid var(--danger)' }} />
                <span>Due date</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <span className="cmd-prefix">$</span> loading calendar...
        </div>
      )}

      {/* Week View */}
      {!isLoading && viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {weekDays.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const today = isToday(date);
            
            return (
              <div
                key={index}
                className={`calendar-day rounded-lg ${today ? 'today' : ''}`}
              >
                {/* Day header */}
                <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div 
                    className="text-xs font-medium"
                    style={{ color: today ? 'var(--primary)' : 'var(--text-muted)' }}
                  >
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div 
                    className="text-lg font-bold"
                    style={{ color: today ? 'var(--primary)' : 'var(--text-primary)' }}
                  >
                    {date.getDate()}
                  </div>
                </div>
                
                {/* Tasks */}
                <div className="p-1 space-y-1">
                  {dayTasks.map((task: any) => (
                    <button
                      key={`${task.id}-${task.isEta ? 'eta' : 'due'}`}
                      onClick={() => setSelectedTask(task)}
                      className={`calendar-task w-full text-left ${task.isEta ? 'eta' : 'due'}`}
                    >
                      <span className="priority-badge mr-1" style={{ padding: '1px 4px', fontSize: '0.65rem' }}>
                        {getPriorityLabel(task.priority_level || 2)}
                      </span>
                      {task.title.length > 20 ? task.title.slice(0, 20) + '...' : task.title}
                    </button>
                  ))}
                  
                  {dayTasks.length === 0 && (
                    <div 
                      className="text-[10px] text-center py-4"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      —
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {!isLoading && viewMode === 'month' && (
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div 
                key={day} 
                className="text-center text-xs font-medium py-2"
                style={{ color: 'var(--text-muted)' }}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map(({ date, isCurrentMonth }, index) => {
              const dayTasks = getTasksForDate(date);
              const today = isToday(date);
              
              return (
                <div
                  key={index}
                  className={`calendar-day rounded-lg min-h-[80px] ${today ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                >
                  <div 
                    className="text-xs font-medium p-1"
                    style={{ color: today ? 'var(--primary)' : isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {date.getDate()}
                  </div>
                  
                  <div className="px-1 space-y-0.5">
                    {dayTasks.slice(0, 3).map((task: any) => (
                      <button
                        key={`${task.id}-${task.isEta ? 'eta' : 'due'}`}
                        onClick={() => setSelectedTask(task)}
                        className={`calendar-task w-full text-left ${task.isEta ? 'eta' : 'due'}`}
                        style={{ fontSize: '0.65rem', padding: '2px 4px' }}
                      >
                        {task.title.length > 15 ? task.title.slice(0, 15) + '...' : task.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <div 
                        className="text-[10px] text-center"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div 
            className="modal-content animate-fade-in"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="window-dots">
                  <span className="window-dot red" />
                  <span className="window-dot yellow" />
                  <span className="window-dot green" />
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {selectedTask.title}
                </h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="btn" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>
            
            <div className="modal-body space-y-4">
              {/* Status & Priority */}
              <div className="flex gap-2 flex-wrap">
                <span className={`status-badge status-${selectedTask.status}`}>
                  {selectedTask.status.replace('_', ' ')}
                </span>
                <span className={`priority-badge priority-${selectedTask.priority_level || 2}`}>
                  {getPriorityLabel(selectedTask.priority_level || 2)}
                </span>
                <span 
                  className="tag-pill"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  {selectedTask.category}
                </span>
              </div>
              
              {/* Dates */}
              <div className="space-y-2 text-sm">
                {selectedTask.eta && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                    <span>🎯</span>
                    <span>ETA: {new Date(selectedTask.eta).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedTask.due_date && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--danger)' }}>
                    <span>📅</span>
                    <span>Due: {new Date(selectedTask.due_date).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedTask.estimated_hours && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <span>⏱</span>
                    <span>Estimated: {selectedTask.estimated_hours}h</span>
                  </div>
                )}
              </div>
              
              {/* Description */}
              {selectedTask.description && (
                <div 
                  className="text-sm p-3 rounded-lg"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  {selectedTask.description}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div />
              <button onClick={() => setSelectedTask(null)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
