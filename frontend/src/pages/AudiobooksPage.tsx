import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBanner } from '../components/common/StatusBanner';
import { Chapter, Book } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Clock,
  Mic,
  Moon,
  HardDrive,
  Headphones
} from 'lucide-react';

export const AudiobooksPage: React.FC = () => {
  const {
    activeBook,
    setActiveBook,
    activeChapter,
    setActiveChapter,
    isPlaying,
    togglePlay,
    audioPositionSeconds,
    setAudioPositionSeconds,
    playbackSpeed,
    setPlaybackSpeed,
    voiceProfile,
    setVoiceProfile,
    books,
    showNotification,
    setActivePage,
  } = useApp();

  const [sleepTimer, setSleepTimer] = useState<string>('Off');

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
            <Headphones size={26} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
            No Audiobook Loaded
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
            Select an eBook from My Library to load it into the local audiobook studio and listen to speech narration.
          </p>
          <button onClick={() => setActivePage('library')} className="btn btn-primary">
            <span>Browse Library</span>
          </button>
        </div>
      </div>
    );
  }

  const audioReadyBooks = books.filter((b: Book) => b.hasAudio);
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

  const handleSelectChapter = (chap: Chapter) => {
    setActiveChapter(chap);
    setAudioPositionSeconds(0);
    if (!isPlaying) togglePlay();
  };

  const voices = [
    'Luna Calm (Local Neural)',
    'Studio Narrator (Local)',
    'E-Ink Voice (Low Power)',
  ];

  return (
    <div className="page-container">
      {/* Page Title & Status */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="section-title">Audiobook Studio</h1>
        <p className="section-subtitle">
          Offline text-to-speech listening station powered by local voice models
        </p>
      </div>

      {/* Honest Status Notice */}
      <StatusBanner
        type="info"
        title="Offline TTS Synthesis Pipeline"
        description="Text-to-speech generation will run locally on your CPU/GPU and cache synthesized audio in 'local-data/audio/'. This interface provides full control layouts and sample audio track structures."
        badge="Local Pipeline"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 420px) 1fr',
          gap: '24px',
          alignItems: 'start',
          marginBottom: '32px',
        }}
      >
        {/* Left: Active Player Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Cover Art Box */}
          <div
            style={{
              width: '160px',
              height: '220px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: activeBook.coverHue,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              marginBottom: '24px',
            }}
          >
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
              AUDIOBOOK
            </span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textAlign: 'left' }}>
              {activeBook.title}
            </div>
          </div>

          <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            {activeChapter?.title || 'Chapter 1: Overview'}
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            {activeBook.title} • {activeBook.originalFilename}
          </div>

          {/* Timeline Scrub Bar */}
          <div style={{ width: '100%', marginBottom: '20px' }}>
            <div
              className="progress-track-wrapper"
              style={{ height: '6px' }}
              onClick={handleSeek}
              title="Click to seek"
            >
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: 'var(--text-muted)',
                marginTop: '8px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>{formatTime(audioPositionSeconds)}</span>
              <span>{formatTime(totalSeconds)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <button
              onClick={() => setAudioPositionSeconds(Math.max(0, audioPositionSeconds - 15))}
              className="icon-btn btn-ghost"
              style={{ width: '38px', height: '38px' }}
              title="Rewind 15 seconds"
            >
              <RotateCcw size={17} />
            </button>

            <button
              onClick={togglePlay}
              className="play-pause-btn"
              style={{ width: '52px', height: '52px' }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '3px' }} />}
            </button>

            <button
              onClick={() => setAudioPositionSeconds(Math.min(totalSeconds, audioPositionSeconds + 30))}
              className="icon-btn btn-ghost"
              style={{ width: '38px', height: '38px' }}
              title="Fast forward 30 seconds"
            >
              <RotateCw size={17} />
            </button>
          </div>

          {/* Speed & Voice Controls */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-divider)',
            }}
          >
            {/* Speed Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Playback Speed</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    style={{
                      padding: '3px 7px',
                      fontSize: '11.5px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: playbackSpeed === s ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      backgroundColor: playbackSpeed === s ? 'var(--bg-elevated)' : 'transparent',
                      color: playbackSpeed === s ? 'var(--text-main)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Model Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mic size={13} />
                <span>Voice Profile</span>
              </span>
              <select
                value={voiceProfile}
                onChange={(e) => {
                  setVoiceProfile(e.target.value);
                  showNotification(`Voice profile switched to: ${e.target.value}`);
                }}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '11.5px',
                  padding: '4px 8px',
                  outline: 'none',
                }}
              >
                {voices.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Sleep Timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Moon size={13} />
                <span>Sleep Timer</span>
              </span>
              <select
                value={sleepTimer}
                onChange={(e) => {
                  setSleepTimer(e.target.value);
                  showNotification(`Sleep timer set to: ${e.target.value}`);
                }}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '11.5px',
                  padding: '4px 8px',
                  outline: 'none',
                }}
              >
                <option value="Off">Off</option>
                <option value="15 min">15 minutes</option>
                <option value="30 min">30 minutes</option>
                <option value="End of Chapter">End of chapter</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Chapter Tracklist & Other Audiobooks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Chapter Tracklist */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Chapters & Audio Segments
                </h3>
                <p className="section-subtitle">
                  {activeBook.chapters?.length || 0} synthesized chapter recordings
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--accent-emerald)' }}>
                <HardDrive size={13} />
                <span>Stored in local-data/audio/</span>
              </div>
            </div>

            {activeBook.chapters && activeBook.chapters.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeBook.chapters.map((chap: Chapter, idx: number) => {
                  const isCurrent = activeChapter?.id === chap.id;
                  return (
                    <div
                      key={chap.id}
                      onClick={() => handleSelectChapter(chap)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isCurrent ? 'var(--bg-elevated)' : 'var(--bg-app)',
                        border: isCurrent ? '1px solid rgba(129, 140, 248, 0.4)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: isCurrent ? 'var(--accent-primary)' : 'var(--bg-card)',
                            color: isCurrent ? '#fff' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {isCurrent && isPlaying ? <Pause size={13} /> : idx + 1}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: '13.5px',
                              fontWeight: isCurrent ? 600 : 400,
                              color: isCurrent ? 'var(--text-main)' : 'var(--text-secondary)',
                            }}
                          >
                            {chap.title}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Page {chap.pageNumber} • Local synthesis ready
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '12px', color: 'var(--text-muted)' }}>
                        <Clock size={13} />
                        <span>{chap.audioDuration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                }}
              >
                No audio tracks generated yet for "{activeBook.title}". TTS speech synthesis pipeline will process chapters locally.
              </div>
            )}
          </div>

          {/* Switch to Other Audiobooks */}
          {audioReadyBooks.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '14px' }}>
                Other Audio-Ready Titles in Local Library
              </h3>

              <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '6px' }}>
                {audioReadyBooks.map((b: Book) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setActiveBook(b);
                      if (b.chapters && b.chapters.length > 0) {
                        setActiveChapter(b.chapters[0]);
                      }
                    }}
                    style={{
                      width: '180px',
                      flexShrink: 0,
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: activeBook.id === b.id ? 'var(--bg-elevated)' : 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        height: '80px',
                        backgroundColor: b.coverHue,
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '9px', color: '#fff' }}>{b.format}</span>
                      <span style={{ fontSize: '10px', color: '#fff', fontWeight: 600 }}>{b.audioDuration}</span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={b.title}
                    >
                      {b.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {b.originalFilename}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
