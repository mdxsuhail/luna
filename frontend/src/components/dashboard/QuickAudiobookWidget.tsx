import React from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Pause, Headphones, Clock, ArrowRight, Mic } from 'lucide-react';

export const QuickAudiobookWidget: React.FC = () => {
  const { activeBook, activeChapter, isPlaying, togglePlay, setActivePage, voiceProfile } = useApp();

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
      }}
    >
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Headphones size={17} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
            Audiobook Player Preview
          </h3>
        </div>
        <button
          onClick={() => setActivePage('audiobooks')}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '12px', gap: 4 }}
        >
          <span>Open Full Studio</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '14px 18px',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-divider)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={togglePlay}
            disabled={!activeBook}
            className="play-pause-btn"
            style={{ width: '40px', height: '40px', opacity: activeBook ? 1 : 0.5 }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
          </button>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>
              {activeBook
                ? activeChapter?.title || 'Chapter 1: Overview'
                : 'No Active Audiobook Track'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {activeBook
                ? `${activeBook.title} • ${activeBook.originalFilename}`
                : 'Import an eBook to generate local offline speech audio'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Clock size={14} />
            <span>Duration: {activeChapter?.audioDuration || '0:00'}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            <Mic size={12} style={{ color: 'var(--accent-primary)' }} />
            <span>{voiceProfile}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
