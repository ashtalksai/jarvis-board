'use client';

import type { Activity } from '@/lib/db';

type Props = {
  activity: Activity;
};

const actionLabels: Record<string, { label: string; icon: string; color: string }> = {
  'task.create': { label: 'Created task', icon: '✨', color: '#10b981' },
  'task.update': { label: 'Updated task', icon: '✏️', color: '#3b82f6' },
  'task.status_change': { label: 'Changed status', icon: '🔄', color: '#8b5cf6' },
  'task.delete': { label: 'Deleted task', icon: '🗑️', color: '#ef4444' },
  'file.write': { label: 'Wrote file', icon: '📝', color: '#f59e0b' },
  'browser.navigate': { label: 'Navigated browser', icon: '🌐', color: '#06b6d4' },
  'message.send': { label: 'Sent message', icon: '💬', color: '#ec4899' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActivityItem({ activity }: Props) {
  const actionInfo = actionLabels[activity.action] || { 
    label: activity.action, 
    icon: '📌', 
    color: '#6b7280' 
  };

  let details: Record<string, any> = {};
  try {
    if (activity.details) {
      details = JSON.parse(activity.details);
    }
  } catch (e) {
    // Ignore parse errors
  }

  return (
    <div 
      className="p-3 rounded-lg border flex gap-3 hover:border-opacity-60 transition-colors"
      style={{ 
        background: 'var(--bg-tertiary)', 
        borderColor: 'var(--border)'
      }}
    >
      {/* Icon */}
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
        style={{ 
          background: `${actionInfo.color}20`,
        }}
      >
        {actionInfo.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span 
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {actionInfo.label}
          </span>
          
          {details.title && (
            <span 
              className="text-sm truncate"
              style={{ color: 'var(--text-secondary)' }}
            >
              "{details.title}"
            </span>
          )}

          <span 
            className="text-xs ml-auto shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            {formatDate(activity.created_at)}
          </span>
        </div>

        {/* Details */}
        {details.changes && Object.keys(details.changes).length > 0 && (
          <div className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            {Object.entries(details.changes).map(([key, change]: [string, any]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span>{' '}
                <span className="line-through opacity-60">{String(change.from)}</span>
                {' → '}
                <span>{String(change.to)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          {activity.entity_type && (
            <span className="capitalize">{activity.entity_type}</span>
          )}
          {activity.tokens_used && (
            <span>🪙 {activity.tokens_used.toLocaleString()} tokens</span>
          )}
          {activity.session_id && (
            <span className="truncate max-w-[150px]" title={activity.session_id}>
              {activity.session_id.split(':').pop()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
