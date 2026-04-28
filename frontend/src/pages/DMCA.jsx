import { useState } from 'react';
import { FileText, Copy, CheckCircle2, Send, ExternalLink, Clock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import useApi from '../hooks/useApi';
import api from '../config/api';
import toast from 'react-hot-toast';

const ORG_ID = 'demo-org';

const STATUS_COLORS = {
  draft:        { bg: '#DBEAFE', text: '#1E40AF' },
  sent:         { bg: '#D1FAE5', text: '#065F46' },
  acknowledged: { bg: '#FEF3C7', text: '#92400E' },
  resolved:     { bg: '#F0FDF4', text: '#166534' },
};

export default function DMCA() {
  const [copiedId, setCopiedId]   = useState(null);
  const [expandedId, setExpanded] = useState(null);
  const [updatingId, setUpdating] = useState(null);

  const { data: notices, loading, refetch } = useApi(`/api/dmca/?orgId=${ORG_ID}`);

  const copyNotice = (notice) => {
    navigator.clipboard.writeText(notice.noticeText || '');
    setCopiedId(notice.noticeId);
    toast.success('Notice copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const updateStatus = async (noticeId, status) => {
    setUpdating(noticeId);
    try {
      await api.patch(`/api/dmca/${noticeId}/status`, { status });
      toast.success(`Status updated to "${status}"`);
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Layout title="DMCA Notices">
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          All Gemini-generated DMCA takedown notices. Track status from draft to resolved.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <LoadingSpinner label="Loading notices..." />
        </div>
      ) : !notices?.length ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No DMCA notices yet"
            subtitle="Generate DMCA notices from the Violations page or Dashboard"
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notices.map(notice => {
            const sc = STATUS_COLORS[notice.status] || STATUS_COLORS.draft;
            const isExpanded = expandedId === notice.noticeId;

            return (
              <div key={notice.noticeId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header row */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px', cursor: 'pointer'
                  }}
                  onClick={() => setExpanded(isExpanded ? null : notice.noticeId)}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: '#EFF6FF', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <FileText size={16} color="var(--primary)" />
                  </div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                        DMCA Notice
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px',
                        borderRadius: 5, background: sc.bg, color: sc.text,
                        textTransform: 'uppercase'
                      }}>
                        {notice.status}
                      </span>
                    </div>
                    <p className="truncate" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      ID: {notice.noticeId}  ·  Violation: {notice.violationId?.slice(0, 12)}…
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} />
                      {notice.generatedAt
                        ? new Date(notice.generatedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                        : '—'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 500 }}>
                      {isExpanded ? 'Collapse ↑' : 'Expand ↓'}
                    </span>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="fade-in" style={{ padding: '0 18px 18px' }}>
                    <div className="divider" />

                    {/* Status actions */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>
                        Update status:
                      </span>
                      {['draft', 'sent', 'acknowledged', 'resolved'].map(s => {
                        const isCurrent = notice.status === s;
                        return (
                          <button
                            key={s}
                            disabled={isCurrent || updatingId === notice.noticeId}
                            onClick={() => updateStatus(notice.noticeId, s)}
                            style={{
                              padding: '4px 12px',
                              borderRadius: 6, fontSize: 11, fontWeight: 600,
                              border: '1px solid',
                              cursor: isCurrent ? 'default' : 'pointer',
                              opacity: isCurrent ? 0.5 : 1,
                              background: isCurrent ? STATUS_COLORS[s]?.bg : 'var(--surface)',
                              color: isCurrent ? STATUS_COLORS[s]?.text : 'var(--text-muted)',
                              borderColor: isCurrent ? STATUS_COLORS[s]?.text : 'var(--border)',
                              transition: 'all 150ms ease',
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>

                    {/* Notice text */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                        <button onClick={() => copyNotice(notice)} className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>
                          {copiedId === notice.noticeId
                            ? <><CheckCircle2 size={12} /> Copied</>
                            : <><Copy size={12} /> Copy notice</>}
                        </button>
                      </div>
                      <div className="dmca-text">{notice.noticeText}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
