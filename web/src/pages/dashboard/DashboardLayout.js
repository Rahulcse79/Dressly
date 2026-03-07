import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  IoSparkles, IoShirt, IoFlash, IoNotifications, IoPerson,
  IoCard, IoSettings, IoLogOut, IoMenu, IoClose,
  IoSunny, IoMoon, IoPeople, IoAnalytics
} from 'react-icons/io5';

const DashboardLayout = () => {
  const { user, isAdmin, isPro, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount, wsStatus } = useNotifications();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = user?.display_name
    ? user.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || '??';

  const navItems = [
    { to: '/dashboard', icon: <IoFlash />, label: 'AI Generate', end: true },
    { to: '/dashboard/wardrobe', icon: <IoShirt />, label: 'Wardrobe' },
    { to: '/dashboard/notifications', icon: <IoNotifications />, label: 'Notifications', badge: unreadCount },
    { to: '/dashboard/subscription', icon: <IoCard />, label: 'Subscription' },
    { to: '/dashboard/profile', icon: <IoPerson />, label: 'Profile' },
  ];

  const adminItems = [
    { to: '/dashboard/admin', icon: <IoAnalytics />, label: 'Analytics', end: true },
    { to: '/dashboard/admin/users', icon: <IoPeople />, label: 'Users' },
    { to: '/dashboard/admin/config', icon: <IoSettings />, label: 'Config' },
  ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/" className="navbar-logo" style={{ fontSize: 20 }}>
            <div className="navbar-logo-icon" style={{ width: 30, height: 30, borderRadius: 8, fontSize: 14 }}>
              <IoSparkles />
            </div>
            Dressly
            {isPro && <span style={{ fontSize: 10, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>PRO</span>}
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Main</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
              {item.badge > 0 && <span className="sidebar-badge">{item.badge}</span>}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="sidebar-section-title">Admin</div>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.display_name || user?.email}</div>
              <div className="sidebar-user-role">{user?.role || 'user'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="top-bar">
          <div className="top-bar-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="icon-btn mobile-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <IoClose /> : <IoMenu />}
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`ws-indicator ${wsStatus}`} title={`WebSocket: ${wsStatus}`} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {wsStatus === 'connected' ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="top-bar-right">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
              {isDark ? <IoSunny /> : <IoMoon />}
            </button>
            <button className="icon-btn" onClick={() => navigate('/dashboard/notifications')} title="Notifications">
              <IoNotifications />
              {unreadCount > 0 && <span className="badge-dot" />}
            </button>
            <button className="icon-btn" onClick={handleLogout} title="Logout">
              <IoLogOut />
            </button>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
