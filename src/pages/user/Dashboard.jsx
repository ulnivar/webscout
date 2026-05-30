import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import api from '../../lib/api';

export default function Dashboard() {
  const [botStatus, setBotStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [subCount, setSubCount] = useState(0);
  const [notifToday, setNotifToday] = useState(0);
  const [lastScraped, setLastScraped] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [botRes, notifRes, subsRes, configRes] = await Promise.allSettled([
          api.get('/bot/status'),
          api.get('/notifications?limit=5'),
          api.get('/subscriptions'),
          api.get('/admin/scraper/status').catch(() => null),
        ]);

        if (botRes.status === 'fulfilled') setBotStatus(botRes.value.data);
        if (notifRes.status === 'fulfilled') {
          setNotifications(notifRes.value.data.data || []);
          setNotifToday(notifRes.value.data.total || 0);
        }
        if (subsRes.status === 'fulfilled') {
          setSubCount((subsRes.value.data || []).filter((s) => s.is_enabled).length);
        }
        if (configRes.status === 'fulfilled' && configRes.value) {
          setLastScraped(configRes.value.data?.last_run_at);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatTime = (iso) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString();
  };

  const formatPrice = (price) => (price != null ? `$${price}` : '—');

  if (loading) {
    return (
      <UserLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="spinner" />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your account and notifications</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-title">Bot Status</div>
          {botStatus?.connected ? (
            <span className="badge badge-green"><span className="dot" />Connected</span>
          ) : (
            <span className="badge badge-red"><span className="dot" />Disconnected</span>
          )}
          {botStatus?.bot && (
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
              @{botStatus.bot.username}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Subscribed Pages</div>
          <div className="stat-value">{subCount}</div>
          <div className="stat-label">active pages</div>
        </div>

        <div className="card">
          <div className="card-title">Notifications</div>
          <div className="stat-value">{notifToday}</div>
          <div className="stat-label">total received</div>
        </div>

        <div className="card">
          <div className="card-title">Last Scraped</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
            {formatTime(lastScraped)}
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="card-title" style={{ margin: 0 }}>Recent Notifications</div>
          <a href="/notifications" style={{ fontSize: '13px', color: 'var(--accent)' }}>View all</a>
        </div>

        {notifications.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <div className="empty-text">No notifications yet</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Price</th>
                  <th>Page</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <a href={n.job_url} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--text)', fontWeight: 500 }}>
                        {n.job_title || '—'}
                      </a>
                    </td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      {formatPrice(n.job_price)}
                    </td>
                    <td>{n.pages?.name || '—'}</td>
                    <td style={{ fontSize: '12px' }}>{formatTime(n.sent_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
