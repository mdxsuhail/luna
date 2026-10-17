import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Headphones, ChevronRight, Bookmark, Library } from 'lucide-react';

export const ContinueReading: React.FC = () => {
  const { activeBook, activeChapter, openBookInReader, playBookAudio, setActivePage, isBackendOnline } = useApp();

  // If no book exists in the library yet, show clean empty-session card
  if (!activeBook) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Library size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Reading Session
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {isBackendOnline ? 'SQLite Database Connected' : 'Backend Ready'}
              </span>
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
              No Active Reading Session
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              The local database is currently empty. Open My Library to view your books once imported.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActivePage('library')}
          className="btn btn-primary"
        >
          <BookOpen size={14} />
          <span>Browse My Library</span>
          <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '24px',
      }}
    >
      {/* Book Cover Aesthetic Box */}
      <div
        style={{
          width: '100px',
          height: '140px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: activeBook.coverHue,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 18px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '12px',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
          {activeBook.format}
        </span>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
          {activeBook.title.substring(0, 28)}...
        </div>
      </div>

      {/* Book Progress & Information */}
      <div style={{ flex: 1, minWidth: '280px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--accent-primary)',
            }}
          >
            Continue Reading
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>•</span>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Last opened {activeBook.lastRead}
          </span>
        </div>

        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-main)',
            letterSpacing: '-0.01em',
            marginBottom: '4px',
          }}
        >
          {activeBook.title}
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          {activeBook.originalFilename}
        </div>

        {/* Current Chapter & Progress Meter */}
        <div style={{ marginBottom: '14px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Bookmark size={13} style={{ color: 'var(--accent-primary)' }} />
              Page {activeBook.currentPage} of {activeBook.totalPages} ({activeChapter?.title || 'Chapter in progress'})
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              {activeBook.progressPercentage}%
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${activeBook.progressPercentage}%`,
                height: '100%',
                backgroundColor: 'var(--accent-primary)',
                borderRadius: 'var(--radius-full)',
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => openBookInReader(activeBook, activeChapter || undefined)}
            className="btn btn-primary"
          >
            <BookOpen size={15} />
            <span>Resume Reading</span>
            <ChevronRight size={14} />
          </button>

          {activeBook.hasAudio && (
            <button
              onClick={() => playBookAudio(activeBook, activeChapter || undefined)}
              className="btn btn-ghost"
              style={{ border: '1px solid var(--border-subtle)' }}
            >
              <Headphones size={15} />
              <span>Listen to Chapter</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
