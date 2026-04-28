export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'var(--primary)', iconBg = '#EFF6FF' }) {
  return (
    <div className="metric-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p className="metric-title">{title}</p>
          <p className="metric-value" style={{ color, marginTop: 6 }}>{value ?? '—'}</p>
        </div>
        {Icon && (
          <div className="metric-icon" style={{ background: iconBg }}>
            <Icon size={18} color={color} />
          </div>
        )}
      </div>
      {subtitle && <p className="metric-subtitle">{subtitle}</p>}
    </div>
  );
}
