import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

// Countdown timer component
function Countdown({ nextRunAt }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!nextRunAt) return;
    const tick = () => {
      const diff = new Date(nextRunAt) - new Date();
      if (diff <= 0) { setRemaining('Running...'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [nextRunAt]);

  return <span>{remaining || '—'}</span>;
}

// Progress bar
function ProgressBar({ done, total }) {
  if (done == null || total == null || total === 0) return null;
  const pct = Math.min((done / total) * 100, 100);
  const full = done >= total;
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>
        {full ? 'Done' : 'Remaining'} · {done}/{total}
      </div>
      <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: full ? 'var(--green)' : 'var(--accent)',
          borderRadius: '2px',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

// Stat card
function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
      <div>
        <div className="card-title">{label}</div>
        <div className="stat-value" style={accent ? { color: accent } : {}}>{value}</div>
        {sub && <div className="stat-label">{sub}</div>}
      </div>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: `rgba(${accent ? '99,102,241' : '99,102,241'},0.1)`,
        display: 'grid', placeItems: 'center', flexShrink: 0,
        color: accent || 'var(--accent)',
      }}>
        {icon}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [botStatus, setBotStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [pages, setPages] = useState([]);
  const [scraper, setScraper] = useState(null);
  const [totalNotifs, setTotalNotifs] = useState(0);
  const [notifsToday, setNotifsToday] = useState(0);
  const [missedTotal, setMissedTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [botRes, notifRes, pagesRes, scraperRes, notifTodayRes] = await Promise.allSettled([
        api.get('/bot/status'),
        api.get('/notifications?limit=5'),
        api.get('/pages'),
        api.get('/admin/scraper/status').catch(() => null),
        api.get('/notifications?limit=1&date_from=' + new Date().toISOString().slice(0, 10)),
      ]);

      if (botRes.status === 'fulfilled') setBotStatus(botRes.value.data);
      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.data.data || []);
        setTotalNotifs(notifRes.value.data.total || 0);
      }
      if (pagesRes.status === 'fulfilled') {
        const p = pagesRes.value.data || [];
        setPages(p);
        setMissedTotal(p.reduce((s, pg) => s + (pg.missed_count || 0), 0));
      }
      if (scraperRes.status === 'fulfilled' && scraperRes.value) {
        setScraper(scraperRes.value.data);
      }
      if (notifTodayRes.status === 'fulfilled') {
        setNotifsToday(notifTodayRes.value.data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const activePages = pages.filter((p) => p.is_enabled).length;
  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  if (loading) return (
    <UserLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '32px', height: '32px' }} />
      </div>
    </UserLayout>
  );

  const notifEnabled = pages.some((p) => p.is_enabled);

  return (
    <UserLayout>
      {/* Top header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: '10px', marginBottom: '28px', flexWrap: 'wrap', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {[
            { icon: '🔒', text: 'Secure' },
            { icon: '🔏', text: 'Private' },
            { icon: '📡', text: '24/7 Monitoring' },
          ].map((item) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text2)' }}>
              <span>{item.icon}</span><span>{item.text}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
          Welcome, <strong style={{ color: 'var(--text)' }}>{user?.email?.split('@')[0]}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Top 3 cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* Notification Status */}
            <div className="card" style={{ gridColumn: '1', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99,102,241,0.08)' }} />
              <div className="card-title">Notification Status</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>
                {notifEnabled ? 'You will receive alerts on Telegram.' : 'Notifications are currently off.'}
              </div>
              {!notifEnabled ? (
                <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', padding: '12px', fontSize: '13px' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: '4px' }}>⚠ Notifications are OFF.</div>
                  <div style={{ color: 'var(--text2)', lineHeight: 1.5 }}>Turn on notifications to receive instant alerts when new jobs match your filters.</div>
                </div>
              ) : (
                <span className="badge badge-green"><span className="dot" />Active</span>
              )}
            </div>

            {/* Next Scrape */}
            <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99,102,241,0.06)' }} />
              <div className="card-title">Next Scrape In</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-1px', marginBottom: '6px' }}>
                {scraper?.is_running ? <Countdown nextRunAt={scraper.next_run_at} /> : 'Stopped'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                Next scrape: {scraper?.next_run_at ? fmt(scraper.next_run_at) : '—'}
              </div>
              {scraper?.interval_minutes && (
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>
                  Scraping Interval · {scraper.interval_minutes} minutes
                </div>
              )}
            </div>

            {/* Missed Jobs */}
            <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(251,146,60,0.06)' }} />
              <div className="card-title">Missed Jobs</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: missedTotal > 0 ? '#f97316' : 'var(--green)', letterSpacing: '-1px', marginBottom: '6px' }}>
                {missedTotal}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>
                {missedTotal > 0 ? 'Jobs matched while notifications were OFF.' : 'No missed jobs.'}
              </div>
              {missedTotal > 0 && (
                <Link to="/subscriptions" className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }}>
                  View Missed Jobs →
                </Link>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            <StatCard
              label="Total Matched Jobs"
              value={totalNotifs.toLocaleString()}
              sub="All time"
              icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
            />
            <StatCard
              label="Jobs Today"
              value={notifsToday}
              sub="Matched today"
              icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
            />
            <StatCard
              label="Sources Active"
              value={activePages}
              sub={`Out of ${pages.length}`}
              icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>}
            />
            <StatCard
              label="Bot Status"
              value={botStatus?.connected ? 'Online' : 'Offline'}
              sub={botStatus?.bot ? `@${botStatus.bot.username}` : 'Not connected'}
              accent={botStatus?.connected ? '#34d399' : '#f87171'}
              icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>}
            />
          </div>

          {/* Latest Matched Jobs */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700 }}>Latest Matched Jobs</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>Real-time matched jobs from all sources.</div>
              </div>
              <Link to="/notifications" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>
                View All Jobs
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>

            {notifications.length === 0 ? (
              <div className="empty">
                <div style={{ marginBottom: '12px', opacity: 0.3 }}>
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                </div>
                <div className="empty-text">No jobs matched yet. Enable subscriptions to start receiving alerts.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {notifications.map((n, i) => (
                  <a key={n.id} href={n.job_url} target="_blank" rel="noreferrer" style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr auto auto auto',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                    borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Platform icon placeholder */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: `hsl(${(n.job_title?.charCodeAt(0) || 200) % 360}, 60%, 30%)`,
                      display: 'grid', placeItems: 'center',
                      fontSize: '14px', fontWeight: 700, color: '#fff',
                      flexShrink: 0,
                    }}>
                      {(n.job_title?.[0] || '?').toUpperCase()}
                    </div>

                    {/* Title + time */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.job_title || '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                        {timeAgo(n.sent_at)}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: '120px' }}>
                      <ProgressBar done={null} total={null} />
                    </div>

                    {/* Price */}
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent)', minWidth: '56px', textAlign: 'right' }}>
                      {n.job_price != null ? `$${n.job_price}` : '—'}
                    </div>

                    {/* New badge */}
                    {!n.is_read && (
                      <span style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--green)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                        New
                      </span>
                    )}
                  </a>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <Link to="/notifications" style={{ fontSize: '13px', color: 'var(--text2)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  View More Jobs
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </Link>
              </div>
            )}
          </div>

          {/* Scraping banner */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '10px', gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', display: 'grid', placeItems: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Scraping is running 24/7</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)' }}>We continuously monitor sources and notify you instantly when new jobs match your filters.</div>
              </div>
            </div>
            <Link to="/subscriptions" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
              Manage Sources
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Bot connection status */}
          <div className="card">
            <div className="card-title">Connection Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              {botStatus?.connected
                ? <span className="badge badge-green"><span className="dot" />Connected</span>
                : <span className="badge badge-red"><span className="dot" />Disconnected</span>}
            </div>
            {botStatus?.bot ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                  Bot: <strong style={{ color: 'var(--text)' }}>@{botStatus.bot.username}</strong>
                </div>
              </div>
            ) : (
              <Link to="/bot-settings" className="btn btn-accent btn-sm" style={{ marginTop: '4px' }}>
                Connect Bot
              </Link>
            )}
          </div>

          {/* Active Filters */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div className="card-title" style={{ margin: 0 }}>Active Filters</div>
              <Link to="/subscriptions" style={{ fontSize: '12px', color: 'var(--accent)' }}>Edit</Link>
            </div>
            {pages.filter((p) => p.is_enabled).length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text3)' }}>No active subscriptions</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pages.filter((p) => p.is_enabled).slice(0, 4).map((p) => (
                  <div key={p.id} style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{p.name}</div>
                    {(p.price_min != null || p.price_max != null) ? (
                      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                        Price: ${p.price_min ?? '0'} — ${p.price_max ?? '∞'}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>No price filter</div>
                    )}
                  </div>
                ))}
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
                  Filters are applied automatically to find the best matched jobs for you.
                </div>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card">
            <div className="card-title">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { to: '/subscriptions', label: 'Manage Subscriptions', icon: '📋' },
                { to: '/notifications', label: 'Notification History', icon: '🔔' },
                { to: '/bot-settings', label: 'Bot Settings', icon: '🤖' },
                { to: '/profile', label: 'Account Settings', icon: '⚙️' },
              ].map((item) => (
                <Link key={item.to} to={item.to} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '8px',
                  background: 'var(--bg3)', fontSize: '13px', color: 'var(--text2)',
                  transition: 'color 0.15s, background 0.15s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text2)'; }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
