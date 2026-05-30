import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import api from '../../lib/api';

export default function BotSettings() {
  const [botStatus, setBotStatus] = useState(null);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bot/status');
      setBotStatus(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleConnect = async () => {
    setError(''); setSuccess('');
    if (!token.trim()) return setError('Token required');
    setSaving(true);
    try {
      const res = await api.post('/bot/connect', { token: token.trim() });
      setSuccess(`Bot connected: @${res.data.bot.username}`);
      setToken('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect bot');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setError(''); setSuccess('');
    setDisconnecting(true);
    try {
      await api.post('/bot/disconnect');
      setSuccess('Bot disconnected');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <UserLayout>
      <div className="page-header">
        <h1 className="page-title">Bot Settings</h1>
        <p className="page-subtitle">Connect your Telegram bot to receive job notifications</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{success}</div>}

      {/* Current status */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title">Current Status</div>
        {loading ? (
          <div className="spinner" />
        ) : botStatus?.connected ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="badge badge-green"><span className="dot" />Connected</span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>@{botStatus.bot.username}</span>
              <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{botStatus.bot.name}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '20px' }}>
              Connected at: {new Date(botStatus.bot.connected_at).toLocaleString()}
            </div>
            <button
              className="btn btn-danger"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect Bot'}
            </button>
          </div>
        ) : (
          <span className="badge badge-red"><span className="dot" />No bot connected</span>
        )}
      </div>

      {/* Connect form */}
      {!botStatus?.connected && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">Connect Bot</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                Bot Token
              </label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showToken ? 'text' : 'password'}
                  placeholder="123456:ABC-DEF..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="input-toggle"
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}
                  onClick={() => setShowToken(!showToken)}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showToken
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>
            <button className="btn btn-accent" onClick={handleConnect} disabled={saving}>
              {saving ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      )}

      {/* Guide */}
      <div className="card" style={{ borderColor: 'rgba(232,255,71,0.15)' }}>
        <div className="card-title">How to create a bot</div>
        <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '2' }}>
          <div>1. Open Telegram and search for <strong style={{ color: 'var(--text)' }}>@BotFather</strong></div>
          <div>2. Send <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>/newbot</code> and follow instructions</div>
          <div>3. Copy the bot token and paste it above</div>
          <div>4. After connecting, open your bot and send <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>/start</code> to activate notifications</div>
        </div>
        <a
          href="https://t.me/BotFather"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost btn-sm"
          style={{ marginTop: '16px', display: 'inline-flex' }}
        >
          Open BotFather
        </a>
      </div>
    </UserLayout>
  );
}
