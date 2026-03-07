import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../services/api';
import { IoPeople, IoSearch, IoBan, IoCheckmarkCircle } from 'react-icons/io5';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updating, setUpdating] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers(page, 20, search || undefined);
      setUsers(res.data.data.data || []);
      setTotalPages(res.data.data.total_pages || 1);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      await adminApi.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch { /* ignore */ }
    setUpdating(null);
  };

  const handleBan = async (userId, banned) => {
    setUpdating(userId);
    try {
      await adminApi.banUser(userId, banned);
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: banned } : u));
    } catch { /* ignore */ }
    setUpdating(null);
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        <IoPeople style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary-light)' }} />
        User Management
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Manage user accounts, roles, and access.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <IoSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search users by email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading users...</div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>No users found</h3>
          <p>No users match your search.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ opacity: u.is_banned ? 0.5 : 1 }}>
                    <td style={{ fontWeight: 500 }}>{u.email}</td>
                    <td>{u.display_name || '—'}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updating === u.id}
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: 12, minWidth: 80 }}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      {u.is_banned ? (
                        <span style={{ color: 'var(--error)', fontSize: 12, fontWeight: 600 }}>
                          <IoBan style={{ verticalAlign: 'middle', marginRight: 4 }} /> Banned
                        </span>
                      ) : (
                        <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
                          <IoCheckmarkCircle style={{ verticalAlign: 'middle', marginRight: 4 }} /> Active
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: 12, color: u.is_banned ? 'var(--accent)' : 'var(--error)', borderColor: u.is_banned ? 'var(--accent)' : 'var(--error)' }}
                        onClick={() => handleBan(u.id, !u.is_banned)}
                        disabled={updating === u.id}
                      >
                        {u.is_banned ? (
                          <><IoCheckmarkCircle style={{ marginRight: 4 }} /> Unban</>
                        ) : (
                          <><IoBan style={{ marginRight: 4 }} /> Ban</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span style={{ padding: '8px 16px', fontSize: 14, color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsersPage;
