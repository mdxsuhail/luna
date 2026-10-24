import React, { useEffect, useState } from 'react';
import { StatusBanner } from '../components/common/StatusBanner';
import { Cpu, Wifi, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Copy, Unplug } from 'lucide-react';

type Transport = 'wifi' | 'usb';
type DeviceConfig = {
  name: string;
  board: string;
  transport: Transport;
  host: string;
  port: string;
  deviceId: string;
  protocol: 'http' | 'https';
};
type DeviceInfo = {
  device_id?: string;
  name?: string;
  board?: string;
  firmware_version?: string;
  capabilities?: string[];
};

const STORAGE_KEY = 'luna_esp32_device_config';
const DEFAULT_CONFIG: DeviceConfig = {
  name: 'LUNA Reader',
  board: 'ESP32-WROOM-32 DevKit',
  transport: 'wifi',
  host: '',
  port: '80',
  deviceId: '',
  protocol: 'http',
};

export const DevicePage: React.FC = () => {
  const [config, setConfig] = useState<DeviceConfig>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return DEFAULT_CONFIG;
      const parsed: unknown = JSON.parse(saved);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return DEFAULT_CONFIG;
      const hasScheme = rawHost.startsWith('http://') || rawHost.startsWith('https://');
      const candidate = hasScheme
        ? new URL(rawHost)
        : new URL(`${config.protocol}://${rawHost}:${port}`);
      if (candidate.protocol !== `${config.protocol}:`) {
        throw new Error(`The address uses ${candidate.protocol.replace(':', '').toUpperCase()}, but the selected protocol is ${config.protocol.toUpperCase()}.`);
      }
      if (candidate.username || candidate.password || candidate.pathname !== '/' || candidate.search || candidate.hash) {
        throw new Error('Enter only an IP address or hostname, without a path, query, or login details.');
      }
      if (!candidate.hostname) throw new Error('Enter a valid IP address or hostname.');
      if (hasScheme && !candidate.port) candidate.port = String(port);
      baseUrl = candidate;
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Enter a valid IP address or hostname.');
      return;
    }

    setStatus('checking');
    setMessage('Trying to contact the ESP32…');
    setDeviceInfo(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(new URL('/api/device/info', baseUrl).toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`ESP32 returned HTTP ${response.status}. Check that its firmware provides GET /api/device/info.`);
      const payload: unknown = await response.json();
      if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        throw new Error('The ESP32 returned invalid JSON. Expected a device-info object.');
      }
      const info = payload as DeviceInfo;
      if (info.device_id !== undefined && typeof info.device_id !== 'string') {
        throw new Error('The ESP32 returned an invalid device_id field.');
      }
      if (info.capabilities !== undefined && (!Array.isArray(info.capabilities) || !info.capabilities.every(item => typeof item === 'string'))) {
        throw new Error('The ESP32 returned an invalid capabilities field. It must be an array of strings.');
      }
      const expectedId = config.deviceId.trim();
      if (expectedId && info.device_id !== expectedId) {
        throw new Error(info.device_id
          ? `Device ID mismatch. Expected ${expectedId}, received ${info.device_id}.`
          : `This device did not report an ID. Expected ${expectedId}; update its firmware response or clear the expected device ID.`);
      }
      setDeviceInfo(info);
      setStatus('connected');
      setMessage(`Connected to ${info.name || config.name}. Device information received successfully.`);
    } catch (error) {
      setStatus('error');
      if (error instanceof Error && error.name === 'AbortError') {
        setMessage('Connection timed out after 5 seconds. Check the ESP32 IP, power, Wi-Fi network and firmware server.');
      } else if (error instanceof TypeError) {
        setMessage('Browser could not reach the ESP32. Check the IP and network. The ESP32 firmware must enable CORS for the LUNA frontend origin; HTTPS pages may also block plain HTTP devices.');
      } else {
        setMessage(error instanceof Error ? error.message : 'Could not connect to the ESP32.');
      }
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    setStatus('idle');
    setDeviceInfo(null);
    setMessage('Connection settings reset. Enter your device details to continue.');
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Ignore unavailable storage. */ }
  };

  return (
    <div className="page-container" style={{ maxWidth: 1040 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <h1 className="section-title">Device Integration</h1>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: status === 'connected' ? 'rgba(16,185,129,.14)' : status === 'error' ? 'rgba(239,68,68,.12)' : 'var(--bg-elevated)', color: status === 'connected' ? 'var(--accent-emerald)' : status === 'error' ? 'var(--accent-red)' : 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
            {status === 'checking' ? 'CONNECTING' : status === 'connected' ? 'CONNECTED' : status === 'error' ? 'CONNECTION ERROR' : 'NOT CONNECTED'}
          </span>
        </div>
        <p className="section-subtitle">Enter the network details of your ESP32 and test whether LUNA can reach its firmware.</p>
      </div>

      <StatusBanner type="warning" title="ESP32 firmware is required" description="These settings configure LUNA's connection attempt. The ESP32 must already be programmed to join your network and expose the matching device-info endpoint. Saving details alone does not install firmware or make an unprogrammed board connect." badge="Setup required" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20, alignItems: 'start', marginTop: 20 }}>
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Cpu size={22} style={{ color: 'var(--accent-primary)' }} />
            <div><h2 style={{ fontSize: 16, color: 'var(--text-main)', margin: 0 }}>Device details</h2><p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Identify the board you intend to connect.</p></div>
          </div>
          <label htmlFor="luna-device-name" style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Device name</label>
          <input id="luna-device-name" value={config.name} onChange={e => update('name', e.target.value)} placeholder="LUNA Reader" style={fieldStyle} />
          <label htmlFor="luna-device-board" style={labelStyle}>ESP32 board model</label>
          <select id="luna-device-board" value={config.board} onChange={e => update('board', e.target.value)} style={fieldStyle}>
            <option>ESP32-WROOM-32 DevKit</option><option>ESP32-S3</option><option>ESP32-CAM</option><option>Other ESP32 board</option>
          </select>
          <label htmlFor="luna-device-id" style={labelStyle}>Expected device ID (optional)</label>
          <input id="luna-device-id" value={config.deviceId} onChange={e => update('deviceId', e.target.value)} placeholder="e.g. luna-reader-01" style={fieldStyle} />
          <p style={hintStyle}>If provided, this must match the ID reported by the firmware.</p>

          <label htmlFor="luna-device-transport" style={labelStyle}>Connection method</label>
          <select id="luna-device-transport" value={config.transport} onChange={e => update('transport', e.target.value as Transport)} style={fieldStyle}>
            <option value="wifi">Wi-Fi (first supported connection test)</option><option value="usb">USB serial (not implemented yet)</option>
          </select>
          {config.transport === 'wifi' ? <>
            <label htmlFor="luna-device-protocol" style={labelStyle}>Protocol</label>
            <select id="luna-device-protocol" value={config.protocol} onChange={e => update('protocol', e.target.value as 'http' | 'https')} style={fieldStyle}><option value="http">HTTP (local network)</option><option value="https">HTTPS</option></select>
            <label htmlFor="luna-device-host" style={labelStyle}>ESP32 IP address / hostname</label>
            <input id="luna-device-host" value={config.host} onChange={e => update('host', e.target.value)} placeholder="e.g. 192.168.1.50" autoComplete="off" style={fieldStyle} />
            <label htmlFor="luna-device-port" style={labelStyle}>Port</label>
            <input id="luna-device-port" type="number" min="1" max="65535" value={config.port} onChange={e => update('port', e.target.value)} placeholder="80" style={fieldStyle} />
            <p style={hintStyle}>Find the IP address in the ESP32 serial monitor after its firmware connects to Wi-Fi. The computer and ESP32 usually need to be on the same network.</p>
          </> : <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.5 }}>USB serial connection is not implemented in this version. Select Wi-Fi to test a board that exposes the HTTP device-info endpoint.</div>}

          <button type="button" className="btn btn-primary" onClick={testConnection} disabled={status === 'checking'} style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
            <RefreshCw size={15} className={status === 'checking' ? 'spin-animation' : ''} /> {status === 'checking' ? 'Testing connection…' : 'Test connection'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetConfig} style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}><Unplug size={14} /> Reset connection settings</button>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
            <h2 style={{ fontSize: 16, color: 'var(--text-main)', margin: '0 0 12px' }}>Connection status</h2>
            <div role="status" aria-live="polite" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.55 }}>
              {status === 'connected' ? <CheckCircle2 size={19} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} /> : status === 'error' ? <AlertCircle size={19} style={{ color: 'var(--accent-red)', flexShrink: 0 }} /> : status === 'checking' ? <RefreshCw size={19} className="spin-animation" style={{ flexShrink: 0 }} /> : <Wifi size={19} style={{ flexShrink: 0 }} />}
              <span>{message}</span>
            </div>
            {deviceInfo && <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              <InfoRow label="Reported name" value={deviceInfo.name || config.name} />
              <InfoRow label="Device ID" value={deviceInfo.device_id || 'Not reported'} />
              <InfoRow label="Board" value={deviceInfo.board || 'Not reported'} />
              <InfoRow label="Firmware version" value={deviceInfo.firmware_version || 'Not reported'} />
              <InfoRow label="Capabilities" value={deviceInfo.capabilities?.join(', ') || 'Not reported'} />
            </div>}
          </section>

          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
            <h2 style={{ fontSize: 16, color: 'var(--text-main)', margin: '0 0 8px' }}>Firmware contract</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>The firmware must join Wi-Fi and serve this endpoint. Use the exact path and JSON field names below for the connection test to succeed.</p>
            <div style={{ borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: 12, fontSize: 12, color: 'var(--text-main)', overflowX: 'auto' }}>
              <strong>GET /api/device/info</strong>
              <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0', fontFamily: 'monospace' }}>{JSON.stringify({ device_id: 'luna-reader-01', name: 'LUNA Reader', board: 'ESP32-WROOM-32 DevKit', firmware_version: '0.1.0', capabilities: ['display_text', 'next_page', 'previous_page'] }, null, 2)}</pre>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => { const json = JSON.stringify({ device_id: 'luna-reader-01', name: 'LUNA Reader', board: config.board, firmware_version: '0.1.0', capabilities: ['display_text', 'next_page', 'previous_page'] }, null, 2); if (navigator.clipboard?.writeText) { void navigator.clipboard.writeText(json).catch(() => setMessage('Clipboard access failed. Select and copy the example JSON manually.')); } else { setMessage('Clipboard is unavailable in this browser. Select and copy the example JSON manually.'); } }} style={{ marginTop: 10 }}><Copy size={13} /> Copy example JSON</button>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => setShowProtocol(v => !v)} style={{ marginTop: 12 }}>{showProtocol ? 'Hide' : 'Show'} next implementation steps</button>
            {showProtocol && <ol style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Upload ESP32 firmware that connects to Wi-Fi and prints its IP address.</li>
              <li>Implement <code>GET /api/device/info</code> returning the JSON above.</li>
              <li>Enable CORS for the exact LUNA frontend origin and test from the browser.</li>
              <li>After connection works, implement authenticated page-transfer and button-event endpoints.</li>
            </ol>}
          </section>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>
        <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0 }}>Connection settings are saved in this browser's local storage. This page does not store Wi-Fi passwords. A successful status means the ESP32 info endpoint responded; book transfer and physical button synchronization require additional firmware and software endpoints.</p>
      </div>
    </div>
  );
};

const fieldStyle: React.CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box', padding: '10px 11px',
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
  background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 13,
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, margin: '14px 0 6px', color: 'var(--text-secondary)' };
const hintStyle: React.CSSProperties = { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: '6px 0 0' };

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, fontSize: 12 }}>
    <span style={{ color: 'var(--text-muted)' }}>{label}</span><strong style={{ color: 'var(--text-main)', textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</strong>
  </div>
);
