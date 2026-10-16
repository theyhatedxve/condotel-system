import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notificationApi';

// Load the customer's own notifications and offer read-state and booking-navigation
// actions.
export default function CustomerNotifications() {
  // Track local state and read any session or route values needed by this component.
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Load owned notifications and ignore the request result after leaving the page.
  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load notifications.');
      });
    return () => {
      cancelled = true;
    };
  }, []);
  // Mark one or all customer notifications read and update their local read state.
  async function markRead(item) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (item) await markNotificationRead(item.id);
      else await markAllNotificationsRead();
      setItems((current) =>
        current.map((entry) =>
          !item || entry.id === item.id ? { ...entry, isRead: true } : entry,
        ),
      );
    } catch {
      setError('Unable to update notifications.');
    } finally {
      setBusy(false);
    }
  }
  return (
    /* Display the "Notifications" section and its related actions. */
    <section
      className="profile-card customer-notifications"
      aria-label="Your notifications"
    >
      <h2>Notifications</h2>
      {error && <p role="alert">{error}</p>}
      {!items && !error ? (
        <p role="status">Loading notifications…</p>
      ) : items?.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <>
          {items?.some((item) => !item.isRead) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => markRead(null)}
            >
              Mark All as Read
            </button>
          )}
          <ul>
            {items?.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <Link
                    to={
                      item.path?.startsWith('/booking/') ? item.path : '/rooms'
                    }
                  >
                    View Booking
                  </Link>
                </div>
                {!item.isRead && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => markRead(item)}
                  >
                    Mark as Read
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
