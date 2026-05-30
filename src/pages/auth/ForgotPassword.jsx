import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Logo from '../../components/Logo';

// Step indicator
const Steps = ({ current }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
    {['Email', 'OTP', 'New Password'].map((label, i) => {
      const step = i + 1;
      const done = current > step;
      const active = current === step;
      return (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: done ? 'var(--accent)' : active ? 'rgba(99,102,241,0.2)' : 'var(--bg3)',
            border: `1.5px solid ${active || done ? 'var(--accent)' : 'var(--border)'}`,
            display: 'grid', placeItems: 'center',
            fontSize: '12px', fontWeight: 700,
            color: done ? '#fff' : active ? 'var(--accent)' : 'var(--text3)',
            transition: 'all 0.2s',
          }}>
            {done ? '✓' : step}
          </div>
          <span style={{ fontSize: '13px', color: active ? 'var(--text)' : 'var(--text3)', fontWeight: active ? 600 : 400 }}>
            {label}
          </span>
          {i < 2 && <div style={{ width: '24px', height: '1px', background: done ? 'var(--accent)' : 'var(--border)' }} />}
        </div>
      );
    })}
  </div>
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch {
      setError('Something went wrong. Try again.');
    } finally { setLoading(false); }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: otp.toUpperCase() });
      setResetToken(res.data.reset_token);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPass !== confirmPass) return setError('Passwords do not match');
    if (newPass.length < 6) return setError('Min. 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { reset_token: resetToken, new_password: newPass });
      navigate('/login', { state: { message: 'Password reset successfully. Please login.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo"><Logo /></div>

        <Steps current={step} />

        {error && <div className="alert alert-error">{error}</div>}

        {/* Step 1: Email */}
        {step === 1 && (
          <>
            <h1 className="auth-title">Reset password</h1>
            <p className="auth-subtitle">Enter your email to receive an 8-character OTP</p>
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <>
            <h1 className="auth-title">Enter OTP</h1>
            <p className="auth-subtitle">
              Check <strong style={{ color: 'var(--text)' }}>{email}</strong> for your 8-character OTP. Valid 5 minutes.
            </p>
            <form onSubmit={handleOTPSubmit}>
              <div className="form-group">
                <label className="form-label">OTP Code</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="A3K9BX2M"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.toUpperCase().slice(0, 8))}
                  required
                  maxLength={8}
                  style={{ letterSpacing: '4px', fontSize: '20px', fontWeight: 700, textAlign: 'center', fontFamily: 'monospace' }}
                  autoComplete="one-time-code"
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading || otp.length < 8}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' }}
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
              >
                Wrong email? Go back
              </button>
            </div>
          </>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <>
            <h1 className="auth-title">New password</h1>
            <p className="auth-subtitle">Set your new password below</p>
            <form onSubmit={handleResetSubmit}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrapper">
                  <input
                    className="form-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    style={{ paddingRight: '44px' }}
                    autoComplete="new-password"
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
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" placeholder="Repeat password"
                  value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required autoComplete="new-password" />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <div className="auth-footer" style={{ marginTop: '24px' }}>
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
