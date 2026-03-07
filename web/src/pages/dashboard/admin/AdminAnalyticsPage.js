import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../services/api';
import { IoAnalytics, IoPeople, IoSparkles, IoDiamond, IoGlobe, IoCash, IoTrendingUp } from 'react-icons/io5';

const AdminAnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAnalytics();
      setStats(res.data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading analytics...</div>;
  if (!stats) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Failed to load analytics</div>;

  const cards = [
    { label: 'Total Users', value: stats.total_users, icon: <IoPeople />, color: 'var(--primary-light)' },
    { label: 'Active Users (30d)', value: stats.active_users, icon: <IoTrendingUp />, color: 'var(--accent)' },
    { label: 'Pro Users', value: stats.pro_users, icon: <IoDiamond />, color: 'var(--secondary)' },
    { label: 'Total Generations', value: stats.total_generations, icon: <IoSparkles />, color: '#F59E0B' },
    { label: 'Revenue (₹)', value: `₹${(stats.total_revenue_inr || 0).toLocaleString()}`, icon: <IoCash />, color: '#10B981' },
    { label: 'WS Connections', value: stats.active_ws_connections, icon: <IoGlobe />, color: '#8B5CF6' },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        <IoAnalytics style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary-light)' }} />
        Analytics Dashboard
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
        Overview of platform metrics.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {cards.map((card) => (
          <div key={card.label} style={{
            padding: 24,
            background: 'var(--card-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{card.label}</span>
              <span style={{ fontSize: 20, color: card.color }}>{card.icon}</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{card.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Generations by day */}
      {stats.generations_by_day && stats.generations_by_day.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Generations (Last 7 Days)</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {stats.generations_by_day.map((d, i) => (
                  <tr key={i}>
                    <td>{d.date}</td>
                    <td>{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
