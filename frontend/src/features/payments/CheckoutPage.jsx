import { useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import BookingShell from '../booking/BookingShell';
import BookingSteps from '../booking/BookingSteps';
import BookingSummary from '../booking/BookingSummary';
import useBooking from '../booking/useBooking';
import { initialStay, requestMessage } from '../booking/bookingUtils';
import useHostedCheckout from './useHostedCheckout';
import './checkout.css';

// Render the shared icon, title, and explanatory text for a booking section.
function SectionHeading({ icon: Icon, title, children }) {
  return (
    /* Show this section's heading, context, and available actions. */
    <header className="booking-section-heading">
      <span>
        <Icon size={21} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </header>
  );
}

// Render verified payment state or offer the secure payment-window action for an unpaid
// reservation.
function CheckoutContent({
  room,
  reservation,
  user,
  params,
  bookingPath,
  paymentError,
  onRefresh,
}) {
  // Track local state and read any session or route values needed by this component.
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const { start, waiting, returnToSite } = useHostedCheckout();
  const paid = reservation.payments?.some(
    (payment) => payment.status === 'PAID',
  );
  const confirmed = ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(
    reservation.status,
  );
  const payable = reservation.status === 'PENDING' && !paid;
  const stay = initialStay(params, reservation, room.capacity);

  // Prevent duplicate payment clicks and start the verified hosted-payment window flow.
  async function pay() {
    if (busy.current || !payable || paymentError) return;
    busy.current = true;
    setSubmitting(true);
    setError('');
    try {
      // The server reuses the reservation's checkout and determines the amount.
      await start(reservation.id);
    } catch (failure) {
      setError(
        requestMessage(
          failure,
          failure.message ||
            'Unable to open secure checkout. Please try again.',
        ),
      );
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <BookingSteps activeStep={confirmed || paid ? 4 : 3} />
      <div className="booking-layout checkout-layout">
        <div className="checkout-fields">
          {confirmed || paid ? (
            /* Group the related content and actions into a distinct page section. */
            <section className="booking-panel booking-confirmed" role="status">
              <CheckCircle2 size={32} />
              <h2>{confirmed ? 'Booking Confirmed' : 'Payment Received'}</h2>
              <p>
                {paid
                  ? 'Your payment has been received.'
                  : 'Your reservation is confirmed.'}{' '}
                Booking reference: {reservation.referenceNo}.
              </p>
              <Link className="checkout-pay" to={bookingPath}>
                View Booking <ArrowRight size={16} />
              </Link>
            </section>
          ) : !payable ? (
            /* Display the "Booking" section and its related actions. */
            <section className="booking-panel">
              <h2>
                Booking {reservation.status.toLowerCase().replaceAll('_', ' ')}
              </h2>
              <p className="checkout-description">
                Payment is unavailable for this reservation.
              </p>
              <Link className="checkout-back" to={bookingPath}>
                View Booking
              </Link>
            </section>
          ) : (
            <>
              {/* Group the related content and actions into a distinct page section. */}
              <section className="booking-panel">
                <SectionHeading
                  icon={LockKeyhole}
                  title="Choose Payment Method"
                >
                  Complete your booking with our secure payment provider.
                </SectionHeading>
                <div className="checkout-method">
                  <span className="checkout-selected">
                    <CheckCircle2 size={17} />
                  </span>
                  <CreditCard size={29} />
                  <div>
                    <strong>Secure Online Payment</strong>
                    <small>PayMongo secure checkout</small>
                  </div>
                  <ShieldCheck size={23} />
                </div>
                <p className="checkout-description">
                  Choose from the available payment methods on the secure
                  checkout page.
                </p>
              </section>
              {/* Display the "Your payment details stay with the payment provider" section and its related actions. */}
              <section className="booking-panel">
                <SectionHeading icon={CreditCard} title="Payment Details">
                  Review your details before continuing to payment.
                </SectionHeading>
                <dl className="checkout-details">
                  <div>
                    <dt>
                      <UserRound size={15} /> Guest Name
                    </dt>
                    <dd>
                      {[user.firstName, user.lastName]
                        .filter(Boolean)
                        .join(' ')}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Mail size={15} /> Email Address
                    </dt>
                    <dd>{user.email}</dd>
                  </div>
                  <div>
                    <dt>Booking Reference</dt>
                    <dd>{reservation.referenceNo}</dd>
                  </div>
                  <div>
                    <dt>Amount to Pay</dt>
                    <dd>{formatCurrency(reservation.totalAmountCentavos)}</dd>
                  </div>
                </dl>
                <div className="checkout-gateway">
                  <span>
                    <LockKeyhole size={25} />
                  </span>
                  <div>
                    <h3>Your payment details stay with the payment provider</h3>
                    <p>
                      Enter your card or other payment details on PayMongo.
                      Return to Seabreeze after payment to view your booking
                      confirmation.
                    </p>
                  </div>
                  <ExternalLink size={18} />
                </div>
                <ol className="checkout-instructions">
                  <li>
                    <span>1</span>Continue to secure checkout
                  </li>
                  <li>
                    <span>2</span>Choose a method and pay
                  </li>
                  <li>
                    <span>3</span>Return for confirmation
                  </li>
                </ol>
              </section>
              {/* Group the related content and actions into a distinct page section. */}
              <section className="booking-panel checkout-action-panel">
                <div className="checkout-security">
                  <ShieldCheck size={32} />
                  <div>
                    <strong>Your Payment is Secure</strong>
                    <p>
                      Payment details are handled by our secure payment gateway.
                    </p>
                  </div>
                  <LockKeyhole size={23} />
                </div>
                {paymentError && (
                  <p className="booking-error" role="alert">
                    {paymentError}
                  </p>
                )}
                {error && (
                  <p className="booking-error" role="alert">
                    {error}
                  </p>
                )}
                <div className="checkout-actions">
                  {waiting && (
                    <div role="status">
                      <p>
                        Complete payment in the PayMongo window. If it fails or
                        expires, return here to continue.
                      </p>
                      <button
                        type="button"
                        className="checkout-back"
                        onClick={returnToSite}
                      >
                        Return to Checkout
                      </button>
                    </div>
                  )}
                  <Link className="checkout-back" to={bookingPath}>
                    <ArrowLeft size={16} /> Back to Guest Details
                  </Link>
                  <button
                    className="checkout-pay"
                    type="button"
                    disabled={submitting || !!paymentError}
                    onClick={pay}
                  >
                    <LockKeyhole size={15} />
                    {submitting
                      ? 'Opening Secure Checkout…'
                      : `Pay Now ${formatCurrency(reservation.totalAmountCentavos)}`}
                    <ArrowRight size={16} />
                  </button>
                </div>
                <p className="checkout-redirect">
                  Secure payment opens in a separate window. Keep this page open
                  to receive your payment result.
                </p>
                <div className="checkout-status">
                  <span>Already paid?</span>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={onRefresh}
                  >
                    Check Payment Status
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
        <BookingSummary
          room={room}
          reservation={reservation}
          stay={stay}
          locked
        />
      </div>
    </>
  );
}

// Restore a saved customer reservation and display its payment review page.
export default function CheckoutPage() {
  // Track local state and read any session or route values needed by this component.
  const { roomId } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const reservationId = params.get('reservationId');
  const result = useBooking(roomId, reservationId, user?.id);
  const bookingPath = `/booking/${encodeURIComponent(roomId)}${reservationId ? `?${new URLSearchParams({ reservationId })}` : ''}`;

  return (
    <BookingShell
      payment
      bookingPath={bookingPath}
      title="Secure Your Payment"
      description="Review your booking details and complete your reservation with secure online payment."
    >
      {!reservationId ? (
        <div className="stay-empty">
          <h2>Choose your stay first</h2>
          <p>
            Review your guest and stay details before proceeding to payment.
          </p>
          <Link className="checkout-back" to={bookingPath}>
            Back to Booking
          </Link>
        </div>
      ) : result.loading ? (
        <div className="stay-empty" role="status">
          Loading your payment details…
        </div>
      ) : result.error ? (
        <div className="stay-empty" role="alert">
          <h2>Unable to load your booking</h2>
          <p>{result.error}</p>
          <button
            className="checkout-back"
            type="button"
            onClick={result.retry}
          >
            Try Again
          </button>
          <Link className="checkout-back" to="/rooms">
            Back to Rooms
          </Link>
        </div>
      ) : (
        <CheckoutContent
          key={reservationId}
          room={result.room}
          reservation={result.reservation}
          user={user}
          params={params}
          bookingPath={bookingPath}
          paymentError={result.paymentError}
          onRefresh={result.retry}
        />
      )}
    </BookingShell>
  );
}
