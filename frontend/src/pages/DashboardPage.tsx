import React from 'react';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { ContinueReading } from '../components/dashboard/ContinueReading';
import { RecentBooks } from '../components/dashboard/RecentBooks';
import { QuickAudiobookWidget } from '../components/dashboard/QuickAudiobookWidget';
import { StatusBanner } from '../components/common/StatusBanner';
import { FolderStack } from '../components/common/FolderStack';
import { useApp } from '../context/AppContext';

export const DashboardPage: React.FC = () => {
  const { books, isBackendOnline, setActivePage } = useApp();
  return (
    <div className="page-container">
      {/* Welcome Heading */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome to LUNA
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Your offline-first sanctuary for distraction-free reading and local audiobook synthesis.
        </p>
      </div>

      {/* Honest Status Notice */}
      <StatusBanner
        type="info"
        title="Offline Preview Mode • Local Architecture"
        description="LUNA is initialized with local sample assets. Core offline PDF rendering, local text-to-speech synthesis, and local file storage inside 'local-data/' will be integrated in upcoming development stages."
        badge="Preview v0.1"
      />

      <FolderStack panels={[
        { code: 'CODE_001', label: 'LIBRARY', tone: '#d9d2bd', content: <div><h3>Keep your collection close</h3><p>{books.length} books in your local library.</p><button className="btn btn-ghost" onClick={() => setActivePage('library')}>Open library →</button></div> },
        { code: 'CODE_002', label: 'READING', tone: '#aeb6c4', content: <div><h3>Pick up your next read</h3><p>Choose a PDF from your local library to open it in the reader.</p><button className="btn btn-ghost" onClick={() => setActivePage('library')}>Find a book →</button></div> },
        { code: 'CODE_003', label: 'AUDIO', tone: '#c4a17a', content: <div><h3>Audio is in development</h3><p>Current audio controls are a prototype, not full text-to-speech playback.</p><button className="btn btn-ghost" onClick={() => setActivePage('audiobooks')}>Explore audio →</button></div> },
        { code: 'CODE_004', label: 'SYSTEM', tone: '#a3ad91', content: <div><h3>{isBackendOnline ? 'Local service connected' : 'Local service offline'}</h3><p>Book files and metadata are designed to stay on your machine.</p><button className="btn btn-ghost" onClick={() => setActivePage('about')}>About LUNA →</button></div> },
      ]} />

      {/* Library Statistics */}
      <StatsOverview />

      {/* Continue Reading Featured Card */}
      <ContinueReading />

      {/* Recently Opened Books */}
      <RecentBooks />

      {/* Audiobook Player Preview */}
      <QuickAudiobookWidget />
    </div>
  );
};
