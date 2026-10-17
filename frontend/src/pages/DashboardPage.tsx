import React from 'react';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { ContinueReading } from '../components/dashboard/ContinueReading';
import { RecentBooks } from '../components/dashboard/RecentBooks';
import { QuickAudiobookWidget } from '../components/dashboard/QuickAudiobookWidget';
import { StatusBanner } from '../components/common/StatusBanner';

export const DashboardPage: React.FC = () => {
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
