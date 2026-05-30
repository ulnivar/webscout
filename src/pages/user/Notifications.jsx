import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import api from '../../lib/api';

export default function Notifications() {
  const [data, setData] = useState([]);
  const [pages, setPages] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page_id: '', date_from: '', date_to: '' });
  const limit = 20;

  const load = async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit });
      if (filters.page_id) params.append('page_id', filters.page_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const res = await api.get(`/notifications?${params}`);
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/subscriptions').then((res) => setPages(res.data || []));
    load(1);
  }, []);

  const totalPages = Math.ceil(total / limit);
  const formatPrice = (p) => (p != null ? `$${p}` : '—');
  const formatTime = (iso) => new Date(iso).toLocaleString();

  return (
    <UserLayout>
      <div className="page-header">
        <h1 className="page-title">Notification History</h1>
        <p className="page-subtitle">{total} total notifications received</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Page</label>
            <select
              className="input input-sm"
              style={{ width: '160px' }}
              value={filters.page_id}
              onChange={(e) => setFilters({ ...filters, page_id: e.target.value })}
            >
              <option value="">All pages</option>
              {pages.map((p) => (
                <option key={p.page_id} value={p.page_id}>{p.pages?.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>From</label>
            <input
              className="input input-sm"
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>To</label>
            <input
              className="input input-sm"
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
          </div>
          <button className="btn btn-accent btn-sm" onClick={() => load(1)}>Apply</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ page_id: '', date_from: '', date_to: '' }); load(1); }}>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <div className="spinner" />
          </div>
        ) : data.length === 0 ? (
          <div className="empty">
            <div className="empty-text">No notifications found</div>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Price</th>
                    <th>Page</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <a href={n.job_url} target="_blank" rel="noreferrer"
                          style={{ color: n.is_read ? 'var(--text2)' : 'var(--text)', fontWeight: n.is_read ? 400 : 600 }}>
                          {n.job_title || '—'}
                        </a>
                      </td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        {formatPrice(n.job_price)}
                      </td>
                      <td style={{ fontSize: '13px' }}>{n.pages?.name || '—'}</td>
                      <td style={{ fontSize: '12px' }}>{formatTime(n.sent_at)}</td>
                      <td>
                        {n.is_read
                          ? <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Read</span>
                          : <span className="badge badge-yellow" style={{ fontSize: '11px' }}>New</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => load(page - 1)} disabled={page === 1}>
                  Previous
                </button>
                <span style={{ fontSize: '13px', color: 'var(--text2)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  {page} / {totalPages}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => load(page + 1)} disabled={page === totalPages}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
