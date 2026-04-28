import Badge from '../common/Badge';
import { ExternalLink, Radio, Cpu } from 'lucide-react';

const platformIcon = { twitter: '𝕏', instagram: '📸', reddit: '🔴', web: '🌐' };

export default function ViolationCard({ violation, selected, onClick }) {
  const cls = violation.geminiClassification || {};
  const severity = cls.severity || 'medium';
  const platform = violation.platform || 'web';

  return (
    <div
      className={`violation-card ${severity} ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* Platform + handle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>{platformIcon[platform] || '🌐'}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
              {violation.sharerHandle}
            </span>
            <span style={{
              fontSize: 11, color: 'var(--text-muted)',
              background: '#F1F5F9', padding: '1px 6px', borderRadius: 4
            }}>
              {platform}
            </span>
          </div>

          {/* URL */}
          <p className="truncate" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            {violation.infringingUrl}
          </p>

          {/* Signals + confidence */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge severity={severity} text={severity} />
            <span style={{
              fontSize: 11, color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              {violation.detectionSignal === 'B' ? <Cpu size={11} /> : <Radio size={11} />}
              Signal {violation.detectionSignal}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {Math.round((violation.confidenceScore || 0) * 100)}% conf.
            </span>
          </div>
        </div>

        {/* DMCA status pill */}
        <div style={{
          fontSize: 10, fontWeight: 600,
          padding: '2px 7px', borderRadius: 5,
          background: violation.dmcaStatus === 'none' ? '#F1F5F9' :
                      violation.dmcaStatus === 'drafted' ? '#DBEAFE' :
                      violation.dmcaStatus === 'sent' ? '#D1FAE5' : '#F1F5F9',
          color: violation.dmcaStatus === 'none' ? '#64748B' :
                 violation.dmcaStatus === 'drafted' ? '#1E40AF' :
                 violation.dmcaStatus === 'sent' ? '#065F46' : '#64748B',
          flexShrink: 0, textTransform: 'uppercase'
        }}>
          {violation.dmcaStatus || 'none'}
        </div>
      </div>

      {/* Time */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        {violation.detectedAt
          ? new Date(violation.detectedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
          : '—'}
      </p>
    </div>
  );
}
