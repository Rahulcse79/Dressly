import React, { useState, useEffect } from 'react';
import { userApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { IoPersonCircle, IoSave, IoTrash, IoWarning } from 'react-icons/io5';

const GENDERS = ['male', 'female', 'non-binary', 'prefer-not-to-say'];
const BODY_TYPES = ['slim', 'athletic', 'average', 'muscular', 'curvy', 'plus-size'];
const STYLE_PREFS = ['casual', 'formal', 'streetwear', 'minimalist', 'bohemian', 'classic', 'sporty', 'vintage', 'preppy', 'grunge', 'elegant'];

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    display_name: '',
    gender: '',
    body_type: '',
    style_preferences: [],
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name || '',
        gender: user.gender || '',
        body_type: user.body_type || '',
        style_preferences: user.style_preferences || [],
      });
    }
  }, [user]);

  const togglePref = (p) => {
    setForm((f) => ({
      ...f,
      style_preferences: f.style_preferences.includes(p)
        ? f.style_preferences.filter((s) => s !== p)
        : [...f.style_preferences, p],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await userApi.updateProfile(form);
      await refreshUser();
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    try {
      await userApi.deleteAccount();
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        <IoPersonCircle style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary-light)' }} />
        Profile
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
        Update your profile to get better AI recommendations.
      </p>

      {/* Account info (read-only) */}
      <div style={{ padding: 20, background: 'var(--input-bg)', borderRadius: 'var(--radius-md)', marginBottom: 24, border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email</span>
            <p style={{ fontWeight: 500, marginTop: 2 }}>{user.email}</p>
          </div>
          <div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Account Type</span>
            <p style={{ fontWeight: 500, marginTop: 2, textTransform: 'capitalize' }}>{user.role || 'free'}</p>
          </div>
          <div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Joined</span>
            <p style={{ fontWeight: 500, marginTop: 2 }}>{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label>Display Name</label>
          <input
            className="form-input"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            placeholder="Your display name"
          />
        </div>

        <div className="form-group">
          <label>Gender</label>
          <select className="form-input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">Select...</option>
            {GENDERS.map(g => <option key={g} value={g} style={{ textTransform: 'capitalize' }}>{g.replace(/-/g, ' ')}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Body Type</label>
          <select className="form-input" value={form.body_type} onChange={(e) => setForm({ ...form, body_type: e.target.value })}>
            <option value="">Select...</option>
            {BODY_TYPES.map(b => <option key={b} value={b} style={{ textTransform: 'capitalize' }}>{b.replace(/-/g, ' ')}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Style Preferences</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STYLE_PREFS.map((p) => (
              <button
                key={p}
                type="button"
                className={`btn ${form.style_preferences.includes(p) ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: 12, textTransform: 'capitalize' }}
                onClick={() => togglePref(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ padding: '10px 16px', background: 'rgba(0,217,165,0.1)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)', fontSize: 14, marginBottom: 12 }}>{success}</div>}

        <button type="submit" className="btn btn-primary btn-large" disabled={saving}>
          <IoSave style={{ marginRight: 6 }} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Danger Zone */}
      <div style={{ marginTop: 64, padding: 24, border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.05)' }}>
        <h3 style={{ color: 'var(--error)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          <IoWarning style={{ verticalAlign: 'middle', marginRight: 6 }} /> Danger Zone
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button className="btn btn-outline" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => setShowDeleteConfirm(true)}>
            <IoTrash style={{ marginRight: 6 }} /> Delete Account
          </button>
        ) : (
          <div>
            <p style={{ fontSize: 13, marginBottom: 8 }}>Type <strong>DELETE</strong> to confirm:</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="DELETE" style={{ maxWidth: 160 }} />
              <button className="btn" style={{ background: 'var(--error)', color: '#fff' }} onClick={handleDelete} disabled={deleteText !== 'DELETE' || deleting}>
                {deleting ? 'Deleting...' : 'Confirm'}
              </button>
              <button className="btn btn-outline" onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
