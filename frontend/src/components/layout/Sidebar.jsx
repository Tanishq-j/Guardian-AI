import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Image, Plus, AlertTriangle,
  FileText, Shield, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assets',           icon: Image,           label: 'Assets' },
  { to: '/assets/register',  icon: Plus,            label: 'Register Asset' },
  { to: '/violations',       icon: AlertTriangle,   label: 'Violations' },
  { to: '/dmca',             icon: FileText,        label: 'DMCA Notices' },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--primary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Shield size={18} color="#fff" />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.2 }}>Guardian</p>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', lineHeight: 1.2 }}>AI</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="avatar"
              style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--primary-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'var(--primary-dark)'
            }}>
              {user?.displayName?.[0] || '?'}
            </div>
          )}
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p className="truncate" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
              {user?.displayName || 'User'}
            </p>
            <p className="truncate" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="btn btn-ghost"
          style={{ width: '100%', fontSize: 12, justifyContent: 'center' }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
