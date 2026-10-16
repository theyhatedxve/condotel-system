import LoadingScreen from '../auth/LoadingScreen';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import useBooking from './useBooking';
import BookingForm from './BookingForm';
import BookingShell from './BookingShell';

// Restore the room and optional saved reservation before rendering the booking form.
export default function BookingPage() {
  // Track local state and read any session or route values needed by this component.
  const { roomId } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const reservationId = params.get('reservationId');
  const { room, reservation, loading, error, paymentError, retry } = useBooking(
    roomId,
    reservationId,
    user.id,
  );

  return (
    <BookingShell
      title="Complete Your Booking"
      description="Secure your stay by reviewing your details and completing your payment."
    >
      {loading ? (
        <div className="stay-empty" role="status">
          <LoadingScreen inline title="Loading your booking" description="Fetching the latest details for this page." />
        </div>
      ) : error ? (
        <div className="stay-empty" role="alert">
          <h2>We couldn't load this booking</h2>
          <p>{error}</p>
          <button className="stay-button" onClick={retry}>
            Try again
          </button>
          <Link to="/rooms">Back to rooms</Link>
        </div>
      ) : (
        <BookingForm
          key={`${roomId}:${reservationId || 'new'}`}
          room={room}
          reservation={reservation}
          user={user}
          params={params}
          paymentError={paymentError}
          onRefreshPayment={retry}
        />
      )}
    </BookingShell>
  );
}
