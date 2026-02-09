import type { Metadata } from 'next';
import './globals.css';
import CommandPalette from '@/components/CommandPalette';

export const metadata: Metadata = {
  title: 'Jarvis Board',
  description: 'Task board for Ash & Jarvis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <CommandPalette />
      </body>
    </html>
  );
}
