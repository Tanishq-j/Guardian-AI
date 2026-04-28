import { useState } from 'react';
import ViolationCard from './ViolationCard';
import EmptyState from '../common/EmptyState';
import { AlertTriangle } from 'lucide-react';

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function sortViolations(violations) {
  return [...violations].sort((a, b) => {
    const sa = SEV_ORDER[a.geminiClassification?.severity] ?? 4;
    const sb = SEV_ORDER[b.geminiClassification?.severity] ?? 4;
    if (sa !== sb) return sa - sb;
    return new Date(b.detectedAt || 0) - new Date(a.detectedAt || 0);
  });
}

export default function ViolationQueue({ violations = [], selectedId, onSelect }) {
  const sorted = sortViolations(violations);

  if (!violations.length) {
    return <EmptyState icon={AlertTriangle} title="No violations found" subtitle="Register assets and run detection to populate the queue" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map(v => (
        <ViolationCard
          key={v.violationId}
          violation={v}
          selected={v.violationId === selectedId}
          onClick={() => onSelect(v)}
        />
      ))}
    </div>
  );
}
