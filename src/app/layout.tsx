import type { Metadata } from 'next';
import './globals.css';
import CommandPalette from '@/components/CommandPalette';

export const metadata: Metadata = {
  title: 'Jarvis Board',
  description: 'Task board for Ash & Jarvis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        {children}
        <CommandPalette />
      </body>
    </html>
  );
}
