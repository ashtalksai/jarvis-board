'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ActivityItem from '@/components/ActivityItem';
import type { Activity } from '@/lib/db';

const ACTION_TYPES = [
  'All',
  'task.create',
  'task.update',
  'task.status_change',
  'task.delete',
  'file.write',
  'browser.navigate',
  'message.send',
];

const ENTITY_TYPES = ['All', 'task', 'file', 'browser', 'message'];

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
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="border-b px-4 sm:px-6 py-4" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link 
              href="/" 
              className="text-sm px-3 py-1.5 rounded-md border hover:bg-opacity-80 transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              ← Board
            </Link>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Activity Feed
            </h1>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Activities</div>
                <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {stats.total_activities.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 24h</div>
                <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {stats.recent_24h.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Tokens</div>
                <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {stats.total_tokens.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Action Types</div>
                <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {Object.keys(stats.by_action).length}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Action Type
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-md text-sm border outline-none"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  borderColor: 'var(--border)', 
                  color: 'var(--text-primary)' 
                }}
              >
                {ACTION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Entity Type
              </label>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-md text-sm border outline-none"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  borderColor: 'var(--border)', 
                  color: 'var(--text-primary)' 
                }}
              >
                {ENTITY_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Limit
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-3 py-1.5 rounded-md text-sm border outline-none"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  borderColor: 'var(--border)', 
                  color: 'var(--text-primary)' 
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Activity Stream */}
      <main className="p-4 sm:p-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            No activities found
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
