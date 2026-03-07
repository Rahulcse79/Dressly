import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { IoNotifications, IoCheckmarkDone, IoTime, IoSparkles, IoCard, IoPerson, IoShield } from 'react-icons/io5';

const ICON_MAP = {
  ai_generation_complete: <IoSparkles style={{ color: 'var(--primary-light)' }} />,
  subscription_activated: <IoCard style={{ color: 'var(--accent)' }} />,
  subscription_cancelled: <IoCard style={{ color: 'var(--warning)' }} />,
  welcome: <IoPerson style={{ color: 'var(--secondary)' }} />,
  admin_broadcast: <IoShield style={{ color: 'var(--error)' }} />,
};

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead, loading, unreadCount } = useNotifications();

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>
            <IoNotifications style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--secondary)' }} />
            Notifications
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline" onClick={markAllAsRead}>
            <IoCheckmarkDone style={{ marginRight: 6 }} /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>You'll receive notifications for AI generations, subscription updates, and more.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${!notif.read_at ? 'unread' : ''}`}
              onClick={() => !notif.read_at && markAsRead(notif.id)}
              style={{ cursor: !notif.read_at ? 'pointer' : 'default' }}
            >
              <div className="notification-icon">
                {ICON_MAP[notif.notification_type] || <IoNotifications style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div className="notification-body">
                <p className="notification-title">{notif.title}</p>
                <p className="notification-message">{notif.message}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <IoTime size={12} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatTimeAgo(notif.created_at)}
                  </span>
                  {!notif.read_at && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary-light)' }}>• New</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function formatTimeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default NotificationsPage;
