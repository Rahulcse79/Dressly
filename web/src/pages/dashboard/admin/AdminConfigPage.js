import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../services/api';
import wsService from '../../../services/websocket';
import { IoSettings, IoSave } from 'react-icons/io5';

const AdminConfigPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getConfig();
      setConfig(res.data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Listen for config updates via WS
  useEffect(() => {
    const unsub = wsService.on('config_updated', () => {
      fetchConfig();
    });
    return unsub;
  }, [fetchConfig]);

  const handleChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await adminApi.updateConfig(config);
      setSuccess('Configuration saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save config');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading config...</div>;
  if (!config) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Failed to load config</div>;

  const fields = [
    { key: 'pro_price_inr', label: 'Pro Price (INR)', type: 'number' },
    { key: 'free_daily_ai_quota', label: 'Free Daily AI Quota', type: 'number' },
    { key: 'free_max_wardrobe_items', label: 'Free Max Wardrobe Items', type: 'number' },
    { key: 'ai_model', label: 'AI Model', type: 'text' },
    { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'toggle' },
    { key: 'registration_enabled', label: 'Registration Enabled', type: 'toggle' },
    { key: 'razorpay_enabled', label: 'Razorpay Enabled', type: 'toggle' },
  ];

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        <IoSettings style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary-light)' }} />
        Platform Configuration
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
        Manage global platform settings. Changes take effect immediately.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {fields.map(({ key, label, type }) => {
          if (config[key] === undefined) return null;
          return (
            <div key={key} className="form-group" style={{ margin: 0 }}>
              <label>{label}</label>
              {type === 'toggle' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => handleChange(key, !config[key])}
                    style={{
                      width: 48,
                      height: 26,
                      borderRadius: 13,
                      border: 'none',
                      background: config[key] ? 'var(--accent)' : 'var(--border-color)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: config[key] ? 25 : 3,
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                  <span style={{ fontSize: 14, color: config[key] ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {config[key] ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ) : (
                <input
                  className="form-input"
                  type={type}
                  value={config[key] ?? ''}
                  onChange={(e) => handleChange(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && <div className="form-error" style={{ marginTop: 16 }}>{error}</div>}
      {success && <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(0,217,165,0.1)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)', fontSize: 14 }}>{success}</div>}

      <button className="btn btn-primary btn-large" style={{ marginTop: 24 }} onClick={handleSave} disabled={saving}>
        <IoSave style={{ marginRight: 6 }} /> {saving ? 'Saving...' : 'Save Configuration'}
      </button>
    </div>
  );
};

export default AdminConfigPage;
