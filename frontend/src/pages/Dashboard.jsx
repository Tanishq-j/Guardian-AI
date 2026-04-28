import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, AlertTriangle, Zap, Send, Shield,
  ArrowRight, Radio, Cpu
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import MetricCard from '../components/common/MetricCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ViolationQueue from '../components/violations/ViolationQueue';
import GeminiPanel from '../components/violations/GeminiPanel';
import useApi from '../hooks/useApi';

const ORG_ID = 'demo-org';

export default function Dashboard() {
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [dmcaRefreshKey, setDmcaRefreshKey]       = useState(0);

  const { data: violations, loading: vLoading, refetch: refetchV } =
    useApi(`/api/violations/?orgId=${ORG_ID}`);
  const { data: assets, loading: aLoading } =
    useApi(`/api/assets/?orgId=${ORG_ID}`);

  // Auto-select first critical violation on load
  useMemo(() => {
    if (violations?.length && !selectedViolation) {
      const critical = violations.find(v => v.geminiClassification?.severity === 'critical');
      setSelectedViolation(critical || violations[0]);
    }
  }, [violations]);

  /* ── Derived metrics ── */
  const vList    = violations || [];
  const aList    = assets    || [];
  const active   = vList.filter(v => v.dmcaStatus !== 'resolved');
  const critical = vList.filter(v => v.geminiClassification?.severity === 'critical');
  const dmcaSent = vList.filter(v => ['sent', 'resolved'].includes(v.dmcaStatus));
  const totalAssets = aList.length || 1; // avoid /0
  const compliance  = Math.max(0, Math.min(100,
    Math.round(((totalAssets - critical.length) / totalAssets) * 100)
  ));

  const signalA = vList.filter(v => v.detectionSignal === 'A' || v.detectionSignal === 'both').length;
  const signalB = vList.filter(v => v.detectionSignal === 'B' || v.detectionSignal === 'both').length;
  const total   = vList.length || 1;

  const loading = vLoading || aLoading;

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
          <LoadingSpinner label="Loading dashboard..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" violationCount={active.length}>
      {/* ── Section 1: Metrics ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 14,
        marginBottom: 24
      }}>
        <MetricCard
          title="Registered Assets"
          value={aList.length}
          subtitle="Protected with dual-signal"
          icon={Image}
          color="var(--primary)"
          iconBg="#E0F2FE"
        />
        <MetricCard
          title="Active Violations"
          value={active.length}
          subtitle="Pending resolution"
          icon={AlertTriangle}
          color="var(--danger)"
          iconBg="#FEE2E2"
        />
        <MetricCard
          title="Critical"
          value={critical.length}
          subtitle="Immediate action needed"
          icon={Zap}
          color="var(--critical)"
          iconBg="#FEE2E2"
        />
        <MetricCard
          title="DMCA Sent"
          value={dmcaSent.length}
          subtitle="Notices dispatched"
          icon={Send}
          color="var(--warning)"
          iconBg="#FEF3C7"
        />
        <MetricCard
          title="Compliance Score"
          value={`${compliance}%`}
          subtitle="Asset protection health"
          icon={Shield}
          color="var(--success)"
          iconBg="#D1FAE5"
        />
      </div>

      {/* ── Section 2: Violation Queue + Gemini Panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 24 }}>
        {/* Left: Violation Queue */}
        <div>
          <div className="section-header">
            <span className="section-title">
              <AlertTriangle size={15} color="var(--danger)" />
              Active Violations
              {active.length > 0 && (
                <span style={{
                  background: '#FEE2E2', color: '#991B1B',
                  fontSize: 11, fontWeight: 700,
                  padding: '1px 7px', borderRadius: 10
                }}>{active.length}</span>
              )}
            </span>
            <Link
              to="/violations"
              style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <ViolationQueue
            violations={vList}
            selectedId={selectedViolation?.violationId}
            onSelect={setSelectedViolation}
          />
        </div>

        {/* Right: Gemini Panel */}
        <div>
          <div className="section-header">
            <span className="section-title">
              <span style={{ fontSize: 15 }}>✨</span>
              AI Analysis
            </span>
          </div>
          <GeminiPanel
            violation={selectedViolation}
            onDmcaGenerated={() => {
              refetchV();
              setDmcaRefreshKey(k => k + 1);
            }}
          />
        </div>
      </div>

      {/* ── Section 3: Detection Signal Stats ── */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span className="section-title">
            Detection Signal Breakdown
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Signal A catches standard infringers · Signal B catches AI-edited copies
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Signal A */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Radio size={13} color="var(--primary)" /> Signal A — DCT Watermark
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                {signalA} violations ({Math.round((signalA / total) * 100)}%)
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${Math.round((signalA / total) * 100)}%`,
                background: 'var(--primary)'
              }} />
            </div>
          </div>
          {/* Signal B */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Cpu size={13} color="#7C3AED" /> Signal B — Neural Fingerprint
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>
                {signalB} violations ({Math.round((signalB / total) * 100)}%)
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${Math.round((signalB / total) * 100)}%`,
                background: '#7C3AED'
              }} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
