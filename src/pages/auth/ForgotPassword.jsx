import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // success | error
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('success');
      setMessage('If this email is registered, a reset link has been sent.');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo">
          GC<span>Panel</span>
        </div>

        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">
          Enter your email and we'll send a reset link
        </p>

        {status === 'success' && (
          <div className="alert alert-success">{message}</div>
        )}
        {status === 'error' && (
          <div className="alert alert-error">{message}</div>
        )}

        {status !== 'success' && (
          <form onSubmit={handleSubmit}>
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: status === 'success' ? '16px' : '24px' }}>
          <Link to="/login" style={{ color: 'var(--text2)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
