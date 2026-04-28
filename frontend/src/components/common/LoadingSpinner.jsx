export default function LoadingSpinner({ label = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div className="spinner" />
      {label && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>}
    </div>
  );
}
