import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title, violationCount = 0 }) {
  const { user } = useAuth();

  return (
    <header className="top-header">
      <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <Bell size={18} color="var(--text-muted)" />
          {violationCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--danger)', color: '#fff',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {violationCount > 9 ? '9+' : violationCount}
            </span>
          )}
        </div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="avatar"
              style={{ width: 28, height: 28, borderRadius: '50%' }}
            />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--primary-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'var(--primary-dark)'
            }}>
              {user?.displayName?.[0] || '?'}
            </div>
          )}
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            {user?.displayName?.split(' ')[0] || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
}
