'use client';

import { useEffect, useState, useCallback } from 'react';

type SearchResult = {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  priority_level: number;
  status: string;
  rank: number;
};

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
        const data = await response.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [query]);

  // Handle arrow key navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      selectResult(results[selectedIndex]);
    }
  }, [results, selectedIndex]);

  const selectResult = (result: SearchResult) => {
    // Navigate to task detail
    window.location.href = `/?task=${result.id}`;
    setIsOpen(false);
    setQuery('');
  };

  const getPriorityLabel = (level: number) => {
    switch (level) {
      case 4: return '🔥';
      case 3: return '3';
      case 2: return '2';
      default: return '1';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="terminal-window w-full max-w-2xl mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="window-header">
          <div className="window-dots">
            <span className="window-dot red" />
            <span className="window-dot yellow" />
            <span className="window-dot green" />
          </div>
          <span className="window-title">
            <span className="cmd-prefix">$</span> search
          </span>
          <span className="window-status">⌘K</span>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks..."
            className="input"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
              <span className="cmd-prefix">$</span> searching...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
              No results for "{query}"
            </div>
          )}

          {!loading && !query && (
            <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
              Type to search tasks
            </div>
          )}

          {!loading && results.length > 0 && (
            <div>
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => selectResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className="w-full text-left p-3 border-b transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    background: index === selectedIndex ? 'var(--bg-hover)' : 'transparent',
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Priority badge */}
                    <span className={`priority-badge priority-${result.priority_level || 2} shrink-0`}>
                      {getPriorityLabel(result.priority_level || 2)}
                    </span>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div 
                        className="font-medium text-sm truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {result.title}
                      </div>
                      {result.description && (
                        <div 
                          className="text-xs mt-1 line-clamp-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {result.description}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className={`status-badge status-${result.status}`}>
                          {result.status.replace('_', ' ')}
                        </span>
                        <span 
                          className="tag-pill"
                          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                        >
                          {result.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="p-3 flex justify-between text-xs"
          style={{ 
            borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)',
            background: 'var(--bg-code)',
          }}
        >
          <span>
            <kbd className="px-1.5 py-0.5 rounded border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>↑↓</kbd>
            {' '}navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>↵</kbd>
            {' '}select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>esc</kbd>
            {' '}close
          </span>
        </div>
      </div>
    </div>
  );
}
