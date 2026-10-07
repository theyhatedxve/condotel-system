import { useEffect, useRef, useState } from 'react';

import {
  BedDouble,
  Bell,
  CalendarDays,
  ChevronDown,
  Clock3,
  CreditCard,
  KeyRound,
  LoaderCircle,
  LogOut,
  Search,
  UserRound,
  WalletCards,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../features/notifications/notificationApi';

import { searchGlobal } from '../features/search/searchApi';

import { useAuth } from '../features/auth/useAuth';

import { formatCurrency } from '../utils/formatCurrency';

const resultIcons = {
  GUEST: UserRound,

  ROOM: BedDouble,

  RESERVATION: CalendarDays,

  PAYMENT: CreditCard,

  TRANSACTION: WalletCards,
};

function formatType(type) {
  switch (type) {
    case 'GUEST':
      return 'Guest';

    case 'ROOM':
      return 'Room';

    case 'RESERVATION':
      return 'Reservation';

    case 'PAYMENT':
      return 'Payment';

    case 'TRANSACTION':
      return 'Transaction';

    default:
      return type;
  }
}

function formatNotificationTime(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function Topbar() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const [query, setQuery] = useState('');

  const [results, setResults] = useState([]);

  const [searching, setSearching] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);

  const debounceRef = useRef(null);

  // Debouncing limits requests; this sequence also prevents late responses
  // from replacing newer results or repopulating a cleared search.
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadCount() {
      try {
        const result = await getUnreadNotificationCount();

        if (!cancelled) {
          setUnreadCount(Number(result.count ?? 0));
        }
      } catch {
        // Keep the topbar usable
        // if polling fails.
      }
    }

    loadUnreadCount();

    const intervalId = window.setInterval(loadUnreadCount, 30000);

    return () => {
      cancelled = true;

      window.clearInterval(intervalId);
    };
  }, []);

  async function loadNotifications() {
    setNotificationsLoading(true);

    try {
      const result = await getNotifications(10);

      setNotifications(Array.isArray(result) ? result : []);

      const unread = await getUnreadNotificationCount();

      setUnreadCount(Number(unread.count ?? 0));
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function handleNotificationBell() {
    const nextOpen = !notificationsOpen;

    setNotificationsOpen(nextOpen);

    setSearchOpen(false);
    setProfileOpen(false);

    if (nextOpen) {
      await loadNotifications();
    }
  }

  async function handleNotificationClick(notification) {
    try {
      if (!notification.isRead) {
        await markNotificationRead(notification.id);

        setUnreadCount((current) => Math.max(current - 1, 0));

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
        );
      }
    } catch {
      // Navigation can still continue.
    }

    setNotificationsOpen(false);

    if (notification.path) {
      navigate(notification.path);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,

          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch {
      window.alert('Unable to mark notifications as read.');
    }
  }

  function handleSearchChange(event) {
    const value = event.target.value;

    setQuery(value);

    setProfileOpen(false);

    setNotificationsOpen(false);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const normalizedValue = value.trim();

    if (normalizedValue.length < 2) {
      requestIdRef.current += 1;

      setResults([]);

      setSearching(false);

      setSearchOpen(false);

      return;
    }

    setSearching(true);

    setSearchOpen(true);

    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await searchGlobal(normalizedValue);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setResults(Array.isArray(response.results) ? response.results : []);
      } catch {
        if (requestId === requestIdRef.current) {
          setResults([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setSearching(false);
        }
      }
    }, 300);
  }

  function handleResultClick(result) {
    setQuery('');
    setResults([]);
    setSearchOpen(false);

    navigate(result.path);
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Escape') {
      setSearchOpen(false);
    }
  }

  function handleProfileToggle() {
    setProfileOpen((current) => !current);

    setSearchOpen(false);

    setNotificationsOpen(false);
  }

  function handleSignOut() {
    setProfileOpen(false);

    logout();

    navigate('/login', {
      replace: true,
    });
  }

  return (
    <header className="topbar">
      <div
        className="topbar-search"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setSearchOpen(false);
          }
        }}
      >
        <Search size={17} />

        <input
          type="search"
          value={query}
          placeholder="Search guests, rooms, reservations, payments..."
          aria-label="Global search"
          onChange={handleSearchChange}
          onFocus={() => {
            setProfileOpen(false);

            setNotificationsOpen(false);

            if (query.trim().length >= 2) {
              setSearchOpen(true);
            }
          }}
          onKeyDown={handleSearchKeyDown}
        />

        {searching && (
          <LoaderCircle size={16} className="topbar-search-spinner" />
        )}

        {searchOpen && (
          <div className="topbar-search-dropdown">
            <div className="topbar-search-dropdown-header">
              <span>Search Results</span>

              <small>
                {searching ? 'Searching...' : `${results.length} result(s)`}
              </small>
            </div>

            {!searching && results.length === 0 ? (
              <div className="topbar-search-empty">
                No results found for &quot;{query}&quot;.
              </div>
            ) : (
              <div className="topbar-search-results">
                {results.map((result) => {
                  const Icon = resultIcons[result.type] ?? Search;

                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      className="topbar-search-result"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="topbar-search-result-icon">
                        <Icon size={17} />
                      </div>

                      <div className="topbar-search-result-content">
                        <div className="topbar-search-result-title">
                          <strong>{result.title}</strong>

                          <span>{formatType(result.type)}</span>
                        </div>

                        <small>{result.subtitle}</small>

                        <div className="topbar-search-result-meta">
                          {result.status && <span>{result.status}</span>}

                          {result.amountCentavos !== undefined && (
                            <span>{formatCurrency(result.amountCentavos)}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <div
          className="topbar-notifications"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setNotificationsOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="topbar-icon-button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={handleNotificationBell}
          >
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className="topbar-notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <div>
                  <strong>Notifications</strong>

                  <span>
                    {unreadCount} {'unread'}
                  </span>
                </div>

                {unreadCount > 0 && (
                  <button type="button" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              {notificationsLoading ? (
                <div className="notification-empty">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">No notifications yet.</div>
              ) : (
                <div className="notification-list">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={
                        notification.isRead
                          ? 'notification-item'
                          : 'notification-item unread'
                      }
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-item-icon">
                        {notification.type === 'PAYMENT_RECEIVED' ? (
                          <CreditCard size={17} />
                        ) : notification.type === 'UPCOMING_CHECK_IN' ? (
                          <Clock3 size={17} />
                        ) : (
                          <CalendarDays size={17} />
                        )}
                      </div>

                      <div className="notification-item-content">
                        <div className="notification-item-title">
                          <strong>{notification.title}</strong>

                          {!notification.isRead && <i />}
                        </div>

                        <p>{notification.message}</p>

                        <small>
                          {formatNotificationTime(notification.createdAt)}
                        </small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="topbar-profile-menu"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setProfileOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="topbar-profile"
            aria-expanded={profileOpen}
            onClick={handleProfileToggle}
          >
            <div className="topbar-avatar">
              {user?.firstName?.charAt(0)?.toUpperCase() || 'A'}
            </div>

            <span>{user?.firstName || 'Admin'}</span>

            <ChevronDown size={15} />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-user">
                <strong>
                  {user?.firstName} {user?.lastName}
                </strong>

                <span>{user?.email}</span>

                <small>{user?.role}</small>
              </div>

              <div className="profile-dropdown-actions">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);

                    navigate('/admin/profile');
                  }}
                >
                  <UserRound size={16} />
                  My Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);

                    navigate('/change-password');
                  }}
                >
                  <KeyRound size={16} />
                  Change Password
                </button>

                <button
                  type="button"
                  className="profile-dropdown-signout"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
