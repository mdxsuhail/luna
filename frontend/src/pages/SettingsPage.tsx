import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  HardDrive,
  Sliders,
  Shield,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    readerTheme,
    setReaderTheme,
    readerFontSize,
    setReaderFontSize,
    playbackSpeed,
    setPlaybackSpeed,
    voiceProfile,
    setVoiceProfile,
    backendHealth,
    isBackendOnline,
    books,
    refreshBooks,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'storage' | 'reader' | 'audio' | 'privacy'>('storage');

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="section-title">Settings & Configuration</h1>
        <p className="section-subtitle">
          Manage local storage directories, reader defaults, and privacy preferences
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          marginBottom: '28px',
        }}
      >
        {[
          { id: 'storage', label: 'Storage & Directories', icon: <HardDrive size={15} /> },
          { id: 'reader', label: 'Reader Preferences', icon: <Sliders size={15} /> },
          { id: 'audio', label: 'Audio & Speech', icon: <RefreshCw size={15} /> },
          { id: 'privacy', label: 'Offline Guarantee', icon: <Shield size={15} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="btn btn-sm"
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
              borderColor: activeTab === tab.id ? 'var(--border-focus)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
              gap: 8,
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content: Storage */}
      {activeTab === 'storage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                Local Data Directory Architecture
              </h2>
              <button
                onClick={() => refreshBooks()}
                className="btn btn-sm btn-ghost"
                style={{ border: '1px solid var(--border-subtle)', gap: 5 }}
              >
                <RefreshCw size={12} />
                <span>Verify Backend Connection</span>
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              LUNA stores all files strictly on your local disk within the project workspace.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    eBook & PDF Storage
                  </div>
                  <code style={{ fontSize: '11.5px', color: 'var(--accent-primary)', marginTop: '2px', display: 'block' }}>
                    ./local-data/books/
                  </code>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {books.length} {books.length === 1 ? 'file' : 'files'} recorded
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    Audio & Voice Cache
                  </div>
                  <code style={{ fontSize: '11.5px', color: 'var(--accent-primary)', marginTop: '2px', display: 'block' }}>
                    ./local-data/audio/
                  </code>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Not implemented
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    SQLite Database File
                  </div>
                  <code style={{ fontSize: '11.5px', color: 'var(--accent-primary)', marginTop: '2px', display: 'block' }}>
                    {backendHealth?.database_path || './local-data/database/luna.db'}
                  </code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isBackendOnline ? (
                    <span style={{ fontSize: '12px', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} />
                      <span>Online</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={13} />
                      <span>Unreachable</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-divider)', display: 'flex', gap: '12px' }}>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Audio waveform caching is not implemented yet. LUNA currently uses your browser's speech synthesis and does not create cached audio files, so there is nothing to clear.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Reader Preferences */}
      {activeTab === 'reader' && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Default Reading Theme
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Choose the default visual appearance for the PDF and text reader
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {(['charcoal', 'sepia', 'paper', 'oled'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setReaderTheme(t)}
                  className="btn btn-sm"
                  style={{
                    textTransform: 'capitalize',
                    backgroundColor: readerTheme === t ? 'var(--bg-elevated)' : 'transparent',
                    borderColor: readerTheme === t ? 'var(--border-focus)' : 'var(--border-subtle)',
                    color: readerTheme === t ? 'var(--text-main)' : 'var(--text-muted)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Base Typography Size ({readerFontSize}px)
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Default font size for readable chapter rendering
            </p>
            <input
              type="range"
              min="14"
              max="26"
              value={readerFontSize}
              onChange={(e) => setReaderFontSize(Number(e.target.value))}
              style={{ width: '280px', accentColor: 'var(--accent-primary)' }}
            />
          </div>
        </div>
      )}

      {/* Tab Content: Audio Preferences */}
      {activeTab === 'audio' && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Default Playback Speed ({playbackSpeed}x)
            </h2>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: playbackSpeed === s ? 'var(--bg-elevated)' : 'transparent',
                    borderColor: playbackSpeed === s ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    color: playbackSpeed === s ? 'var(--text-main)' : 'var(--text-muted)',
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Preferred Browser Voice
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Browser-provided speech voice preference. This setting is not connected to voice selection yet.
            </p>
            <select
              value={voiceProfile}
              onChange={(e) => setVoiceProfile(e.target.value)}
              style={{
                width: '320px',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="Default browser voice">Default browser voice</option>
              <option value="English browser voice">English browser voice (planned)</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab Content: Privacy Guarantee */}
      {activeTab === 'privacy' && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '12px' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
              100% Offline & Private by Design
            </h2>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            LUNA was created with a fundamental commitment to privacy:
          </p>

          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <li>Zero analytics, telemetry, or tracking scripts.</li>
            <li>No cloud sync or external API dependencies.</li>
            <li>All eBooks, PDFs, and audio recordings remain strictly inside your <code>local-data/</code> folder.</li>
            <li>No user accounts, subscriptions, or login requirements.</li>
          </ul>
        </div>
      )}
    </div>
  );
};
