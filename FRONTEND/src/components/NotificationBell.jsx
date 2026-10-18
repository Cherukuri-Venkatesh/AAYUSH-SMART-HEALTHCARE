import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { apiGet, apiPut } from '../admin/utils/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const fetchNotifications = async () => {
    try {
      const res = await apiGet('/api/notifications/my');
      if (res?.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAsRead = async (id, roomId, appointmentId) => {
    try {
      await apiPut(`/api/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (roomId) {
        setIsOpen(false);
        navigate(`/consultation/room/${roomId}`);
      } else if (appointmentId) {
        setIsOpen(false);
        navigate('/my-appointments');
      }
    } catch {
      // Ignored
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiPut('/api/notifications/read-all', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="position-relative d-inline-block" ref={dropdownRef}>
      <button
        className="btn btn-light position-relative p-2 rounded-circle border shadow-sm"
        style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => setIsOpen(!isOpen)}
        title={t('notifications') || 'Notifications'}
      >
        <span style={{ fontSize: '1.2rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="card shadow-lg position-absolute end-0 mt-2"
          style={{
            width: '320px',
            maxHeight: '420px',
            zIndex: 1050,
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-2 px-3">
            <span className="fw-bold fs-6">🔔 {t('notifications') || 'Notifications'}</span>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm btn-link text-white text-decoration-none p-0"
                style={{ fontSize: '0.75rem' }}
                onClick={handleMarkAllAsRead}
              >
                {t('markAllAsRead') || 'Mark all as read'}
              </button>
            )}
          </div>

          <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '340px' }}>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted" style={{ fontSize: '0.85rem' }}>
                {t('noNotifications') || 'No notifications yet'}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`list-group-item list-group-item-action p-3 ${
                    !n.isRead ? 'bg-light border-start border-4 border-primary' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleMarkAsRead(n.id, n.roomId, n.appointmentId)}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.55rem' }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-secondary mb-1" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                    {n.message}
                  </p>
                  {n.roomId && (
                    <button
                      className="btn btn-sm btn-success py-0 px-2 mt-1"
                      style={{ fontSize: '0.7rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id, n.roomId, n.appointmentId);
                      }}
                    >
                      📹 {t('joinCall') || 'Join Call'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
