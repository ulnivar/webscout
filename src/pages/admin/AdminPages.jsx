import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';

const emptyForm = { name: '', url: '', description: '' };

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editPage, setEditPage] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pages');
      setPages(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditPage(null); setForm(emptyForm); setError(''); setModal(true); };
  const openEdit = (p) => { setEditPage(p); setForm({ name: p.name, url: p.url, description: p.description || '' }); setError(''); setModal(true); };
  const closeModal = () => { setModal(false); setEditPage(null); setForm(emptyForm); setError(''); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) return setError('Name and URL required');
    setSaving(true);
    setError('');
    try {
      if (editPage) {
        await api.put(`/admin/pages/${editPage.id}`, form);
      } else {
        await api.post('/admin/pages', form);
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/admin/pages/${id}/toggle`);
      setPages((prev) => prev.map((p) => p.id === id ? { ...p, is_active: !p.is_active } : p));
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/pages/${id}`);
      setDeleteId(null);
      await load();
    } catch {}
  };

  return (
    <AdminLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Pages</h1>
          <p className="page-subtitle">Manage scraping targets</p>
        </div>
        <button className="btn btn-accent" onClick={openAdd}>+ Add Page</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      ) : pages.length === 0 ? (
        <div className="empty"><div className="empty-text">No pages yet. Add one to start scraping.</div></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>URL</th>
                  <th>Subscribers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{p.description}</div>}
                    </td>
                    <td>
                      <a href={p.url} target="_blank" rel="noreferrer"
                        style={{ fontSize: '12px', color: 'var(--accent)', maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.url}
                      </a>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{p.subscriber_count}</td>
                    <td>
                      <label className="toggle">
                        <input type="checkbox" checked={p.is_active} onChange={() => handleToggle(p.id)} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        {deleteId === p.id ? (
                          <>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Confirm</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p.id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 100, padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', animation: 'fadeUp 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>
                {editPage ? 'Edit Page' : 'Add Page'}
              </h2>
              <button className="logout-btn" onClick={closeModal}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Page Name *</label>
                <input className="input" placeholder="YouTube Jobs" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>URL *</label>
                <input className="input" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Description</label>
                <input className="input" placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editPage ? 'Save Changes' : 'Add Page'}
              </button>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
