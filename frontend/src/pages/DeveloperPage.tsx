import React from 'react';
import {
  Activity,
  BookOpen,
  Bug,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Wrench,
  LockKeyhole,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DeveloperPageProps {
  onLock: () => void;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: 20,
  minWidth: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--text-secondary)',
  fontSize: 12,
  marginBottom: 7,
};

export const DeveloperPage: React.FC<DeveloperPageProps> = ({ onLock }) => {
  const {
    appTheme, setAppTheme, setActivePage,
    readerTheme, setReaderTheme, readerFontSize, setReaderFontSize,
    playbackSpeed, setPlaybackSpeed, books, isBackendOnline,
    backendHealth, refreshBooks, showNotification,
  } = useApp();

  const refreshLibrary = async () => {
    await refreshBooks();
    showNotification('Library refresh requested.');
  };

  const resetUiPreferences = () => {
    const confirmed = window.confirm(
      'Reset LUNA appearance and reader preferences? Your PDF files and SQLite library will not be deleted.'
    );
    if (!confirmed) return;

    ['luna_app_theme', 'luna_reader_theme', 'luna_reader_font_size', 'luna_playback_speed'].forEach((key) => {
      try { window.localStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
    });
    setAppTheme('system');
    setReaderTheme('charcoal');
    setReaderFontSize(18);
    setPlaybackSpeed(1);
    showNotification('Appearance and reader preferences reset. Reloading LUNA…');
    window.setTimeout(() => window.location.reload(), 500);
  };

  const openPage = (page: 'dashboard' | 'library' | 'settings' | 'profiles' | 'about') => {
    setActivePage(page);
  };

  return (
    <div className="page-container" style={{ maxWidth: 1120 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
            <Wrench size={22} style={{ color: 'var(--accent-primary)' }} />
            <h1 className="section-title">Developer Mode</h1>
            <span className="nav-pill">Local tools</span>
          </div>
          <p className="section-subtitle">Inspect the current app state, tune reader defaults, and access development shortcuts. Hardware integration is intentionally postponed.</p>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onLock}>
          <LockKeyhole size={14} /> Lock developer mode
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 20 }}>
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--text-secondary)', fontSize: 12 }}><Activity size={16} /> Backend status</div>
          <div style={{ fontSize: 22, fontWeight: 650, color: isBackendOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)', marginTop: 10 }}>{isBackendOnline ? 'Online' : 'Offline'}</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>{backendHealth?.app || 'LUNA API'} · Local service</p>
        </section>
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--text-secondary)', fontSize: 12 }}><BookOpen size={16} /> Library records</div>
          <div style={{ fontSize: 22, fontWeight: 650, color: 'var(--text-main)', marginTop: 10 }}>{books.length}</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>Books currently loaded by the app</p>
        </section>
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--text-secondary)', fontSize: 12 }}><Bug size={16} /> Developer session</div>
          <div style={{ fontSize: 22, fontWeight: 650, color: 'var(--accent-emerald)', marginTop: 10 }}>Unlocked</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>Session-only access; lock when finished</p>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16, alignItems: 'start' }}>
        <section style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 650, marginBottom: 5, color: 'var(--text-main)' }}>Runtime controls</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 18 }}>These controls apply immediately to the running frontend.</p>

          <label style={labelStyle} htmlFor="dev-theme">Application theme</label>
          <select id="dev-theme" value={appTheme} onChange={(event) => setAppTheme(event.target.value as 'system' | 'light' | 'dark')} style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}>
            <option value="system">Follow system</option><option value="light">Light</option><option value="dark">Dark</option>
          </select>

          <label style={labelStyle} htmlFor="dev-reader-theme">PDF reader theme</label>
          <select id="dev-reader-theme" value={readerTheme} onChange={(event) => setReaderTheme(event.target.value as typeof readerTheme)} style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}>
            <option value="charcoal">Charcoal</option><option value="sepia">Sepia</option><option value="paper">Paper</option><option value="oled">OLED black</option>
          </select>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="dev-font-size">Reader font size</label><strong style={{ fontSize: 13 }}>{readerFontSize}px</strong>
          </div>
          <input id="dev-font-size" type="range" min="12" max="32" step="1" value={readerFontSize} onChange={(event) => setReaderFontSize(Number(event.target.value))} style={{ width: '100%', marginBottom: 18 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="dev-speed">Text-to-speech speed</label><strong style={{ fontSize: 13 }}>{playbackSpeed.toFixed(1)}×</strong>
          </div>
          <input id="dev-speed" type="range" min="0.5" max="2" step="0.1" value={playbackSpeed} onChange={(event) => setPlaybackSpeed(Number(event.target.value))} style={{ width: '100%' }} />
        </section>

        <section style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 650, marginBottom: 5, color: 'var(--text-main)' }}>Diagnostics & actions</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 18 }}>Safe maintenance shortcuts. Your imported PDF files are not removed by these actions.</p>
          <button type="button" className="btn btn-primary" onClick={() => void refreshLibrary()} style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}><RefreshCw size={15} /> Refresh library from backend</button>
          <button type="button" className="btn btn-ghost" onClick={() => openPage('settings')} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>Open app settings <ArrowRight size={15} /></button>
          <button type="button" className="btn btn-ghost" onClick={() => openPage('library')} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>Inspect library <ArrowRight size={15} /></button>
          <button type="button" className="btn btn-ghost" onClick={() => openPage('about')} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>Project information <ArrowRight size={15} /></button>
          <button type="button" className="btn btn-ghost" onClick={resetUiPreferences} style={{ width: '100%', justifyContent: 'center', marginTop: 8, color: 'var(--accent-amber)' }}><RotateCcw size={15} /> Reset UI preferences</button>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5, marginTop: 14 }}>Resetting preferences does not delete books, accounts, or the SQLite database.</p>
        </section>
      </div>

      <section style={{ ...cardStyle, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><SlidersHorizontal size={17} style={{ color: 'var(--accent-primary)' }} /><h2 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-main)' }}>Feature development queue</h2></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 14 }}>Use this space as the roadmap for future modules. These items are not active yet.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {[
            ['Plugin / feature registry', 'Planned', 'Add future app modules behind feature flags.'],
            ['Diagnostics export', 'Planned', 'Export logs and environment checks for debugging.'],
            ['ESP32 integration', 'Deferred', 'Revisit hardware connection after core app features.'],
          ].map(([title, status, description]) => (
            <div key={title} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><strong style={{ color: 'var(--text-main)', fontSize: 12 }}>{title}</strong><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{status}</span></div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.5, marginTop: 7 }}>{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
