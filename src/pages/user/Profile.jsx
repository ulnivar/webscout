import { useState } from 'react';
import UserLayout from '../../components/UserLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [passForm, setPassForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePassChange = async (e) => {
    e.preventDefault();
    setPassError(''); setPassSuccess('');
    if (passForm.new_password !== passForm.confirm) return setPassError('Passwords do not match');
    if (passForm.new_password.length < 6) return setPassError('Min. 6 characters');
    setPassLoading(true);
    try {
      await api.post('/auth/change-password', {
        old_password: passForm.old_password,
        new_password: passForm.new_password,
      });
      setPassSuccess('Password changed successfully');
      setPassForm({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPassError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPassLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/auth/delete-account');
      logout();
      navigate('/login');
    } catch {
      setDeleting(false);
    }
  };

  return (
    <UserLayout>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      {/* Account info */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title">Account Info</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,0.12)', display: 'grid', placeItems: 'center', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px' }}>
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>{user?.email}</div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '2px' }}>User account</div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title">Change Password</div>

        {passError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{passError}</div>}
        {passSuccess && <div className="alert alert-success" style={{ marginBottom: '16px' }}>{passSuccess}</div>}

        <form onSubmit={handlePassChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Current Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={passForm.old_password}
              onChange={(e) => setPassForm({ ...passForm, old_password: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>New Password</label>
            <input
              className="input"
              type="password"
              placeholder="Min. 6 characters"
              value={passForm.new_password}
              onChange={(e) => setPassForm({ ...passForm, new_password: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Confirm New Password</label>
            <input
              className="input"
              type="password"
              placeholder="Repeat new password"
              value={passForm.confirm}
              onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
              required
            />
          </div>
          <div>
            <button className="btn btn-accent" type="submit" disabled={passLoading}>
              {passLoading ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ borderColor: 'rgba(255,77,77,0.2)' }}>
        <div className="card-title" style={{ color: 'var(--red)' }}>Danger Zone</div>
        <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '16px' }}>
          Deleting your account is permanent. All data will be removed.
        </p>

        {!showDeleteConfirm ? (
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete Account
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text2)' }}>Are you sure?</span>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
