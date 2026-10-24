import React, { useState } from 'react';
import {
  Activity,
  Bug,
  CheckCircle2,
  CircleAlert,
  Clipboard,
  Download,
  LockKeyhole,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Wifi,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL, fetchHealth } from '../services/api';

interface DeveloperPageProps {
  onLock: () => void;
}

type DiagnosticCheck = {
  name: string;
  status: 'passed' | 'warning' | 'failed';
  details: string;
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: 20,
  minWidth: 0,
};

const statusColor = (status: DiagnosticCheck['status']) => {
  if (status === 'passed') return 'var(--accent-emerald)';
  if (status === 'failed') return 'var(--accent-amber)';
  return 'var(--text-secondary)';
};

export const DeveloperPage: React.FC<DeveloperPageProps> = ({ onLock }) => {
  const {
    books,
    apiBooks,
    isLoadingBooks,
    apiError,
    isBackendOnline,
    backendHealth,
    refreshBooks,
  } = useApp();

  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  const runDiagnostics = async () => {
    setIsRunning(true);
    setActionMessage('');
    const results: DiagnosticCheck[] = [];

    results.push({
      name: 'Browser online status',
      status: navigator.onLine ? 'passed' : 'warning',
      details: navigator.onLine ? 'Browser reports an active network connection.' : 'Browser reports offline mode.',
    });

    const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    results.push({
      name: 'Text-to-speech API',
      status: speechSupported ? 'passed' : 'warning',
      details: speechSupported ? 'Web Speech API is available in this browser.' : 'Web Speech API is not available in this browser.',
    });

    let storageWritable = false;
    try {
      const key = '__luna_dev_storage_check__';
      window.localStorage.setItem(key, 'ok');
      window.localStorage.removeItem(key);
      storageWritable = true;
    } catch {
      storageWritable = false;
    }
    results.push({
      name: 'Local storage',
      status: storageWritable ? 'passed' : 'failed',
      details: storageWritable ? 'Temporary write and cleanup succeeded.' : 'Browser local storage is blocked or unavailable.',
    });

    try {
      const health = await fetchHealth();
      results.push({
        name: 'Backend health endpoint',
        status: 'passed',
        details: `API responded successfully. Service: ${health.app || 'LUNA API'}.`,
      });
    } catch (error) {
      results.push({
        name: 'Backend health endpoint',
        status: 'failed',
        details: error instanceof Error ? error.message : 'Could not reach the backend health endpoint.',
      });
    }

    results.push({
      name: 'Library data consistency',
      status: apiError ? 'warning' : 'passed',
      details: apiError
        ? `The most recent library request reported: ${apiError}`
        : `${apiBooks.length} API records and ${books.length} app records are currently loaded.`,
    });

    setChecks(results);
    setLastRun(new Date().toISOString());
    setIsRunning(false);
  };

  const buildReport = () => ({
    reportType: 'LUNA developer diagnostics',
    generatedAt: new Date().toISOString(),
    app: 'LUNA',
    apiBaseUrl: API_BASE_URL,
    backend: {
      online: isBackendOnline,
      health: backendHealth,
      lastLibraryError: apiError,
      loadingLibrary: isLoadingBooks,
    },
    library: {
      apiRecordCount: apiBooks.length,
      appRecordCount: books.length,
    },
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      speechSynthesisAvailable: 'speechSynthesis' in window,
    },
    diagnostics: { lastRun, checks },
    note: 'Review this report before sharing. It includes browser and local app status; do not attach book contents or private data.',
  });

  const exportReport = () => {
    const report = JSON.stringify(buildReport(), null, 2);
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luna-diagnostics-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setActionMessage('Diagnostics report exported. Review it before sharing.');
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildReport(), null, 2));
      setActionMessage('Diagnostics report copied to clipboard.');
    } catch {
      setActionMessage('Clipboard access was blocked. Use Export report instead.');
    }
  };

  const refreshBackendData = async () => {
    setActionMessage('');
    await refreshBooks();
    setActionMessage('Backend and library refresh completed. Run diagnostics again to capture the latest state.');
  };

  const passedCount = checks.filter((check) => check.status === 'passed').length;
  const failedCount = checks.filter((check) => check.status === 'failed').length;

  return (
    <div className="page-container" style={{ maxWidth: 1120 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
            <Wrench size={22} style={{ color: 'var(--accent-primary)' }} />
            <h1 className="section-title">Developer Mode</h1>
            <span className="nav-pill">Diagnostics</span>
          </div>
          <p className="section-subtitle">Developer-only tools for checking browser capabilities, diagnosing API failures, and preparing a report for debugging. User preferences remain in Settings.</p>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onLock}>
          <LockKeyhole size={14} /> Lock developer mode
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 20 }}>
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--text-secondary)', fontSize: 12 }}><Server size={16} /> API service</div>
          <div style={{ fontSize: 22, fontWeight: 650, color: isBackendOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)', marginTop: 10 }}>{isBackendOnline ? 'Reachable' : 'Unreachable'}</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5, overflowWrap: 'anywhere' }}>{API_BASE_URL}</p>
        </section>
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--text-secondary)', fontSize: 12 }}><Activity size={16} /> Diagnostic results</div>
          <div style={{ fontSize: 22, fontWeight: 650, color: 'var(--text-main)', marginTop: 10 }}>{checks.length ? `${passedCount}/${checks.length} passed` : 'Not run yet'}</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>{failedCount ? `${failedCount} failed check(s)` : 'Run checks to inspect this session'}</p>
        </section>
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--text-secondary)', fontSize: 12 }}><Bug size={16} /> Library state</div>
          <div style={{ fontSize: 22, fontWeight: 650, color: 'var(--text-main)', marginTop: 10 }}>{apiBooks.length} API records</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>{books.length} app records · {isLoadingBooks ? 'Loading' : 'Idle'}</p>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16, alignItems: 'start' }}>
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}><ShieldCheck size={17} style={{ color: 'var(--accent-primary)' }} /><h2 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-main)' }}>Run diagnostics</h2></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>Checks browser connectivity, speech support, local storage, the backend health endpoint, and the current library request state. These checks do not modify or delete your books.</p>
          <button type="button" className="btn btn-primary" onClick={() => void runDiagnostics()} disabled={isRunning} style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
            <Activity size={15} /> {isRunning ? 'Running checks…' : 'Run diagnostic checks'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void refreshBackendData()} disabled={isLoadingBooks} style={{ width: '100%', justifyContent: 'center' }}>
            <RefreshCw size={15} /> {isLoadingBooks ? 'Refreshing…' : 'Retry backend and library'}
          </button>
          {lastRun && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 13 }}>Last run: {new Date(lastRun).toLocaleString()}</p>}
        </section>

        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}><Terminal size={17} style={{ color: 'var(--accent-primary)' }} /><h2 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-main)' }}>Debug report</h2></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>Export or copy technical state to help investigate a bug. The report includes browser details, API status, record counts, and the checks above—not PDF contents.</p>
          <button type="button" className="btn btn-primary" onClick={exportReport} style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}><Download size={15} /> Export JSON report</button>
          <button type="button" className="btn btn-ghost" onClick={() => void copyReport()} style={{ width: '100%', justifyContent: 'center' }}><Clipboard size={15} /> Copy report to clipboard</button>
          {actionMessage && <p role="status" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 13 }}>{actionMessage}</p>}
          {apiError && <p style={{ fontSize: 12, color: 'var(--accent-amber)', lineHeight: 1.5, marginTop: 13 }}><CircleAlert size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />Last API error: {apiError}</p>}
        </section>
      </div>

      <section style={{ ...cardStyle, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><Wifi size={17} style={{ color: 'var(--accent-primary)' }} /><h2 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-main)' }}>Diagnostic checklist</h2></div>
        {checks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No checks have run in this session. Select “Run diagnostic checks” to populate the results.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {checks.map((check) => (
              <div key={check.name} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 0.8fr) minmax(0, 2fr)', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: statusColor(check.status), fontSize: 12, fontWeight: 650 }}>
                  {check.status === 'passed' ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
                  {check.name}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6 }}>{check.details}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ ...cardStyle, marginTop: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-main)', marginBottom: 8 }}>Developer roadmap</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {[
            ['Feature flags', 'Planned', 'Enable controlled testing of unfinished software features.'],
            ['Structured application logs', 'Planned', 'Capture timestamped errors and diagnostic events.'],
            ['ESP32 integration', 'Deferred', 'Hardware connection remains out of scope until the core app is ready.'],
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
