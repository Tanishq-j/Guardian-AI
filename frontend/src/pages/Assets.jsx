import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image, Plus, ShieldCheck, ExternalLink, Clock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import useApi from '../hooks/useApi';

const ORG_ID = 'demo-org';

export default function Assets() {
  const { data: assets, loading } = useApi(`/api/assets/?orgId=${ORG_ID}`);

  return (
    <Layout title="Assets">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            All registered assets protected with dual-signal Guardian AI
          </p>
        </div>
        <Link to="/assets/register" className="btn btn-primary">
          <Plus size={14} /> Register New Asset
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <LoadingSpinner label="Loading assets..." />
        </div>
      ) : !assets?.length ? (
        <div className="card">
          <EmptyState
            icon={Image}
            title="No assets registered"
            subtitle="Register your first asset to start protecting your sports media"
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Asset ID</th>
                <th>Signal A</th>
                <th>Signal B (pHash)</th>
                <th>Violations</th>
                <th>Registered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.assetId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: '#EFF6FF', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Image size={16} color="var(--primary)" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)' }}>
                          {a.filename}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {a.orgId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {a.assetId?.slice(0, 12)}…
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: a.signalA_status === 'embedded' ? 'var(--success)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      {a.signalA_status === 'embedded' ? <><ShieldCheck size={12} /> Embedded</> : '—'}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {a.signalB_phash?.slice(0, 12) || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700, fontSize: 13,
                      color: (a.violationCount || 0) > 0 ? 'var(--danger)' : 'var(--success)'
                    }}>
                      {a.violationCount || 0}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} />
                      {a.uploadedAt
                        ? new Date(a.uploadedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                        : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                      background: a.status === 'active' ? '#D1FAE5' : '#F1F5F9',
                      color: a.status === 'active' ? '#065F46' : 'var(--text-muted)'
                    }}>
                      {a.status || 'unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
