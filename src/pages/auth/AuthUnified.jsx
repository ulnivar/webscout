import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import api from '../../lib/api';

const getStrength = (pass) => {
  if (!pass) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 10) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  const levels = [
    { label: '', color: '' },
    { label: 'Weak', color: '#ff4d4d' },
    { label: 'Fair', color: '#ffa500' },
    { label: 'Good', color: '#6366f1' },
    { label: 'Strong', color: '#4dff91' },
    { label: 'Very Strong', color: '#4dff91' },
  ];
  return { score, ...levels[score] };
};

export default function AuthUnified() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialMode = location.pathname === '/register' ? 'signup' : 'signin';
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getStrength(password), [password]);

  const submitAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (password !== confirm) return setError('Passwords do not match');
      if (password.length < 6) return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const res = mode === 'signin'
        ? await api.post('/auth/login', { email, password })
        : await api.post('/auth/register', { email, password });

      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || (mode === 'signin' ? 'Login failed' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <Logo />

        <div style={{ marginTop: '14px', marginBottom: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text2)', border: '1px solid var(--border)', background: 'var(--bg3)', borderRadius: '999px', padding: '4px 10px' }}>Email-first</span>
          <span style={{ fontSize: '11px', color: 'var(--text2)', border: '1px solid var(--border)', background: 'var(--bg3)', borderRadius: '999px', padding: '4px 10px' }}>Secure sign-in</span>
          <span style={{ fontSize: '11px', color: 'var(--text2)', border: '1px solid var(--border)', background: 'var(--bg3)', borderRadius: '999px', padding: '4px 10px' }}>No social login</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: step >= 1 ? 'var(--accent)' : 'var(--border)' }} />
          <div style={{ width: '24px', height: '1px', background: step >= 2 ? 'var(--accent)' : 'var(--border)' }} />
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: step >= 2 ? 'var(--accent)' : 'var(--border)' }} />
        </div>

        <h1 className="auth-title">{mode === 'signin' ? 'Sign in to WebScout' : 'Create your WebScout account'}</h1>
        <p className="auth-subtitle">
          {step === 1
            ? 'Start with your email. We will route you to login or signup automatically.'
            : mode === 'signin'
              ? 'Email found. Enter your password to continue.'
              : 'No account found. Set a password to finish signup.'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        {step === 1 ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              if (!email) return setError('Email is required');
              setLoading(true);
              try {
                const res = await api.post('/auth/check-email', { email });
                const nextMode = res.data?.exists ? 'signin' : 'signup';
                setMode(nextMode);
                navigate(nextMode === 'signin' ? '/login' : '/register', { replace: true });
                setStep(2);
              } catch (err) {
                setError(err.response?.data?.error || 'Could not continue');
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Checking account...' : 'Continue with email'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitAuth}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} readOnly />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'signin' ? '••••••••' : 'Min. 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  style={{ paddingRight: '44px' }}
                />
                <button type="button" className="input-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {showPass
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                {password && (
                  <div style={{ marginTop: '-8px', marginBottom: '14px' }}>
                    <div className="strength-bar">
                      <div className="strength-fill" style={{ width: `${(strength.score / 5) * 100}%`, background: strength.color }} />
                    </div>
                    {strength.label && <div style={{ fontSize: '12px', color: strength.color, marginTop: '4px' }}>{strength.label}</div>}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            {mode === 'signin' && (
              <div className="auth-link-row">
                <Link to="/forgot-password" className="auth-link-small">Forgot password?</Link>
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? (mode === 'signin' ? 'Signing you in...' : 'Creating your account...') : (mode === 'signin' ? 'Sign in now' : 'Create account')}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() => {
                setStep(1);
                setPassword('');
                setConfirm('');
                setError('');
              }}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
