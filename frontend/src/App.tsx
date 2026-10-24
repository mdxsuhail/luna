import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PersistentPlayer } from './components/layout/PersistentPlayer';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { ReaderPage } from './pages/ReaderPage';
import { AudiobooksPage } from './pages/AudiobooksPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DeveloperPage } from './pages/DeveloperPage';
import { AboutPage } from './pages/AboutPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { X, Check, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from './services/api';

const AppContent: React.FC = () => {
  const { activePage, notification, dismissNotification, setActivePage, showNotification } = useApp();
  const [developerUnlocked, setDeveloperUnlocked] = useState(false);
  const [developerCode, setDeveloperCode] = useState('');
  const [developerBusy, setDeveloperBusy] = useState(false);
  const [developerError, setDeveloperError] = useState('');

  // Developer Mode is gated; hardware integration remains a future feature.
  const developerPages = ['device'];
  const isDeveloperPage = developerPages.includes(activePage);
  useEffect(() => {
    const token = sessionStorage.getItem('luna_dev_token');
    if (!token) return;

    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/dev/verify`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;
        if (response.ok) setDeveloperUnlocked(true);
        else {
          sessionStorage.removeItem('luna_dev_token');
          setDeveloperUnlocked(false);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        if (!controller.signal.aborted) setDeveloperUnlocked(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!developerUnlocked || !isDeveloperPage) return;
    const token = sessionStorage.getItem('luna_dev_token');
    if (!token) {
      setDeveloperUnlocked(false);
      return;
    }

    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/dev/verify`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;
        if (!response.ok) {
          sessionStorage.removeItem('luna_dev_token');
          setDeveloperUnlocked(false);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        if (!controller.signal.aborted) setDeveloperUnlocked(false);
      });

    return () => controller.abort();
  }, [activePage, developerUnlocked, isDeveloperPage]);
  const unlockDeveloperArea = async (event: React.FormEvent) => {
    event.preventDefault();
    setDeveloperBusy(true);
    setDeveloperError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/dev/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: developerCode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.token !== 'string') {
        throw new Error(payload.detail || 'Developer code was not accepted.');
      }
      sessionStorage.setItem('luna_dev_token', payload.token);
      setDeveloperUnlocked(true);
      setDeveloperCode('');
      showNotification('Developer area unlocked for this browser session.');
    } catch (error) {
      setDeveloperError(error instanceof Error ? error.message : 'Could not verify developer code.');
    } finally {
      setDeveloperBusy(false);
    }
  };

  const lockDeveloperArea = () => {
    sessionStorage.removeItem('luna_dev_token');
    setDeveloperUnlocked(false);
    if (developerPages.includes(activePage)) setActivePage('dashboard');
    showNotification('Developer area locked.');
  };

  const renderDeveloperPage = () => {
    if (!developerUnlocked) {
      return (
        <div className="page-container" style={{ maxWidth: 520, margin: '48px auto' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
            <LockKeyhole size={28} style={{ color: 'var(--accent-primary)', marginBottom: 14 }} />
            <h1 className="section-title">Developer Access</h1>
            <p className="section-subtitle" style={{ marginBottom: 22 }}>This area contains LUNA project information, system configuration, and diagnostics. Enter the locally configured developer code to continue. Reading and library features remain available without it.</p>
            <form onSubmit={unlockDeveloperArea} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label htmlFor="luna-developer-code">Developer login code</label>
              <input id="luna-developer-code" type="password" autoComplete="current-password" value={developerCode} onChange={(e) => setDeveloperCode(e.target.value)} required style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '11px 12px' }} />
              {developerError && <p role="alert" style={{ color: 'var(--accent-amber)', fontSize: 13 }}>{developerError}</p>}
              <button className="btn btn-primary" type="submit" disabled={developerBusy}>{developerBusy ? 'Verifying…' : 'Unlock developer area'}</button>
            </form>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>The code is verified by the local backend and must be configured on this computer. It must not be stored in frontend code or committed to GitHub.</p>
          </div>
        </div>
      );
    }
    return <DeveloperPage onLock={lockDeveloperArea} />;
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'library':
        return <LibraryPage />;
      case 'reader':
        return <ReaderPage />;
      case 'audiobooks':
        return <AudiobooksPage />;
      case 'playlists':
        return <PlaylistsPage />;
      case 'profiles':
        return <ProfilesPage />;
      case 'about':
        return <AboutPage />;
      case 'settings':
        return <SettingsPage />;
      case 'device':
        return renderDeveloperPage();
      default:
        return <DashboardPage />;
    }
  };

  const isReaderActive = activePage === 'reader';

  return (
    <div className="app-container">
      {/* Sleek Desktop Sidebar */}
      <Sidebar />

      {/* Main View Area */}
      <div className="main-content-area">
        {!isReaderActive && <Header />}
        {developerUnlocked && isDeveloperPage && <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 24px 0' }}><button className="btn btn-sm btn-ghost" onClick={lockDeveloperArea}><ShieldCheck size={14} /> Lock developer area</button></div>}

        <main className={`page-viewport ${isReaderActive ? 'reader-mode' : ''}`}>
          {renderActivePage()}
        </main>

        {/* Global Toast Notification */}
        {notification && (
          <div className="toast-banner">
            <Check size={16} style={{ color: 'var(--accent-emerald)' }} />
            <span>{notification}</span>
            <button
              onClick={dismissNotification}
              className="toast-close"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Persistent Bottom Audio Player (unless full-screen reader is active) */}
        {!isReaderActive && <PersistentPlayer />}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
