import React from 'react';
import { Book } from '../../types';
import { BookOpen, Headphones, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BookListRowProps {
  book: Book;
  onOpenDetails: (book: Book) => void;
}

export const BookListRow: React.FC<BookListRowProps> = ({ book, onOpenDetails }) => {
  const { openBookInReader, playBookAudio } = useApp();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        gap: '16px',
        transition: 'background 0.15s ease',
      }}
    >
      {/* Book Icon & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 2, minWidth: '220px' }}>
        <div
          style={{
            width: '36px',
            height: '48px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: book.coverHue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {book.format}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: 600,
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={book.title}
          >
            {book.title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {book.author}
          </div>
        </div>
      </div>

      {/* Category */}
      <div style={{ flex: 1, minWidth: '100px' }}>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
          }}
        >
          {book.category}
        </span>
      </div>

      {/* Progress */}
      <div style={{ flex: 1.2, minWidth: '130px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>p. {book.currentPage} / {book.totalPages}</span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{book.progressPercentage}%</span>
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

      {/* Local Storage & Format */}
      <div style={{ flex: 0.8, minWidth: '80px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        {book.fileSize}
      </div>

      {/* Audio Status */}
      <div style={{ flex: 1, minWidth: '110px' }}>
        {book.hasAudio ? (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--accent-emerald)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CheckCircle2 size={12} />
            <span>{book.audioDuration}</span>
          </span>
        ) : (
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Not synthesized
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => openBookInReader(book)}
          className="btn btn-sm btn-ghost"
          style={{ border: '1px solid var(--border-subtle)' }}
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

        <button
          onClick={() => onOpenDetails(book)}
          className="btn btn-sm btn-ghost"
        >
          Details
        </button>
      </div>
    </div>
  );
};
