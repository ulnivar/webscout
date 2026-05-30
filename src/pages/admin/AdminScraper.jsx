import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';

export default function AdminScraper() {
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [interval, setIntervalVal] = useState(10);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const logsEndRef = useRef(null);

  const loadAll = async () => {
    try {
      const [cfgRes, logsRes] = await Promise.all([
        api.get('/admin/scraper/status'),
        api.get('/admin/scraper/logs?limit=30'),
      ]);
      setConfig(cfgRes.data);
      setIntervalVal(cfgRes.data.interval_minutes || 10);
      setLogs(logsRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await api.post('/admin/scraper/toggle');
      setConfig((prev) => ({ ...prev, is_running: res.data.is_running }));
    } finally {
      setToggling(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await api.post('/admin/scraper/run-now');
      setTimeout(() => { loadAll(); setRunning(false); }, 3000);
    } catch { setRunning(false); }
  };

  const handleSaveInterval = async () => {
    setSaving(true);
    try {
      await api.put('/admin/scraper/interval', { interval_minutes: Number(interval) });
      setConfig((prev) => ({ ...prev, interval_minutes: Number(interval) }));
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="page-title">Scraper Control</h1>
        <p className="page-subtitle">Manage the job scraper engine</p>
      </div>

      {/* Status + controls */}
      <div className="grid-2" style={{ marginBottom: '20px' }}>
        <div className="card">
          <div className="card-title">Scraper Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            {config?.is_running
              ? <span className="badge badge-green"><span className="dot" />Running</span>
              : <span className="badge badge-red"><span className="dot" />Stopped</span>}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>
            Last run: <span style={{ color: 'var(--text)' }}>{fmt(config?.last_run_at)}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
            Next run: <span style={{ color: 'var(--text)' }}>{fmt(config?.next_run_at)}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${config?.is_running ? 'btn-danger' : 'btn-accent'}`}
              onClick={handleToggle}
              disabled={toggling}
            >
              {toggling ? '...' : config?.is_running ? 'Stop Scraper' : 'Start Scraper'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleRunNow}
              disabled={running}
            >
              {running ? 'Running...' : 'Run Now'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Scrape Interval</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
            Current: every <strong style={{ color: 'var(--text)' }}>{config?.interval_minutes} minutes</strong>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              className="input input-sm"
              style={{ width: '140px' }}
              value={interval}
              onChange={(e) => setIntervalVal(Number(e.target.value))}
            >
              {[5, 10, 15, 20, 30, 60].map((m) => (
                <option key={m} value={m}>Every {m} min</option>
              ))}
            </select>
            <button className="btn btn-accent btn-sm" onClick={handleSaveInterval} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '12px' }}>
            Changing interval restarts the cron if running
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="card-title" style={{ margin: 0 }}>Scraper Logs</div>
          <button className="btn btn-ghost btn-sm" onClick={loadAll}>Refresh</button>
        </div>

        {logs.length === 0 ? (
          <div className="empty"><div className="empty-text">No logs yet</div></div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.map((log, i) => (
              <div key={i} style={{
                display: 'flex', gap: '12px', alignItems: 'center',
                padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px',
                borderLeft: `3px solid ${log.status === 'success' ? 'var(--green)' : 'var(--red)'}`,
              }}>
                <span style={{ fontSize: '11px', color: log.status === 'success' ? 'var(--green)' : 'var(--red)', fontWeight: 600, minWidth: '48px' }}>
                  {log.status.toUpperCase()}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text2)', flex: 1 }}>
                  <strong style={{ color: 'var(--text)' }}>{log.pages?.name || '—'}</strong>
                  {' · '}{log.message}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                  {fmt(log.created_at)}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
