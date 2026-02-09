'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Activity } from '@/lib/db';

const ACTION_TYPES = [
  'All',
  'task.create',
  'task.update',
  'task.status_change',
  'task.comment',
  'task.delete',
];

const ENTITY_TYPES = ['All', 'task', 'file', 'browser', 'message'];

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getActionIcon(action: string): string {
  if (action.includes('create')) return '✨';
  if (action.includes('update')) return '📝';
  if (action.includes('status')) return '🔄';
  if (action.includes('comment')) return '💬';
  if (action.includes('delete')) return '🗑️';
  return '•';
}

function getActionColor(action: string): string {
  if (action.includes('create')) return 'var(--success)';
  if (action.includes('delete')) return 'var(--danger)';
  if (action.includes('status')) return 'var(--primary)';
  return 'var(--text-secondary)';
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [actionFilter, entityFilter, limit]);

  const fetchActivities = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter !== 'All') params.set('action', actionFilter);
    if (entityFilter !== 'All') params.set('entity_type', entityFilter);
    params.set('limit', String(limit));

    const res = await fetch(`/api/activities?${params}`);
    const data = await res.json();
    setActivities(data);
    setLoading(false);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/activities/stats');
    const data = await res.json();
    setStats(data);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header 
        className="shrink-0 z-40 border-b px-4 h-14 flex items-center"
        style={{ 
          borderColor: 'var(--border)',
          background: 'rgba(10, 10, 10, 0.95)',
        }}
      >
        <div className="max-w-[1800px] mx-auto w-full flex items-center gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="logo">J</div>
            <h1 
              className="text-base font-semibold flex items-center gap-2" 
              style={{ color: 'var(--text-primary)' }}
            >
              <span className="cmd-prefix">$</span>
              <span>jarvis-board</span>
            </h1>
          </div>

          {/* View Navigation */}
          <div className="flex gap-2 shrink-0">
            <Link href="/" className="nav-link">
              Board
            </Link>
            <Link href="/calendar" className="nav-link">
              Calendar
            </Link>
            <Link href="/activities" className="nav-link active">
              Activity
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full overflow-auto">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Activities', value: stats.total_activities },
              { label: 'Last 24h', value: stats.recent_24h },
              { label: 'Total Tokens', value: stats.total_tokens },
              { label: 'Action Types', value: Object.keys(stats.by_action).length },
            ].map((stat) => (
              <div 
                key={stat.label}
                className="terminal-window"
              >
                <div className="window-header" style={{ padding: '6px 12px' }}>
                  <div className="window-dots">
                    <span className="window-dot red" />
                    <span className="window-dot yellow" />
                    <span className="window-dot green" />
                  </div>
                  <span className="window-title" style={{ fontSize: '0.7rem' }}>{stat.label}</span>
                </div>
                <div className="p-3">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: 'var(--primary)' }}
                  >
                    {stat.value.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="terminal-window mb-6">
          <div className="window-header">
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <span className="window-title">filters</span>
          </div>
          <div className="window-content">
            <div className="flex flex-wrap gap-4">
              <div>
                <label 
                  className="text-xs mb-1.5 block" 
                  style={{ color: 'var(--text-muted)' }}
                >
                  Action Type
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="input"
                  style={{ minWidth: '150px' }}
                >
                  {ACTION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label 
                  className="text-xs mb-1.5 block" 
                  style={{ color: 'var(--text-muted)' }}
                >
                  Entity Type
                </label>
                <select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="input"
                  style={{ minWidth: '150px' }}
                >
                  {ENTITY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label 
                  className="text-xs mb-1.5 block" 
                  style={{ color: 'var(--text-muted)' }}
                >
                  Limit
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="input"
                  style={{ minWidth: '100px' }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Stream */}
        <div className="terminal-window">
          <div className="window-header">
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <span className="window-title">activity-log</span>
            <span className="window-status">{activities.length} entries</span>
          </div>
          
          <div className="window-content">
            {loading ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <span className="cmd-prefix">$</span> loading activities...
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <span className="cmd-prefix">$</span> no activities found
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((activity) => {
                  let details: any = {};
                  try {
                    details = activity.details ? JSON.parse(activity.details) : {};
                  } catch {}
                  
                  return (
                    <div 
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
                    >
                      {/* Icon */}
                      <span className="text-base shrink-0">
                        {getActionIcon(activity.action)}
                      </span>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="text-sm font-medium"
                            style={{ color: getActionColor(activity.action) }}
                          >
                            {activity.action}
                          </span>
                          {activity.entity_type && (
                            <span 
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                            >
                              {activity.entity_type}:{activity.entity_id}
                            </span>
                          )}
                        </div>
                        
                        {details.title && (
                          <div 
                            className="text-sm mt-1 truncate"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            "{details.title}"
                          </div>
                        )}
                        
                        {details.changes && Object.keys(details.changes).length > 0 && (
                          <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            Changed: {Object.keys(details.changes).join(', ')}
                          </div>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      <span 
                        className="text-xs shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {formatTimestamp(activity.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
