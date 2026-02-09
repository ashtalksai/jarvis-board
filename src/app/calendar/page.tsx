'use client';

import CalendarView from '@/components/CalendarView';
import Link from 'next/link';

export default function CalendarPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header 
        className="shrink-0 z-40 border-b px-3 sm:px-4 h-12 sm:h-14 flex items-center"
        style={{ 
          borderColor: 'var(--border)',
          background: 'rgba(10, 10, 10, 0.95)',
        }}
      >
        <div className="max-w-[1800px] mx-auto w-full flex items-center gap-2 sm:gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="logo text-sm sm:text-base">J</div>
            <h1 
              className="text-sm sm:text-base font-semibold hidden sm:flex items-center gap-2" 
              style={{ color: 'var(--text-primary)' }}
            >
              <span className="cmd-prefix">$</span>
              <span>jarvis-board</span>
            </h1>
          </div>

          {/* View Navigation */}
          <div className="flex gap-1 sm:gap-2 shrink-0">
            <Link href="/" className="nav-link text-xs sm:text-sm">
              Board
            </Link>
            <Link href="/calendar" className="nav-link active text-xs sm:text-sm">
              Calendar
            </Link>
            <Link href="/activities" className="nav-link text-xs sm:text-sm">
              Activity
            </Link>
          </div>
        </div>
      </header>

      {/* Calendar */}
      <main className="flex-1 overflow-auto">
        <CalendarView />
      </main>
    </div>
  );
}
