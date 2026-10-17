import React from 'react';
import { BookOpen, Headphones, Flame, HardDrive } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StatsOverview: React.FC = () => {
  const { books, isBackendOnline, backendHealth } = useApp();

  // Compute live library metrics from SQLite books
  const totalBooks = books.length;
  const totalPages = books.reduce((acc, b) => acc + (b.pageCount || 0), 0);
  const audioBooksCount = books.filter((b) => b.hasAudio).length;

  const stats = [
    {
      label: 'SQLite Database Books',
      value: `${totalBooks} ${totalBooks === 1 ? 'Title' : 'Titles'}`,
      subtext: isBackendOnline
        ? 'Stored in local-data/database/luna.db'
        : 'Backend server not connected',
      icon: <BookOpen size={18} style={{ color: 'var(--accent-primary)' }} />,
    },
    {
      label: 'Audio Synthesized',
      value: `${audioBooksCount} Generated`,
      subtext: 'Stored in local-data/audio',
      icon: <Headphones size={18} style={{ color: '#38bdf8' }} />,
    },
    {
      label: 'Total Pages Stored',
      value: `${totalPages} Pages`,
      subtext: totalBooks > 0 ? 'Indexed locally' : 'No books imported yet',
      icon: <Flame size={18} style={{ color: 'var(--accent-amber)' }} />,
    },
    {
      label: 'Local SQLite Status',
      value: isBackendOnline ? 'Online & Ready' : 'Offline',
      subtext: backendHealth?.database_initialized
        ? 'luna.db initialized'
        : 'Connect FastAPI backend',
      icon: (
        <HardDrive
          size={18}
          style={{ color: isBackendOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}
        />
      ),
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}
    >
      {stats.map((s, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {s.label}
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginTop: '4px',
                letterSpacing: '-0.02em',
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              {s.subtext}
            </div>
          </div>
          <div
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {s.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
