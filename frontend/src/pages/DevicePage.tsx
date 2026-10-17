import React, { useState } from 'react';
import { StatusBanner } from '../components/common/StatusBanner';
import {
  Cpu,
  RefreshCw,
  Bluetooth,
  Usb,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

export const DevicePage: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const handleScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('No companion device detected on local USB COM ports or BLE. LUNA is operating in standalone desktop mode.');
    }, 1800);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <h1 className="section-title">Hardware Companion Integration</h1>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--accent-amber)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              textTransform: 'uppercase',
            }}
          >
            Optional Future Module
          </span>
        </div>
        <p className="section-subtitle">
          Optional low-power e-paper hardware sync for bedside and travel reading
        </p>
      </div>

      {/* Honest Status Notice */}
      <StatusBanner
        type="warning"
        title="Optional Companion Feature — Not Connected"
        description="LUNA is engineered as a complete standalone desktop platform with zero required hardware dependencies. A companion ESP32 e-ink reader is planned as a future decoupled accessory that syncs via local USB/BLE."
        badge="Decoupled Hardware"
      />

      {/* Main Hardware Status Box */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 420px) 1fr',
          gap: '24px',
          alignItems: 'start',
          marginBottom: '32px',
        }}
      >
        {/* Device Status Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--accent-amber)',
            }}
          >
            <Cpu size={28} />
          </div>

          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            LUNA Companion e-Reader
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--accent-amber)', fontWeight: 500, marginBottom: '20px' }}>
            Status: Not Connected (Optional)
          </div>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-divider)',
              textAlign: 'left',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-main)', fontWeight: 600, marginBottom: '4px' }}>
              <ShieldCheck size={14} style={{ color: 'var(--accent-emerald)' }} />
              <span>Zero Core Dependency</span>
            </div>
            Your LUNA desktop software remains 100% capable of storing, reading, and synthesizing books locally without this device.
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            <RefreshCw size={14} className={isScanning ? 'spin-animation' : ''} />
            <span>{isScanning ? 'Scanning USB & Bluetooth...' : 'Check for Companion Device'}</span>
          </button>

          {scanResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11.5px',
                color: 'var(--text-muted)',
                lineHeight: 1.4,
              }}
            >
              {scanResult}
            </div>
          )}
        </div>

        {/* Technical Architecture & Specs */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
            Future Companion Architecture Preview
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
            The planned companion device will be developed in the dedicated <code>optional-device/</code> folder, ensuring the core desktop experience stays lean and free of embedded toolchains.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Usb size={18} style={{ color: 'var(--accent-primary)', marginTop: 2 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Local Storage Mounting
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Syncs selected titles directly from <code>local-data/books/</code> to an external micro-SD storage card.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Bluetooth size={18} style={{ color: '#38bdf8', marginTop: 2 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Reading State Synchronization
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Low-energy sync of bookmarks, current page numbers, and reading progress between device and local database.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <HardDrive size={18} style={{ color: 'var(--accent-emerald)', marginTop: 2 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Audio Offline Caching
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Transfer synthesized voice files from <code>local-data/audio/</code> for distraction-free listening on the go.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
