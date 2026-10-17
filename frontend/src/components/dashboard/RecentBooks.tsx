import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Headphones, FolderOpen } from 'lucide-react';
import { Book } from '../../types';

export const RecentBooks: React.FC = () => {
  const { books, openBookInReader, playBookAudio, setActivePage } = useApp();
  const recentList = books.slice(0, 4);

  return (
    <div style={{ marginBottom: '28px' }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Recently Opened Books</h2>
          <p className="section-subtitle">Local offline files cached on your workstation</p>
        </div>
        <button
          onClick={() => setActivePage('library')}
          className="btn btn-ghost btn-sm"
        >
          View all library ({books.length})
        </button>
      </div>

      {recentList.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '36px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <FolderOpen size={24} style={{ color: 'var(--text-muted)' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
            No Books in SQLite Database
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.4 }}>
            Your local database table is currently empty. As you import eBooks into <code>local-data/books/</code>, your recently read titles will populate here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {recentList.map((book: Book) => (
            <div
              key={book.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '74px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: book.coverHue,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {book.format}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      lineHeight: 1.3,
                      marginBottom: '3px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={book.title}
                  >
                    {book.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {book.originalFilename}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    Page {book.currentPage} / {book.totalPages} ({book.progressPercentage}%)
                  </div>
                </div>
              </div>

              {/* Micro Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    width: `${book.progressPercentage}%`,
                    height: '100%',
                    backgroundColor: 'var(--accent-primary)',
                  }}
                />
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openBookInReader(book)}
                  className="btn btn-sm btn-ghost"
                  style={{ flex: 1, border: '1px solid var(--border-subtle)' }}
                >
                  <BookOpen size={13} />
                  <span>Read</span>
                </button>
                {book.hasAudio && (
                  <button
                    onClick={() => playBookAudio(book)}
                    className="icon-btn"
                    style={{ width: '30px', height: '30px' }}
                    title="Play audiobook"
                  >
                    <Headphones size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
