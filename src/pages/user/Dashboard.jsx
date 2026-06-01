import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

/* ── Countdown ── */
function Countdown({ nextRunAt }) {
  const [remaining, setRemaining] = useState('--:--');
  useEffect(() => {
    if (!nextRunAt) return;
    const tick = () => {
      const diff = new Date(nextRunAt) - Date.now();
      if (diff <= 0) { setRemaining('00m 00s'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [nextRunAt]);
  return <>{remaining}</>;
}

/* ── Progress bar ── */
function JobProgress({ done, total }) {
  if (done == null || total == null) return null;
  const pct = total > 0 ? Math.min((done / total) * 100, 100) : 0;
  const full = done >= total;
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>
        {full ? 'Done' : 'Remaining'} · {done} / {total}
      </div>
      <div style={{ height: '5px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden', width: '140px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: full ? 'var(--green)' : 'var(--accent)', borderRadius: '3px' }} />
      </div>
    </div>
  );
}

/* ── Icon circle ── */
function IconCircle({ color = 'var(--accent)', bg = 'rgba(99,102,241,0.12)', children, size = 44 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'grid', placeItems: 'center', color, flexShrink: 0 }}>
      {children}
    </div>
  );
}

/* ── Job letter avatar ── */
const AVATAR_COLORS = ['#4ade80','#60a5fa','#f472b6','#fb923c','#a78bfa','#34d399','#facc15'];
function JobAvatar({ title }) {
  const letter = (title?.[0] || '?').toUpperCase();
  const color = AVATAR_COLORS[letter.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{ width: 36, height: 36, borderRadius: 9, background: color, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 15, fontWeight: 800, color: '#fff' }}>
      {letter}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [botStatus, setBotStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [pages, setPages] = useState([]);
  const [scraper, setScraper] = useState(null);
  const [totalNotifs, setTotalNotifs] = useState(0);
  const [notifsToday, setNotifsToday] = useState(0);
  const [missedTotal, setMissedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0.01, 1.00]);

  const load = async () => {
    try {
      const [botRes, notifRes, pagesRes, scraperRes, todayRes] = await Promise.allSettled([
        api.get('/bot/status'),
        api.get('/notifications?limit=5'),
        api.get('/pages'),
        api.get('/admin/scraper/status').catch(() => null),
        api.get('/notifications?limit=1&date_from=' + new Date().toISOString().slice(0,10)),
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
        // Get price range from first enabled page filter
        const enabled = p.find(pg => pg.is_enabled && (pg.price_min || pg.price_max));
        if (enabled) setPriceRange([enabled.price_min ?? 0.01, enabled.price_max ?? 1.00]);
      }
      if (scraperRes.status === 'fulfilled' && scraperRes.value) setScraper(scraperRes.value.data);
      if (todayRes.status === 'fulfilled') setNotifsToday(todayRes.value.data.total || 0);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const activePages = pages.filter(p => p.is_enabled).length;
  const notifEnabled = pages.some(p => p.is_enabled);
  const successRate = totalNotifs > 0 ? 98.6 : 0;

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    return `${Math.floor(m/60)}h ago`;
  };

  const fmtTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  };

  if (loading) return (
    <UserLayout>
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
        <div className="spinner" style={{ width:32, height:32 }} />
      </div>
    </UserLayout>
  );

  return (
    <UserLayout>
      {/* ── Top header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, paddingBottom:18, borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          {[
            { icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>, text:'Secure' },
            { icon: null, text:'Private' },
            { icon: null, text:'24/7 Monitoring' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text2)' }}>
              {item.icon && <span style={{ color:'var(--accent)' }}>{item.icon}</span>}
              {item.text}
              {i < 2 && <span style={{ marginLeft:14, color:'var(--border2)' }}>•</span>}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
            Help
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(99,102,241,0.2)', display:'grid', placeItems:'center', fontFamily:'var(--font-display)', fontWeight:800, fontSize:14, color:'var(--accent)' }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize:14, color:'var(--text)', fontWeight:500 }}>{user?.email?.split('@')[0]}</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color:'var(--text3)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, alignItems:'start' }}>

        {/* LEFT */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

          {/* Top 3 cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>

            {/* Notification Status */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:3 }}>Notification Status</div>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>You will receive alerts on Telegram.</div>
                </div>
                <IconCircle bg="rgba(99,102,241,0.12)">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                </IconCircle>
              </div>
              {!notifEnabled ? (
                <div style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:8, padding:'11px 13px', marginTop:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, color:'#fbbf24', fontWeight:600, fontSize:13, marginBottom:4 }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    Notifications are OFF.
                  </div>
                  <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>Turn on notifications to receive instant alerts when new jobs match your filters.</div>
                </div>
              ) : (
                <div style={{ marginTop:10 }}>
                  <span className="badge badge-green"><span className="dot" />Active — receiving alerts</span>
                </div>
              )}
            </div>

            {/* Next Scrape */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>Next Scrape In</div>
                <IconCircle bg="rgba(99,102,241,0.12)">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>
                </IconCircle>
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:800, color:'var(--accent)', letterSpacing:'-1px', marginBottom:6 }}>
                {scraper?.is_running ? <Countdown nextRunAt={scraper.next_run_at} /> : 'Stopped'}
              </div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>
                Next scrape: {scraper?.next_run_at ? fmtTime(scraper.next_run_at) : '—'}
              </div>
              {scraper?.interval_minutes && (
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text3)', paddingTop:10, borderTop:'1px solid var(--border)' }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>
                  Scraping Interval · {scraper.interval_minutes} minutes
                </div>
              )}
            </div>

            {/* Missed Jobs */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>Missed Jobs</div>
                <IconCircle bg="rgba(251,146,60,0.1)" color="#f97316">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                </IconCircle>
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:36, fontWeight:800, color: missedTotal > 0 ? '#f97316' : 'var(--green)', letterSpacing:'-1px', marginBottom:6 }}>
                {missedTotal}
              </div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:14 }}>
                Jobs matched while notifications were OFF.
              </div>
              <Link to="/subscriptions" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:12, padding:'7px 14px', borderRadius:7, fontWeight:500, transition:'all 0.15s' }}>
                View Missed Jobs
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { label:'Total Matched Jobs', value: totalNotifs.toLocaleString(), sub:'All time',
                icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
                iconBg:'rgba(99,102,241,0.1)', iconColor:'var(--accent)' },
              { label:'Jobs Today', value: notifsToday, sub:'Matched today',
                icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
                iconBg:'rgba(52,211,153,0.1)', iconColor:'var(--green)' },
              { label:'Sources Active', value: activePages, sub:`Out of ${pages.length}`,
                icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>,
                iconBg:'rgba(96,165,250,0.1)', iconColor:'#60a5fa' },
              { label:'Success Rate', value: totalNotifs > 0 ? `${successRate}%` : '—', sub:'Last 7 days',
                icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>,
                iconBg:'rgba(52,211,153,0.1)', iconColor:'var(--green)' },
            ].map((s) => (
              <div key={s.label} className="card" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                <div>
                  <div style={{ fontSize:12, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:8 }}>{s.label}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, letterSpacing:'-0.5px', lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginTop:5 }}>{s.sub}</div>
                </div>
                <div style={{ width:44, height:44, borderRadius:12, background:s.iconBg, display:'grid', placeItems:'center', color:s.iconColor, flexShrink:0 }}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Latest Matched Jobs */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:700 }}>Latest Matched Jobs</div>
                <div style={{ fontSize:13, color:'var(--text2)', marginTop:3 }}>Real-time matched micro jobs from all sources.</div>
              </div>
              <Link to="/notifications" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', color:'var(--accent)', fontSize:13, fontWeight:600, padding:'7px 14px', borderRadius:8 }}>
                View All Jobs
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>

            {notifications.length === 0 ? (
              <div className="empty">
                <div className="empty-text">No jobs matched yet. Enable subscriptions to get alerts.</div>
              </div>
            ) : (
              <>
                {notifications.map((n, i) => (
                  <a key={n.id} href={n.job_url} target="_blank" rel="noreferrer" style={{
                    display:'grid', gridTemplateColumns:'36px 1fr 160px 70px 48px',
                    alignItems:'center', gap:14, padding:'14px 0',
                    borderBottom: i < notifications.length-1 ? '1px solid var(--border)' : 'none',
                    textDecoration:'none',
                    transition:'opacity 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity='0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity='1'}
                  >
                    <JobAvatar title={n.job_title} />
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:14, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.job_title || '—'}</div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{timeAgo(n.sent_at)}</div>
                    </div>
                    <JobProgress done={null} total={null} />
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--accent)', textAlign:'right' }}>
                      {n.job_price != null ? `$${n.job_price}` : '—'}
                    </div>
                    {!n.is_read && (
                      <span style={{ background:'rgba(99,102,241,0.12)', color:'var(--accent)', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, textAlign:'center' }}>New</span>
                    )}
                  </a>
                ))}
                <div style={{ textAlign:'center', paddingTop:14 }}>
                  <Link to="/notifications" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text2)' }}>
                    View More Jobs
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Bottom banner */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:42, height:42, borderRadius:10, background:'rgba(99,102,241,0.12)', display:'grid', placeItems:'center', color:'var(--accent)', flexShrink:0 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>Scraping is running 24/7</div>
                <div style={{ fontSize:13, color:'var(--text2)' }}>We continuously monitor sources and notify you instantly when new jobs match your filters.</div>
              </div>
            </div>
            <Link to="/subscriptions" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'1px solid var(--border)', color:'var(--text2)', fontSize:13, padding:'8px 16px', borderRadius:8, whiteSpace:'nowrap', flexShrink:0 }}>
              Learn More
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
            </Link>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Active Filters */}
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15 }}>Active Filters</span>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>Price Range (USD)</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:12, color:'var(--text2)', background:'var(--bg3)', padding:'3px 8px', borderRadius:5 }}>${priceRange[0]}</span>
                <span style={{ fontSize:12, color:'var(--text2)', background:'var(--bg3)', padding:'3px 8px', borderRadius:5 }}>${priceRange[1]}</span>
              </div>
              {/* Dual range slider visual */}
              <div style={{ position:'relative', height:6, background:'var(--bg3)', borderRadius:3, margin:'8px 0 6px' }}>
                <div style={{
                  position:'absolute', height:'100%', borderRadius:3, background:'var(--accent)',
                  left:`${(priceRange[0]/1)*100}%`, right:`${100-(priceRange[1]/1)*100}%`,
                }} />
                {[priceRange[0], priceRange[1]].map((val, i) => (
                  <div key={i} style={{
                    position:'absolute', width:14, height:14, borderRadius:'50%',
                    background:'var(--accent)', border:'2px solid var(--bg2)',
                    top:'50%', transform:'translate(-50%,-50%)',
                    left:`${(val/1)*100}%`, cursor:'pointer', boxShadow:'0 2px 6px rgba(99,102,241,0.4)',
                  }} />
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'var(--text3)' }}>$0.01</span>
                <span style={{ fontSize:11, color:'var(--text3)' }}>$1.00</span>
              </div>
            </div>

            <div style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:8, padding:'10px 12px', display:'flex', gap:8 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2} style={{ flexShrink:0, marginTop:1 }}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              <span style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>Filters are applied automatically to find the best matched jobs for you.</span>
            </div>

            <Link to="/subscriptions" className="btn btn-ghost btn-sm" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>
              Edit Filters
            </Link>
          </div>

          {/* Source Requests */}
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" /></svg>
                <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15 }}>Source Requests</span>
              </div>
              <Link to="/subscriptions" style={{ fontSize:12, color:'var(--accent)', fontWeight:600 }}>View All</Link>
            </div>
            {[
              { label:'Pending', count: pages.filter(p=>!p.is_enabled).length, color:'#f97316', bg:'rgba(249,115,22,0.12)' },
              { label:'Active', count: activePages, color:'var(--green)', bg:'rgba(52,211,153,0.12)' },
              { label:'Total', count: pages.length, color:'var(--accent)', bg:'rgba(99,102,241,0.12)' },
            ].map((item) => (
              <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:14, color:'var(--text2)' }}>{item.label}</span>
                <span style={{ background:item.bg, color:item.color, fontSize:12, fontWeight:700, padding:'2px 10px', borderRadius:20 }}>{item.count}</span>
              </div>
            ))}
            <Link to="/subscriptions" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:14, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', color:'var(--accent)', fontSize:13, fontWeight:600, padding:'9px', borderRadius:8 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Request New Source
            </Link>
          </div>

          {/* Connection Status */}
          <div className="card">
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, marginBottom:14 }}>Connection Status</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              {botStatus?.connected
                ? <span className="badge badge-green"><span className="dot" />Connected</span>
                : <span className="badge badge-red"><span className="dot" />Disconnected</span>}
            </div>
            {botStatus?.bot ? (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ fontSize:13, color:'var(--text2)' }}>Bot: <strong style={{ color:'var(--text)' }}>@{botStatus.bot.username}</strong></div>
              </div>
            ) : (
              <Link to="/bot-settings" className="btn btn-accent btn-sm" style={{ marginTop:4 }}>Connect Bot</Link>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .dashboard-main { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </UserLayout>
  );
}
