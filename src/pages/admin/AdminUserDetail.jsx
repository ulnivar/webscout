import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banning, setBanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/admin/users/${id}`);
      setUser(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleBan = async () => {
    setBanning(true);
    try {
      const res = await api.patch(`/admin/users/${id}/ban`);
      setUser((prev) => ({ ...prev, is_banned: res.data.is_banned }));
    } finally {
      setBanning(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${id}`);
      navigate('/admin/users');
    } catch { setDeleting(false); }
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleString() : '—';

  if (loading) return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner" />
      </div>
    </AdminLayout>
  );

  if (!user) return (
    <AdminLayout>
      <div className="empty"><div className="empty-text">User not found</div></div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/users')}>
          ← Back
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>User Detail</h1>
      </div>

      {/* Account info */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-title">Account</div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Email</div>
            <div style={{ fontWeight: 600 }}>{user.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Status</div>
            {user.is_banned
              ? <span className="badge badge-red">Banned</span>
              : <span className="badge badge-green">Active</span>}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Joined</div>
            <div style={{ fontSize: '13px' }}>{fmt(user.created_at)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Telegram Chat ID</div>
            <div style={{ fontSize: '13px', color: user.telegram_chat_id ? 'var(--text)' : 'var(--text3)' }}>
              {user.telegram_chat_id || 'Not set (/start not sent)'}
            </div>
          </div>
        </div>
      </div>

      {/* Bot info */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-title">Bot Connection</div>
        {user.bot ? (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Bot</div>
              <div style={{ fontWeight: 600 }}>@{user.bot.bot_username}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{user.bot.bot_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Status</div>
              {user.bot.is_connected
                ? <span className="badge badge-green"><span className="dot" />Connected</span>
                : <span className="badge badge-red"><span className="dot" />Disconnected</span>}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Connected at</div>
              <div style={{ fontSize: '13px' }}>{fmt(user.bot.connected_at)}</div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text3)', fontSize: '14px' }}>No bot connected</div>
        )}
      </div>

      {/* Subscriptions */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-title">Subscriptions ({user.subscriptions?.length || 0})</div>
        {!user.subscriptions?.length ? (
          <div style={{ color: 'var(--text3)', fontSize: '14px' }}>No subscriptions</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Enabled</th>
                  <th>Price Filter</th>
                </tr>
              </thead>
              <tbody>
                {user.subscriptions.map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{s.pages?.name || '—'}</td>
                    <td>
                      {s.is_enabled
                        ? <span className="badge badge-green" style={{ fontSize: '11px' }}>On</span>
                        : <span className="badge badge-red" style={{ fontSize: '11px' }}>Off</span>}
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      {s.price_min != null || s.price_max != null
                        ? `$${s.price_min ?? '0'} – $${s.price_max ?? '∞'}`
                        : <span style={{ color: 'var(--text3)' }}>No filter</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card" style={{ borderColor: 'rgba(255,77,77,0.2)' }}>
        <div className="card-title" style={{ color: 'var(--red)' }}>Actions</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-danger" onClick={handleBan} disabled={banning}>
            {banning ? '...' : user.is_banned ? 'Unban User' : 'Ban User'}
          </button>
          {!showDelete ? (
            <button className="btn btn-danger" onClick={() => setShowDelete(true)}>
              Delete User
            </button>
          ) : (
            <>
              <span style={{ fontSize: '14px', color: 'var(--text2)', display: 'flex', alignItems: 'center' }}>Sure?</span>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
