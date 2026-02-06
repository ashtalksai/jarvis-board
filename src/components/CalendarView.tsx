'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/db';

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
      // Get Monday of current week
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end.setDate(start.getDate() + 6);
    } else {
      // Get first and last day of month
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

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => task.due_date?.startsWith(dateStr));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-500 dark:bg-red-600';
      case 'High': return 'bg-orange-500 dark:bg-orange-600';
      case 'Medium': return 'bg-blue-500 dark:bg-blue-600';
      case 'Low': return 'bg-gray-500 dark:bg-gray-600';
      default: return 'bg-gray-400 dark:bg-gray-500';
    }
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

  const weekDays = getWeekDays();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                viewMode === 'week'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                viewMode === 'month'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Month
            </button>
          </div>

          {/* Navigation */}
          <button
            onClick={navigateToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Today
          </button>
          
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={navigatePrevious}
              className="px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-l-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ←
            </button>
            <button
              onClick={navigateNext}
              className="px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-r-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Display */}
      <div className="mb-4 text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {formatDateHeader()}
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading calendar...
        </div>
      )}

      {/* Week View */}
      {!isLoading && viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const today = isToday(date);
            
            return (
              <div
                key={index}
                className={`min-h-[200px] p-3 rounded-lg border-2 transition-colors ${
                  today
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="mb-2 text-center">
                  <div className={`text-sm font-medium ${today ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-bold ${today ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                    {date.getDate()}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {dayTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full text-left p-2 rounded text-xs text-white hover:opacity-80 transition-opacity ${getPriorityColor(task.priority)}`}
                    >
                      <div className="font-medium truncate">{task.title}</div>
                      {task.estimated_hours && (
                        <div className="text-xs opacity-90 mt-1">
                          ⏱️ {task.estimated_hours}h
                        </div>
                      )}
                    </button>
                  ))}
                  {dayTasks.length === 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Month View (Simplified for now) */}
      {!isLoading && viewMode === 'month' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Month view coming soon! For now, use week view.
          </p>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {selectedTask.title}
              </h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedTask.status}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Priority:</span>
                <span className={`ml-2 px-2 py-1 rounded text-white text-xs ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </span>
              </div>
              {selectedTask.category && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedTask.category}</span>
                </div>
              )}
              {selectedTask.due_date && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Due Date:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {new Date(selectedTask.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {selectedTask.estimated_hours && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Estimated Hours:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedTask.estimated_hours}h</span>
                </div>
              )}
              {selectedTask.actual_hours && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Actual Hours:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedTask.actual_hours}h</span>
                </div>
              )}
              {selectedTask.description && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 block mb-1">Description:</span>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {selectedTask.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
