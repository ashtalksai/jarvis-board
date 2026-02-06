'use client';

import CalendarView from '@/components/CalendarView';
import Link from 'next/link';

export default function CalendarPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="border-b px-4 sm:px-6 py-4" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'var(--accent)' }}>J</div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Jarvis Board</h1>
          </div>

          <div className="flex-1 flex items-center gap-2 sm:ml-4">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              Board
            </Link>
            <Link
              href="/calendar"
              className="px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Calendar
            </Link>
          </div>
        </div>
      </header>

      {/* Calendar */}
      <main>
        <CalendarView />
      </main>
    </div>
  );
}
