import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CircleCheck, BedDouble } from 'lucide-react';
import { useAuth } from './useAuth';
import { getMyBookings } from '../my-bookings/myBookingsApi';
import { isCurrentBooking } from '../my-bookings/myBookingsUtils';

export default function CustomerBookingOverview() {
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null });
  const key = JSON.stringify([user.id, attempt]);
  useEffect(() => {
    const controller = new AbortController();
    getMyBookings(controller.signal)
      .then((bookings) => {
        if (!controller.signal.aborted) setResult({ key, bookings });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, error: true });
      });
    return () => controller.abort();
  }, [key]);
  const loading = result.key !== key;
  const bookings = loading ? [] : result.bookings || [];
  return (
    <section
      className="profile-card customer-booking-overview"
      aria-labelledby="customer-overview-title"
    >
      <div className="profile-section-heading">
        <span className="profile-section-icon">
          <CalendarDays size={24} />
        </span>
        <div>
          <h2 id="customer-overview-title">Booking Overview</h2>
          <p>A quick summary of your booking activity.</p>
        </div>
      </div>
      {loading ? (
        <p role="status">Loading your booking activity...</p>
      ) : result.error ? (
        <div role="alert">
          <p>Unable to load your booking activity.</p>
          <button
            type="button"
            className="profile-outline-button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="customer-booking-stats">
          {[
            [
              CalendarDays,
              'Active Bookings',
              bookings.filter(isCurrentBooking).length,
              'Your current reservations',
              'active',
            ],
            [
              CircleCheck,
              'Completed Stays',
              bookings.filter((booking) => booking.status === 'CHECKED_OUT')
                .length,
              'Your past stays',
              'completed',
            ],
            [
              BedDouble,
              'Total Reservations',
              bookings.length,
              'View your booking history',
              'total',
            ],
          ].map(([Icon, label, count, description, tone]) => (
            <Link
              className={`customer-booking-stat ${tone}`}
              to="/my-bookings"
              key={label}
            >
              <span className="customer-stat-icon">
                <Icon size={24} />
              </span>
              <span>
                <strong>{count}</strong>
                <b>{label}</b>
                <small>{description}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
