import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      if (search) params.append('search', search);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const fmt = (iso) => new Date(iso).toLocaleDateString();

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">{users.length} users found</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          className="input input-sm"
          style={{ width: '240px' }}
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <button className="btn btn-accent btn-sm" onClick={load}>Search</button>
        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
          {['all', 'connected', 'not_connected'].map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-accent' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'connected' ? 'Bot Connected' : 'No Bot'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <div className="spinner" />
          </div>
        ) : users.length === 0 ? (
          <div className="empty"><div className="empty-text">No users found</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Bot</th>
                  <th>Subscriptions</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/users/${u.id}`)}>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{u.email}</td>
                    <td>
                      {u.bot_connected
                        ? <span className="badge badge-green" style={{ fontSize: '11px' }}><span className="dot" />Connected</span>
                        : <span style={{ fontSize: '12px', color: 'var(--text3)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text)' }}>{u.active_subscriptions}</td>
                    <td>
                      {u.is_banned
                        ? <span className="badge badge-red" style={{ fontSize: '11px' }}>Banned</span>
                        : <span className="badge badge-green" style={{ fontSize: '11px' }}>Active</span>}
                    </td>
                    <td style={{ fontSize: '12px' }}>{fmt(u.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/users/${u.id}`)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
