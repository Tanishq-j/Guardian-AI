import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Login() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (e) {
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        {/* Logo */}
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', boxShadow: '0 4px 16px rgba(56,189,248,0.35)'
        }}>
          <Shield size={32} color="#fff" />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          Guardian <span style={{ color: 'var(--primary)' }}>AI</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>
          Sports Media Protection Platform
        </p>

        {/* Sign in button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '11px 20px',
            border: '1px solid var(--border)',
            borderRadius: 10,
            background: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text)',
            transition: 'all 150ms ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Google G icon */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {error && (
          <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 14 }}>{error}</p>
        )}

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 28, lineHeight: 1.6 }}>
          For the Google Solution Challenge 2026.<br />
          Dual-signal sports media protection.
        </p>
      </div>
    </div>
  );
}
