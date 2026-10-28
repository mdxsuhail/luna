import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, BookOpen, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface HeaderProps {
  onOpenAddBook?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddBook }) => {
  const { activePage, activeBook, setActivePage, isBackendOnline, isLoadingBooks, refreshBooks } = useApp();

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return 'Overview';
      case 'library':
        return 'My Library';
      case 'reader':
        return activeBook ? `Reader: ${activeBook.title}` : 'PDF Reader';
      case 'audiobooks':
        return 'Audiobook Studio';
      case 'playlists':
        return 'Playlists & Audio Queues';
      case 'settings':
        return 'Preferences & Storage';
      case 'developer':
        return 'Developer Mode';
      case 'profiles':
        return 'Reader Profile';
      case 'about':
        return 'About & System';
      default:
        return 'LUNA';
    }
  };

  const hostDesc = API_BASE_URL || 'same origin';

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="header-title-box">
          <h1>{getPageTitle()}</h1>
        </div>

        {/* Backend Connectivity Status Indicator */}
        {isBackendOnline ? (
          <div className="header-status-badge" title={`FastAPI backend connected (${hostDesc})`}>
            <ShieldCheck size={13} />
            <span>SQLite Connected</span>
          </div>
        ) : (
          <div
            className="header-status-badge"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              color: 'var(--accent-amber)',
              cursor: 'pointer',
            }}
            onClick={() => refreshBooks()}
            title={`Click to retry connection to FastAPI backend (${hostDesc})`}
          >
            <AlertCircle size={13} />
            <span>Backend Offline (Retry)</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <button
          onClick={() => refreshBooks()}
          disabled={isLoadingBooks}
          className="icon-btn btn-ghost"
          style={{ width: '30px', height: '30px' }}
          title="Refresh library from SQLite database"
        >
          <RefreshCw size={13} className={isLoadingBooks ? 'spin-animation' : ''} />
        </button>

        {activePage !== 'reader' && activeBook && (
          <button
            onClick={() => setActivePage('reader')}
            className="btn btn-ghost btn-sm"
            title="Resume currently reading book"
          >
            <BookOpen size={14} />
            <span>Resume: {activeBook.title.substring(0, 24)}...</span>
          </button>
        )}

        {activePage === 'library' && onOpenAddBook && (
          <button onClick={onOpenAddBook} className="btn btn-primary btn-sm">
            <Plus size={14} />
            <span>Import eBook</span>
          </button>
        )}
      </div>
    </header>
  );
};
