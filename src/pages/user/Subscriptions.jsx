import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import api from '../../lib/api';

function PageCard({ page, onSave }) {
  const [enabled, setEnabled] = useState(page.is_enabled);
  const [priceMin, setPriceMin] = useState(page.price_min ?? '');
  const [priceMax, setPriceMax] = useState(page.price_max ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    await save(newEnabled, priceMin, priceMax);
  };

  const save = async (is_enabled, min, max) => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put(`/subscriptions/${page.id}`, {
        is_enabled,
        price_min: min !== '' ? parseFloat(min) : null,
        price_max: max !== '' ? parseFloat(max) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ opacity: enabled ? 1 : 0.6, transition: 'opacity 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{page.name}</div>
          {page.description && (
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{page.description}</div>
          )}
        </div>
        <label className="toggle" style={{ marginLeft: '16px' }}>
          <input type="checkbox" checked={enabled} onChange={handleToggle} />
          <span className="toggle-slider" />
        </label>
      </div>

      {enabled && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Price Filter
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => save(enabled, priceMin, priceMax)}
              disabled={saving}
            >
              {saving ? '...' : saved ? '✓ Saved' : 'Save'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setPriceMin(''); setPriceMax(''); save(enabled, '', ''); }}
              style={{ color: 'var(--text3)' }}
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

  useEffect(() => {
    api.get('/pages')
      .then((res) => setPages(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserLayout>
      <div className="page-header">
        <h1 className="page-title">Subscriptions</h1>
        <p className="page-subtitle">Toggle notifications per page and set price filters</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      ) : pages.length === 0 ? (
        <div className="empty">
          <div className="empty-text">No pages available yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pages.map((page) => (
            <PageCard key={page.id} page={page} />
          ))}
        </div>
      )}
    </UserLayout>
  );
}
