import { CheckCircle2, Clock3, RefreshCw, XCircle } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import usePaymentConfirmation from './usePaymentConfirmation';
import './payment-result.css';

export default function PaymentResultPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const reservationId = params.get('reservationId');
  const { phase, reservation, payment, error, retry } = usePaymentConfirmation(
    reservationId,
    location.pathname === '/payment/cancelled',
    user.id,
  );
  const confirmed =
    phase === 'paid' &&
    ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(reservation?.status);
  const messages = {
    checking: [
      'Verifying Your Payment',
      'Please wait while we check your payment and reservation status.',
    ],
    pending: [
      'Payment Verification Pending',
      'Your payment is not confirmed yet. If you have already paid, check again in a moment.',
    ],
    paid: [
      confirmed
        ? 'Payment Successful — Booking Confirmed'
        : 'Payment Successful',
      confirmed
        ? 'Your payment is verified and your coastal stay is confirmed.'
        : 'Your payment is verified. Please review your current reservation status.',
    ],
    cancelled: [
      'Payment Cancelled',
      'Your payment was not completed. Return to your booking to continue.',
    ],
    failed: [
      'Payment Not Completed',
      'Your payment was not completed. Return to your booking to try again.',
    ],
    expired: [
      'Checkout Expired',
      'This checkout has expired. Return to your booking to continue.',
    ],
    refunded: [
      'Payment Refunded',
      'This payment has been refunded. Review your reservation for details.',
    ],
    error: ['Unable to Verify Payment', error],
    missing: [
      'Reservation Required',
      'Open the payment return link for your reservation to check its status.',
    ],
  };
  const [title, description] = messages[phase] || messages.pending;
  const Icon =
    phase === 'paid'
      ? CheckCircle2
      : ['checking', 'pending'].includes(phase)
        ? Clock3
        : XCircle;
  const bookingPath = reservation
    ? `/booking/${encodeURIComponent(reservation.roomId)}?${new URLSearchParams({ reservationId: reservation.id })}`
    : '/rooms';
  return (
    <main className="payment-result-page">
      <section
        className="payment-result-card"
        aria-labelledby="payment-result-title"
      >
        <div
          className={`payment-result-icon ${phase === 'paid' ? 'success' : ['checking', 'pending'].includes(phase) ? 'pending' : 'cancelled'}`}
        >
          <Icon size={54} />
        </div>
        <div aria-live="polite">
          <h1 id="payment-result-title">{title}</h1>
          <p>{description}</p>
        </div>
        {reservation && (
          <dl className="payment-confirmation-details">
            <div>
              <dt>Booking reference</dt>
              <dd>{reservation.referenceNo}</dd>
            </div>
            <div>
              <dt>Reservation status</dt>
              <dd>{reservation.status.replaceAll('_', ' ')}</dd>
            </div>
            {payment && (
              <div>
                <dt>{phase === 'paid' ? 'Amount paid' : 'Payment amount'}</dt>
                <dd>{formatCurrency(payment.amountCentavos)}</dd>
              </div>
            )}
          </dl>
        )}
        {reservationId && !reservation && (
          <div className="payment-result-reference">
            Reservation ID: <strong>{reservationId}</strong>
          </div>
        )}
        {['error', 'pending'].includes(phase) && (
          <button type="button" onClick={retry}>
            <RefreshCw size={16} />
            Check Payment Status
          </button>
        )}
        <Link
          className="payment-result-return"
          to={user.role === 'CUSTOMER' ? bookingPath : '/admin/reservations'}
        >
          {user.role === 'CUSTOMER'
            ? reservation
              ? 'View Booking'
              : 'Back to Rooms'
            : 'Back to Reservations'}
        </Link>
      </section>
    </main>
  );
}
