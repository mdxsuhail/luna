import React from 'react';
import { Book } from '../../types';
import { BookOpen, Headphones, HardDrive, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BookCardProps {
  book: Book;
  onOpenDetails: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onOpenDetails }) => {
  const { openBookInReader, playBookAudio } = useApp();

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s ease, transform 0.15s ease',
      }}
    >
      {/* Book Cover Banner */}
      <div
        style={{
          height: '130px',
          backgroundColor: book.coverHue,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.4)',
              color: '#ffffff',
            }}
          >
            {book.format}
          </span>
          <span
            style={{
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <HardDrive size={11} />
            {book.fileSize}
          </span>
        </div>

        <div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.25,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {book.title}
          </div>
          <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '2px' }}>
            {book.author}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
              }}
            >
              {book.category}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {book.totalPages} pages
            </span>
          </div>

          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              marginBottom: '14px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {book.description}
          </p>

          {/* Reading progress */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '5px' }}>
              <span>Progress</span>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                {book.progressPercentage}% (p. {book.currentPage})
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
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
          </div>

          {/* Audio readiness indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '11px',
              color: book.hasAudio ? 'var(--accent-emerald)' : 'var(--text-dim)',
              marginBottom: '14px',
            }}
          >
            {book.hasAudio ? (
              <>
                <CheckCircle2 size={13} />
                <span>Audio Synthesized ({book.audioDuration})</span>
              </>
            ) : (
              <>
                <Headphones size={13} />
                <span>Audio generation queued</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-divider)' }}>
          <button
            onClick={() => openBookInReader(book)}
            className="btn btn-sm btn-primary"
            style={{ flex: 1 }}
          >
            <BookOpen size={13} />
            <span>Read</span>
          </button>

          {book.hasAudio ? (
            <button
              onClick={() => playBookAudio(book)}
              className="icon-btn"
              style={{ width: '32px', height: '32px' }}
              title="Play audiobook"
            >
              <Headphones size={14} />
            </button>
          ) : null}

          <button
            onClick={() => onOpenDetails(book)}
            className="btn btn-sm btn-ghost"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};
