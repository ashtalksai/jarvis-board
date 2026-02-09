'use client';

import CalendarView from '@/components/CalendarView';
import Link from 'next/link';

export default function CalendarPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-40 border-b px-4 py-3"
        style={{ 
          borderColor: 'var(--border)',
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
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

          <div className="flex-1 flex items-center gap-2 sm:ml-4">
            <Link href="/" className="nav-link">
              Board
            </Link>
            <Link href="/calendar" className="nav-link active">
              Calendar
            </Link>
            <Link href="/activities" className="nav-link">
              Activity
            </Link>
          </div>
        </div>
      </header>

      {/* Calendar */}
      <main className="flex-1">
        <CalendarView />
      </main>
    </div>
  );
}
