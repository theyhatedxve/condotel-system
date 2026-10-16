import LoadingScreen from '../auth/LoadingScreen';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  RefreshCw,
  Users,
} from 'lucide-react';
import BookingShell from '../booking/BookingShell';
import {
  displayDate,
  nightsBetween,
  requestMessage,
} from '../booking/bookingUtils';
import { useAuth } from '../auth/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import { getMyBookings } from './myBookingsApi';
import {
  checkoutPath,
  isCurrentBooking,
  paymentLabel,
} from './myBookingsUtils';
import './my-bookings.css';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('current');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, bookings: [], error: '' });
  const requestKey = JSON.stringify([user.id, attempt]);
  const loading = result.key !== requestKey;

  useEffect(() => {
    const controller = new AbortController();
    getMyBookings(controller.signal)
      .then((bookings) => {
        if (!controller.signal.aborted)
          setResult({ key: requestKey, bookings, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({
            key: requestKey,
            bookings: [],
            error: requestMessage(
              error,
              'Unable to load your bookings. Please try again.',
            ),
          });
      });
    return () => controller.abort();
  }, [requestKey]);

  // Hide previous-account results immediately while the new owned request loads.
  const bookings = loading ? [] : result.bookings;
  const current = bookings.filter(isCurrentBooking).sort((a, b) => {
    if ((a.status === 'CHECKED_IN') !== (b.status === 'CHECKED_IN'))
      return a.status === 'CHECKED_IN' ? -1 : 1;
    return Date.parse(a.checkIn) - Date.parse(b.checkIn);
  });
  const history = bookings.filter((booking) => !isCurrentBooking(booking));
  const visible = tab === 'current' ? current : history;

  return (
    <BookingShell
      title="My Bookings"
      description="Your reservations, stay details, and payment status in one place."
      pageLabel="My Bookings"
    >
      <section className="my-bookings" aria-label="Your reservations">
        <div className="my-bookings-toolbar">
          <div
            className="my-bookings-filters"
            role="group"
            aria-label="Filter bookings"
          >
            <button
              type="button"
              aria-pressed={tab === 'current'}
              onClick={() => setTab('current')}
            >
              Current bookings
              {!loading && !result.error && ` (${current.length})`}
            </button>
            <button
              type="button"
              aria-pressed={tab === 'history'}
              onClick={() => setTab('history')}
            >
              Past &amp; cancelled
              {!loading && !result.error && ` (${history.length})`}
            </button>
          </div>
          <button
            type="button"
            className="my-bookings-refresh"
            disabled={loading}
            onClick={() => setAttempt((value) => value + 1)}
          >
            <RefreshCw size={16} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {loading ? (
          <div className="my-bookings-empty" role="status">
            <LoadingScreen inline title="Loading your bookings" description="Fetching the latest details for this page." />
          </div>
        ) : result.error ? (
          <div className="my-bookings-empty" role="alert">
            <h2>We couldn’t load your bookings</h2>
            <p>{result.error}</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="my-bookings-empty">
            <CalendarDays size={36} aria-hidden="true" />
            <h2>
              {tab === 'current'
                ? 'No current bookings'
                : 'No past bookings yet'}
            </h2>
            <p>
              {tab === 'current'
                ? 'When you reserve a room, your booking will appear here.'
                : 'Checked-out and cancelled reservations will appear here.'}
            </p>
            <Link to="/rooms">
              Explore rooms <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="my-bookings-list">
            {visible.map((booking) => (
              <article
                className="my-booking-card"
                key={booking.id}
                aria-labelledby={`booking-${booking.id}`}
              >
                <header className="my-booking-card-header">
                  <div>
                    <span className="my-booking-eyebrow">
                      Booking reference
                    </span>
                    <h2 id={`booking-${booking.id}`}>{booking.referenceNo}</h2>
                  </div>
                  <span
                    className={`my-booking-status ${booking.status.toLowerCase()}`}
                  >
                    {booking.status.replaceAll('_', ' ')}
                  </span>
                </header>
                <div className="my-booking-room">
                  <span className="my-booking-room-icon">
                    <BedDouble size={26} />
                  </span>
                  <div>
                    <h3>
                      {booking.room?.name ||
                        `Room ${booking.room?.roomNumber ?? ''}`}
                    </h3>
                    <p>
                      Room {booking.room?.roomNumber} · {booking.room?.roomType}
                    </p>
                  </div>
                </div>
                <dl className="my-booking-details">
                  <div>
                    <dt>
                      <CalendarDays size={15} />
                      Check-in
                    </dt>
                    <dd>{displayDate(booking.checkIn)}</dd>
                  </div>
                  <div>
                    <dt>
                      <CalendarDays size={15} />
                      Check-out
                    </dt>
                    <dd>{displayDate(booking.checkOut)}</dd>
                  </div>
                  <div>
                    <dt>
                      <Users size={15} />
                      Guests
                    </dt>
                    <dd>
                      {booking.adults + booking.children} total
                      <span>
                        {booking.adults} adult(s), {booking.children} child(ren)
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Length of stay</dt>
                    <dd>
                      {nightsBetween(booking.checkIn, booking.checkOut)}{' '}
                      night(s)
                    </dd>
                  </div>
                </dl>
                {booking.specialRequests && (
                  <div className="my-booking-notes">
                    <h4>Special requests</h4>
                    <p>{booking.specialRequests}</p>
                  </div>
                )}
                <footer className="my-booking-card-footer">
                  <div>
                    <span className="my-booking-eyebrow">
                      Reservation total
                    </span>
                    <strong>
                      {formatCurrency(booking.totalAmountCentavos)}
                    </strong>
                    <span className="my-booking-payment">
                      Payment: {paymentLabel(booking)}
                    </span>
                  </div>
                  {booking.status === 'PENDING' && (
                    <Link to={checkoutPath(booking)} className="my-booking-pay">
                      Review payment <ArrowRight size={16} />
                    </Link>
                  )}
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </BookingShell>
  );
}
