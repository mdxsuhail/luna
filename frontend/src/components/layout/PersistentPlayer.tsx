import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Volume2,
  Headphones
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PersistentPlayer: React.FC = () => {
  const {
    activeBook,
    activeChapter,
    readerPage,
    isPlaying,
    togglePlay,
    audioPositionSeconds,
    setAudioPositionSeconds,
    playbackSpeed,
    setPlaybackSpeed,
    setActivePage,
    activePage,
  } = useApp();

  // If no book is active, show clean idle state
  if (!activeBook) {
    return (
      <div className="persistent-player" style={{ opacity: 0.75 }}>
        <div className="player-left">
          <div
            className="player-cover-box"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          >
            <Headphones size={18} />
          </div>
          <div className="player-meta">
            <div className="player-title" style={{ color: 'var(--text-muted)' }}>
              Audiobook Player Idle
            </div>
            <div className="player-subtitle">
              Select an eBook from My Library to start audio playback
            </div>
          </div>
        </div>

        <div className="player-center">
          <div className="player-progress-row" style={{ opacity: 0.5 }}>
            <span className="timestamp">0:00</span>
            <div className="progress-track-wrapper">
              <div className="progress-fill" style={{ width: '0%' }} />
            </div>
            <span className="timestamp">0:00</span>
          </div>
        </div>

        <div className="player-right" style={{ opacity: 0.5 }}>
          <span className="speed-badge">1.0x</span>
          <Volume2 size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    );
  }

  const totalSeconds = activeChapter?.audioSeconds || 1800;
  const progressPct = Math.min(100, Math.max(0, (audioPositionSeconds / totalSeconds) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setAudioPositionSeconds(Math.round(ratio * totalSeconds));
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  const skipSeconds = (delta: number) => {
    setAudioPositionSeconds(Math.max(0, Math.min(totalSeconds, audioPositionSeconds + delta)));
  };

  return (
    <div className="persistent-player">
      {/* Left: Book & Chapter Info */}
      <div className="player-left">
        <div
          className="player-cover-box"
          style={{ backgroundColor: activeBook.coverHue }}
        >
          {activeBook.title.substring(0, 2).toUpperCase()}
        </div>
        <div className="player-meta">
          <div className="player-title" title={activeChapter?.title || activeBook.title}>
            {activeChapter?.title || activeBook.title}
          </div>
          <div className="player-subtitle" title={activeBook.author}>
            {activeBook.title} • {activeBook.author}
          </div>
        </div>
      </div>

      {/* Center: Controls & Timeline */}
      <div className="player-center">
        <div className="player-controls-row">
          <button
            onClick={() => skipSeconds(-15)}
            className="icon-btn btn-ghost"
            style={{ width: '28px', height: '28px' }}
            title="Rewind 15 seconds"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={togglePlay}
            className="play-pause-btn"
            title={isPlaying ? 'Pause' : 'Play audiobook'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: '2px' }} />}
          </button>

          <button
            onClick={() => skipSeconds(30)}
            className="icon-btn btn-ghost"
            style={{ width: '28px', height: '28px' }}
            title="Fast forward 30 seconds"
          >
            <RotateCw size={14} />
          </button>
        </div>

        <div className="player-progress-row">
          <span className="timestamp">{formatTime(audioPositionSeconds)}</span>
          <div
            className="progress-track-wrapper"
            onClick={handleSeek}
            title="Click to seek"
          >
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="timestamp">{formatTime(totalSeconds)}</span>
        </div>
      </div>

      {/* Right: Tools & Maximizer */}
      <div className="player-right">
        <button
          onClick={cycleSpeed}
          className="speed-badge"
          title="Playback speed (click to cycle)"
        >
          {playbackSpeed}x
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Volume2 size={16} />
        </div>

        {activePage !== 'audiobooks' && (
          <button
            onClick={() => setActivePage('audiobooks')}
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            title="Open Full Audiobook Studio"
          >
            <Maximize2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
