import { useState } from 'react';
import { Sparkles, ExternalLink, Copy, CheckCircle2, Send, Eye } from 'lucide-react';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../config/api';
import toast from 'react-hot-toast';

const actionLabels = {
  send_dmca: 'Send DMCA',
  monitor: 'Monitor',
  contact_directly: 'Contact Directly',
  no_action_required: 'No Action',
};

const violationTypeLabels = {
  unauthorized_redistribution: 'Unauthorized Redistribution',
  modified_repost: 'Modified Repost',
  commercial_use: 'Commercial Use',
  potential_fair_use: 'Potential Fair Use',
  licensed_use: 'Licensed Use',
};

export default function GeminiPanel({ violation, onDmcaGenerated }) {
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice]         = useState(null);
  const [copied, setCopied]         = useState(false);

  if (!violation) {
    return (
      <div className="gemini-panel" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Sparkles size={32} color="#CBD5E1" />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          Select a violation to view Gemini analysis
        </p>
      </div>
    );
  }

  const cls = violation.geminiClassification || {};

  const generateDmca = async () => {
    setGenerating(true);
    setNotice(null);
    try {
      const res = await api.post(`/api/dmca/${violation.violationId}/generate`);
      setNotice(res.data.noticeText);
      toast.success('DMCA notice generated');
      if (onDmcaGenerated) onDmcaGenerated();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to generate DMCA notice');
    } finally {
      setGenerating(false);
    }
  };

  const copyNotice = () => {
    navigator.clipboard.writeText(notice || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="gemini-panel fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #818CF8, #38BDF8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Sparkles size={14} color="#fff" />
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>Gemini Analysis</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{violation.sharerHandle} · {violation.platform}</p>
        </div>
      </div>

      <div className="divider" style={{ margin: '4px 0' }} />

      {/* Violation type */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>VIOLATION TYPE</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {violationTypeLabels[cls.violationType] || cls.violationType || '—'}
        </p>
      </div>

      {/* Severity + Impact */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SEVERITY</p>
          <Badge severity={cls.severity || 'medium'} text={cls.severity || 'medium'} />
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>IMPACT</p>
          <Badge severity={
            cls.estimatedImpact === 'severe' ? 'critical' :
            cls.estimatedImpact === 'significant' ? 'high' :
            cls.estimatedImpact === 'moderate' ? 'medium' : 'low'
          } text={cls.estimatedImpact || '—'} />
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>WHITELISTED</p>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: cls.isWhitelisted ? 'var(--success)' : 'var(--danger)'
          }}>
            {cls.isWhitelisted ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* Reasoning */}
      {cls.reasoning && (
        <div style={{
          background: '#F8FAFC', border: '1px solid var(--border)',
          borderRadius: 8, padding: 12
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>AI REASONING</p>
          <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{cls.reasoning}</p>
        </div>
      )}

      {/* Sport context */}
      {cls.sportContext && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
          ⚡ {cls.sportContext}
        </p>
      )}

      {/* Recommended action */}
      {cls.recommendedAction && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>RECOMMENDED:</p>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: cls.recommendedAction === 'send_dmca' ? 'var(--critical)' :
                   cls.recommendedAction === 'monitor' ? 'var(--warning)' : 'var(--success)',
            textTransform: 'uppercase'
          }}>
            {actionLabels[cls.recommendedAction] || cls.recommendedAction}
          </span>
        </div>
      )}

      <div className="divider" style={{ margin: '4px 0' }} />

      {/* Generate DMCA button */}
      <button
        onClick={generateDmca}
        disabled={generating}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {generating ? (
          <><LoadingSpinner /> Generating...</>
        ) : (
          <><Send size={14} /> Generate DMCA Notice</>
        )}
      </button>

      {/* DMCA notice output */}
      {notice && (
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} /> Notice ready
            </p>
            <button onClick={copyNotice} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>
              {copied ? <><CheckCircle2 size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>
          <div className="dmca-text">{notice}</div>
        </div>
      )}
    </div>
  );
}
