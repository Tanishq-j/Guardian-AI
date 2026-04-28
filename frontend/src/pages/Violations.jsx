import { useState } from 'react';
import { AlertTriangle, Filter } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ViolationQueue from '../components/violations/ViolationQueue';
import GeminiPanel from '../components/violations/GeminiPanel';
import useApi from '../hooks/useApi';

const ORG_ID = 'demo-org';
const SEVERITIES = ['all', 'critical', 'high', 'medium', 'low'];

export default function Violations() {
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [filterSev, setFilterSev] = useState('all');

  const { data: violations, loading, refetch } = useApi(`/api/violations/?orgId=${ORG_ID}`);

  const filtered = (violations || []).filter(v => {
    if (filterSev === 'all') return true;
    return v.geminiClassification?.severity === filterSev;
  });

  return (
    <Layout title="Violations" violationCount={(violations || []).filter(v => v.dmcaStatus !== 'resolved').length}>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Filter size={14} color="var(--text-muted)" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Severity:</span>
        {SEVERITIES.map(s => (
          <button
            key={s}
            onClick={() => setFilterSev(s)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              background: filterSev === s ? 'var(--primary)' : 'var(--surface)',
              color: filterSev === s ? '#fff' : 'var(--text-muted)',
              borderColor: filterSev === s ? 'var(--primary)' : 'var(--border)',
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {filtered.length} violation{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <LoadingSpinner label="Loading violations..." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          <div>
            <ViolationQueue
              violations={filtered}
              selectedId={selectedViolation?.violationId}
              onSelect={setSelectedViolation}
            />
          </div>
          <div>
            <GeminiPanel violation={selectedViolation} onDmcaGenerated={refetch} />
          </div>
        </div>
      )}
    </Layout>
  );
}
