import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (iso) => iso ? new Date(iso).toLocaleString() : 'Never';

  if (loading) return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">System overview and health</p>
      </div>

      {/* Stats grid */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-title">Total Users</div>
          <div className="stat-value">{stats?.total_users ?? 0}</div>
          <div className="stat-label">registered</div>
        </div>
        <div className="card">
          <div className="card-title">Active Bots</div>
          <div className="stat-value">{stats?.active_bots ?? 0}</div>
          <div className="stat-label">connected</div>
        </div>
        <div className="card">
          <div className="card-title">Total Pages</div>
          <div className="stat-value">{stats?.total_pages ?? 0}</div>
          <div className="stat-label">configured</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-title">Jobs Scraped Today</div>
          <div className="stat-value">{stats?.jobs_scraped_today ?? 0}</div>
        </div>
        <div className="card">
          <div className="card-title">Notifications Sent Today</div>
          <div className="stat-value">{stats?.notifications_sent_today ?? 0}</div>
        </div>
      </div>

      {/* Scraper status */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title">Scraper Status</div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            {stats?.scraper?.is_running
              ? <span className="badge badge-green"><span className="dot" />Running</span>
              : <span className="badge badge-red"><span className="dot" />Stopped</span>}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
            Last run: <span style={{ color: 'var(--text)' }}>{fmt(stats?.scraper?.last_run_at)}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
            Next run: <span style={{ color: 'var(--text)' }}>{fmt(stats?.scraper?.next_run_at)}</span>
          </div>
        </div>
      </div>

      {/* Recent logs */}
      <div className="card">
        <div className="card-title">Recent Activity</div>
        {!stats?.recent_logs?.length ? (
          <div className="empty"><div className="empty-text">No logs yet</div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.recent_logs.map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                <span className={`badge ${log.status === 'success' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '11px' }}>
                  {log.status}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text2)', flex: 1 }}>
                  <strong style={{ color: 'var(--text)' }}>{log.pages?.name || 'Unknown'}</strong> — {log.message}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{fmt(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
