export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: 12,
      color: 'var(--text-muted)'
    }}>
      {Icon && (
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: '#F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={22} color="var(--text-muted)" />
        </div>
      )}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14, marginBottom: 4 }}>{title}</p>
        {subtitle && <p style={{ fontSize: 12 }}>{subtitle}</p>}
      </div>
    </div>
  );
}
