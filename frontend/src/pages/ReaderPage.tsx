import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReaderTheme, Chapter } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Headphones,
  Sidebar as SidebarIcon,
  BookOpen,
  Info
} from 'lucide-react';

export const ReaderPage: React.FC = () => {
  const {
    activeBook,
    activeChapter,
    setActiveChapter,
    readerTheme,
    setReaderTheme,
    readerFontSize,
    setReaderFontSize,
    readerPage,
    setReaderPage,
    playBookAudio,
    showNotification,
    setActivePage,
  } = useApp();

  const [isTocOpen, setIsTocOpen] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const themes: { id: ReaderTheme; label: string; bg: string; text: string }[] = [
    { id: 'charcoal', label: 'Charcoal', bg: '#12141c', text: '#f3f4f6' },
    { id: 'sepia', label: 'Sepia', bg: '#f7eed7', text: '#2b2216' },
    { id: 'paper', label: 'Paper', bg: '#fcfcfc', text: '#1a1a1a' },
    { id: 'oled', label: 'OLED', bg: '#000000', text: '#e5e7eb' },
  ];

  if (!activeBook) {
    return (
      <div
        className="page-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: '440px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 28px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--accent-primary)',
            }}
          >
            <BookOpen size={26} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
            No Book Open in Reader
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
            Your local SQLite database is connected. Select an eBook from My Library to start reading in this distraction-free viewport.
          </p>
          <button onClick={() => setActivePage('library')} className="btn btn-primary">
            <span>Browse Library</span>
          </button>
        </div>
      </div>
    );
  }

  const handleNextPage = () => {
    if (readerPage < activeBook.totalPages) {
      setReaderPage(readerPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (readerPage > 1) {
      setReaderPage(readerPage - 1);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    showNotification(!isBookmarked ? `Bookmarked page ${readerPage}` : `Removed bookmark for page ${readerPage}`);
  };

  return (
    <div className="reader-container">
      {/* Collapsible Table of Contents Sidebar */}
      {isTocOpen && (
        <aside className="reader-sidebar">
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={16} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                Table of Contents
              </span>
            </div>
            <button
              onClick={() => setIsTocOpen(false)}
              className="icon-btn btn-ghost"
              style={{ width: '26px', height: '26px' }}
              title="Collapse Table of Contents"
            >
              <SidebarIcon size={14} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 8px' }}>
              CHAPTERS ({activeBook.chapters?.length || 0})
            </div>

            {activeBook.chapters && activeBook.chapters.length > 0 ? (
              activeBook.chapters.map((chap: Chapter) => {
                const isSelected = activeChapter?.id === chap.id;
                return (
                  <div
                    key={chap.id}
                    onClick={() => {
                      setActiveChapter(chap);
                      setReaderPage(chap.pageNumber);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      border: isSelected ? '1px solid rgba(129, 140, 248, 0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)',
                        lineHeight: 1.3,
                      }}
                    >
                      {chap.title}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                      }}
                    >
                      <span>Page {chap.pageNumber}</span>
                      <span>{chap.audioDuration} audio</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Document registered. Extracted text status: {activeBook.extractedTextStatus}.
              </div>
            )}
          </div>

          {/* Book Info Summary */}
          <div
            style={{
              padding: '14px 16px',
              borderTop: '1px solid var(--border-divider)',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
              {activeBook.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {activeBook.originalFilename} • {activeBook.format} ({activeBook.fileSize})
            </div>
          </div>
        </aside>
      )}

      {/* Main Reading Viewport */}
      <div className="reader-main-panel">
        {/* Top Reader Toolbar */}
        <div className="reader-toolbar" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isTocOpen && (
              <button
                onClick={() => setIsTocOpen(true)}
                className="icon-btn btn-ghost"
                style={{ width: '30px', height: '30px' }}
                title="Expand Table of Contents"
              >
                <SidebarIcon size={15} />
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={handlePrevPage}
                disabled={readerPage <= 1}
                className="icon-btn"
                style={{ width: '30px', height: '30px', opacity: readerPage <= 1 ? 0.4 : 1 }}
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', padding: '0 6px', fontVariantNumeric: 'tabular-nums' }}>
                Page <strong>{readerPage}</strong> of {activeBook.totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={readerPage >= activeBook.totalPages}
                className="icon-btn"
                style={{ width: '30px', height: '30px', opacity: readerPage >= activeBook.totalPages ? 0.4 : 1 }}
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Center Title */}
          <div
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              maxWidth: '320px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activeChapter?.title || activeBook.title}
          </div>

          {/* Right Toolbar Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Font Size Adjusters */}
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setReaderFontSize(Math.max(14, readerFontSize - 2))}
                className="icon-btn btn-ghost"
                style={{ width: '28px', height: '28px', fontSize: '11px', fontWeight: 600 }}
                title="Decrease font size"
              >
                A-
              </button>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '0 4px' }}>
                {readerFontSize}
              </span>
              <button
                onClick={() => setReaderFontSize(Math.min(26, readerFontSize + 2))}
                className="icon-btn btn-ghost"
                style={{ width: '28px', height: '28px', fontSize: '13px', fontWeight: 600 }}
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Theme Picker */}
            <div style={{ display: 'flex', gap: 4, padding: '2px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              {themes.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setReaderTheme(th.id)}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    backgroundColor: th.bg,
                    border: readerTheme === th.id ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                  }}
                  title={`Switch to ${th.label} theme`}
                />
              ))}
            </div>

            {/* Bookmark */}
            <button
              onClick={toggleBookmark}
              className={`icon-btn ${isBookmarked ? 'btn-primary' : ''}`}
              style={{ width: '30px', height: '30px' }}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
            >
              <Bookmark size={14} />
            </button>

            {/* Audio Sync Button */}
            {activeBook.hasAudio && (
              <button
                onClick={() => playBookAudio(activeBook, activeChapter || undefined)}
                className="btn btn-sm btn-ghost"
                style={{ border: '1px solid var(--border-subtle)', gap: 5 }}
                title="Listen to this chapter in audiobook player"
              >
                <Headphones size={13} style={{ color: 'var(--accent-primary)' }} />
                <span>Listen</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Canvas */}
        <div className="reader-canvas">
          <div className={`reader-page-sheet theme-${readerTheme}`}>
            {/* Honest PDF preview indicator bar inside reader */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                border: '1px dashed rgba(129, 140, 248, 0.4)',
                marginBottom: '32px',
                fontSize: '11.5px',
                color: 'var(--text-muted)',
              }}
            >
              <Info size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>
                <strong>Reader Preview:</strong> Document "{activeBook.originalFilename}" from local database. Offline PDF rendering will parse binary pages directly in subsequent phase.
              </span>
            </div>

            {/* Book Meta Header */}
            <div
              className="reader-page-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6b7280',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(128, 128, 128, 0.2)',
                marginBottom: '40px',
              }}
            >
              <span>{activeBook.title}</span>
              <span>Chapter {activeChapter?.number || 1}</span>
            </div>

            {/* Chapter Heading */}
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: `${readerFontSize * 1.75}px`,
                lineHeight: 1.25,
                fontWeight: 600,
                marginBottom: '12px',
                letterSpacing: '-0.01em',
              }}
            >
              {activeChapter?.title || activeBook.title}
            </h1>

            <div
              className="reader-meta-caption"
              style={{
                fontSize: '13px',
                color: '#9ca3af',
                marginBottom: '32px',
                fontStyle: 'italic',
              }}
            >
              File: {activeBook.originalFilename} • Page {readerPage}
            </div>

            {/* Chapter Body Content with Serif reading typography */}
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: `${readerFontSize}px`,
                lineHeight: 1.8,
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              {activeChapter?.sampleContent && activeChapter.sampleContent.length > 0 ? (
                activeChapter.sampleContent.map((paragraph: string, idx: number) => (
                  <p key={idx} style={{ textIndent: idx > 0 ? '1.5em' : '0' }}>
                    {paragraph}
                  </p>
                ))
              ) : (
                <p>
                  This eBook is indexed in the SQLite database at <code>{activeBook.storedPdfPath}</code> with status: <em>{activeBook.extractedTextStatus}</em>. The upcoming PDF parsing pipeline will extract and render text layers directly on this surface.
                </p>
              )}

              <blockquote
                style={{
                  borderLeft: '3px solid var(--accent-primary)',
                  paddingLeft: '18px',
                  margin: '12px 0',
                  fontStyle: 'italic',
                  opacity: 0.9,
                }}
              >
                "LUNA offline architecture: All reading states, bookmarks, and book records are stored purely on the local machine."
              </blockquote>
            </div>

            {/* Page Footer */}
            <div
              className="reader-page-footer"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#6b7280',
                paddingTop: '32px',
                marginTop: '60px',
                borderTop: '1px solid rgba(128, 128, 128, 0.2)',
              }}
            >
              <span>LUNA Offline Reader</span>
              <span>— {readerPage} —</span>
              <span>100% On-Device</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
