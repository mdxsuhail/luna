import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Headphones,
  ListMusic,
  Settings,
  Cpu,
  Moon,
  HardDrive
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageType } from '../../types';

interface NavItemConfig {
  id: PageType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  isFuture?: boolean;
}

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, books, isBackendOnline } = useApp();

  const primaryNav: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={17} />,
    },
    {
      id: 'library',
      label: 'My Library',
      icon: <BookOpen size={17} />,
      badge: String(books.length),
    },
    {
      id: 'reader',
      label: 'PDF Reader',
      icon: <FileText size={17} />,
    },
    {
      id: 'audiobooks',
      label: 'Audiobooks',
      icon: <Headphones size={17} />,
    },
    {
      id: 'playlists',
      label: 'Playlists',
      icon: <ListMusic size={17} />,
    },
  ];

  const secondaryNav: NavItemConfig[] = [
    {
      id: 'device',
      label: 'Device Integration',
      icon: <Cpu size={17} />,
      badge: 'Optional',
      isFuture: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={17} />,
    },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <Moon size={18} />
          </div>
          <span className="brand-title">LUNA</span>
        </div>
        <span className="brand-badge">Offline</span>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Library & Reading</div>
        {primaryNav.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            aria-current={activePage === item.id ? 'page' : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <span className="nav-pill">{item.badge}</span>}
          </button>
        ))}

        <div className="sidebar-section-title" style={{ marginTop: '12px' }}>
          System & Hardware
        </div>
        {secondaryNav.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            aria-current={activePage === item.id ? 'page' : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span className={`nav-pill ${item.isFuture ? 'future-badge' : ''}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Storage Footer */}
      <div className="sidebar-footer">
        <div className="storage-status-card">
          <div
            className="storage-dot"
            style={{
              backgroundColor: isBackendOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)',
              boxShadow: isBackendOnline
                ? '0 0 6px rgba(52, 211, 153, 0.4)'
                : '0 0 6px rgba(245, 158, 11, 0.4)',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="storage-text-label">SQLite Storage</div>
            <div className="storage-text-val">
              {books.length} {books.length === 1 ? 'book' : 'books'} on disk
            </div>
          </div>
          <HardDrive size={15} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </aside>
  );
};
