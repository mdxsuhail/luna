import React from 'react';
import { Info, AlertCircle } from 'lucide-react';

interface StatusBannerProps {
  type?: 'info' | 'warning';
  title: string;
  description: string;
  badge?: string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  type = 'info',
  title,
  description,
  badge,
}) => {
  return (
    <div className="notice-box" style={{
      borderLeftColor: type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-primary)',
    }}>
      <div className="notice-icon" style={{
        color: type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-primary)',
      }}>
        {type === 'warning' ? <AlertCircle size={18} /> : <Info size={18} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="notice-title">{title}</span>
          {badge && (
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {badge}
            </span>
          )}
        </div>
        <p className="notice-desc">{description}</p>
      </div>
    </div>
  );
};
