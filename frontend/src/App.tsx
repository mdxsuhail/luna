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
import { DevicePage } from './pages/DevicePage';
import { AboutPage } from './pages/AboutPage';
import { X, Check } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activePage, notification, dismissNotification } = useApp();

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
      case 'settings':
        return <SettingsPage />;
      case 'device':
        return <DevicePage />;
      case 'about':
        return <AboutPage />;
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
