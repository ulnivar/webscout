import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import api from '../../lib/api';

function PageCard({ page, onUpdated }) {
  const [enabled, setEnabled] = useState(page.is_enabled);
  const [priceMin, setPriceMin] = useState(page.price_min ?? '');
  const [priceMax, setPriceMax] = useState(page.price_max ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [missed, setMissed] = useState(page.missed_count || 0);

  const save = async (is_enabled, min, max) => {
    setSaving(true); setSaved(false);
    try {
      const res = await api.put(`/subscriptions/${page.id}`, {
        is_enabled,
        price_min: min !== '' ? parseFloat(min) : null,
        price_max: max !== '' ? parseFloat(max) : null,
      });
      setSaved(true);
      if (is_enabled) setMissed(0); // Clear missed after enabling
      setTimeout(() => setSaved(false), 2000);
      if (onUpdated) onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    await save(newEnabled, priceMin, priceMax);
  };

  return (
    <div className="card" style={{ opacity: enabled ? 1 : 0.65, transition: 'opacity 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: enabled ? '12px' : 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>{page.name}</div>
            {!enabled && missed > 0 && (
              <span className="badge badge-yellow" style={{ fontSize: '11px' }}>
                {missed} missed
              </span>
            )}
          </div>
          {page.description && (
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '3px' }}>{page.description}</div>
          )}
        </div>
        <label className="toggle" style={{ marginLeft: '16px', flexShrink: 0 }}>
          <input type="checkbox" checked={enabled} onChange={handleToggle} />
          <span className="toggle-slider" />
        </label>
      </div>

      {enabled && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Price Filter
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="input input-sm"
              type="number"
              placeholder="Min $"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              style={{ width: '100px' }}
            />
            <span style={{ color: 'var(--text3)', fontSize: '13px' }}>to</span>
            <input
              className="input input-sm"
              type="number"
              placeholder="Max $"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              style={{ width: '100px' }}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => save(enabled, priceMin, priceMax)} disabled={saving}>
              {saving ? '...' : saved ? '✓ Saved' : 'Save'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--text3)' }}
              onClick={() => { setPriceMin(''); setPriceMax(''); save(enabled, '', ''); }}
            >
              Reset
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
            Leave blank to receive all jobs regardless of price
          </div>
        </div>
      )}
    </div>
  );
}

export default function Subscriptions() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/pages')
      .then((res) => setPages(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const totalMissed = pages.reduce((sum, p) => sum + (p.missed_count || 0), 0);

  return (
    <UserLayout>
      <div className="page-header">
        <h1 className="page-title">Subscriptions</h1>
        <p className="page-subtitle">Toggle notifications per page and set price filters</p>
      </div>

      {/* Missed jobs banner */}
      {totalMissed > 0 && (
        <div style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <span style={{ fontSize: '14px', color: 'var(--text)' }}>
            You missed <strong>{totalMissed} job(s)</strong> while notifications were off. Re-enable to get a summary.
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      ) : pages.length === 0 ? (
        <div className="empty">
          <div style={{ marginBottom: '12px', opacity: 0.4 }}>
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="empty-text">No pages available yet. Admin will add pages soon.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pages.map((page) => (
            <PageCard key={page.id} page={page} onUpdated={load} />
          ))}
        </div>
      )}
    </UserLayout>
  );
}
