import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Info,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import {
  createReservation,
  getAvailableRooms,
} from '../reservations/reservationApi';
import {
  initialStay,
  localDate,
  nightsBetween,
  requestMessage,
} from './bookingUtils';
import BookingSummary from './BookingSummary';
import BookingSteps from './BookingSteps';

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <header className="booking-section-heading">
      <span>
        <Icon size={22} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
  );
}

export default function BookingForm({
  room,
  reservation: restoredReservation,
  user,
  params,
  paymentError,
  onRefreshPayment,
}) {
  const navigate = useNavigate();
  const [stay, setStay] = useState(() =>
    initialStay(params, restoredReservation, room.capacity),
  );
  const [arrival, setArrival] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [createdReservation, setCreatedReservation] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const reservation = restoredReservation || createdReservation;
  const locked = Boolean(reservation);
  const payable = reservation?.status === 'PENDING';
  const totalGuests = Number(stay.adults) + Number(stay.children);

  function update(field, value) {
    setStay((current) => ({ ...current, [field]: value }));
    setError('');
  }

  function editStay() {
    setReviewing(false);
    requestAnimationFrame(() =>
      document.getElementById('booking-check-in')?.focus(),
    );
  }

  async function submit(event) {
    event.preventDefault();
    if (busyRef.current || (locked && !payable)) return;
    setError('');
    if (
      !locked &&
      (stay.checkIn < localDate() ||
        !nightsBetween(stay.checkIn, stay.checkOut))
    ) {
      setError('Choose a check-in date from today and a later check-out date.');
      return;
    }
    if (
      !locked &&
      (!Number.isInteger(Number(stay.adults)) ||
        Number(stay.adults) < 1 ||
        !Number.isInteger(Number(stay.children)) ||
        Number(stay.children) < 0 ||
        totalGuests > room.capacity)
    ) {
      setError(
        `Choose at least one adult and no more than ${room.capacity} guests in total.`,
      );
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      if (reservation) {
        navigate(
          `/booking/${encodeURIComponent(room.id)}/payment?${new URLSearchParams({ reservationId: reservation.id })}`,
        );
      } else if (reviewing) {
        const specialRequests = [
          stay.specialRequests.trim(),
          arrival ? `Estimated arrival: ${arrival}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        const created = await createReservation({
          roomId: room.id,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          adults: Number(stay.adults),
          children: Number(stay.children),
          specialRequests: specialRequests || undefined,
        });
        // Keep the created reservation if payment fails. Reloads resume this ID, not a new booking.
        setCreatedReservation(created);
        const nextParams = new URLSearchParams(params);
        nextParams.set('reservationId', created.id);
        navigate(
          `/booking/${encodeURIComponent(room.id)}/payment?${nextParams}`,
          {
            replace: true,
          },
        );
      } else {
        const available = await getAvailableRooms({
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          capacity: totalGuests,
        });
        if (!available.some((candidate) => candidate.id === room.id)) {
          setError(
            'This room is not available for your selected dates and guest count. Choose different dates or another room.',
          );
          return;
        }
        setReviewing(true);
      }
    } catch (requestError) {
      setError(
        requestMessage(
          requestError,
          requestError.message || 'Unable to continue. Please try again.',
        ),
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (!locked && (room.isActive === false || room.status === 'MAINTENANCE')) {
    return (
      <div className="stay-empty">
        <h2>This room is currently unavailable</h2>
        <p>Choose another room for your stay.</p>
        <Link className="stay-button" to="/rooms">
          Browse rooms
        </Link>
      </div>
    );
  }

  const activeStep = reservation
    ? reservation.status === 'CONFIRMED' ||
      reservation.status === 'CHECKED_IN' ||
      reservation.status === 'CHECKED_OUT'
      ? 4
      : 3
    : 2;

  return (
    <>
      <BookingSteps activeStep={activeStep} />
      <form className="booking-layout" onSubmit={submit}>
        <div className="booking-fields">
          {activeStep === 4 && (
            <section className="booking-panel booking-confirmed" role="status">
              <CheckCircle2 size={36} />
              <h2>Booking Confirmed</h2>
              <p>
                {reservation.payments?.some(
                  (payment) => payment.status === 'PAID',
                )
                  ? 'Payment successful. Your coastal stay is confirmed.'
                  : 'Your reservation is confirmed.'}
              </p>
              <strong>{reservation.referenceNo}</strong>
            </section>
          )}
          <section className="booking-panel">
            <SectionHeading
              icon={UserRound}
              title="Guest Information"
              description="Your reservation will use your signed-in account details."
            />
            <div className="booking-guest-grid">
              <label>
                First Name
                <input
                  autoComplete="given-name"
                  value={user.firstName || ''}
                  readOnly
                />
              </label>
              <label>
                Last Name
                <input
                  autoComplete="family-name"
                  value={user.lastName || ''}
                  readOnly
                />
              </label>
              <label>
                Email Address
                <input
                  type="email"
                  autoComplete="email"
                  value={user.email || ''}
                  readOnly
                />
              </label>
              <label>
                Contact Number
                <input
                  type="tel"
                  autoComplete="tel"
                  value={user.phone || ''}
                  placeholder="Not provided"
                  readOnly
                />
              </label>
            </div>
          </section>

          <section className="booking-panel">
            <SectionHeading
              icon={CalendarDays}
              title="Stay Details"
              description="Review and confirm your stay dates and guests."
            />
            <fieldset disabled={locked || reviewing || busy}>
              <div className="booking-stay-grid">
                <label>
                  Check-in Date <span>*</span>
                  <input
                    id="booking-check-in"
                    type="date"
                    min={localDate()}
                    value={stay.checkIn}
                    onChange={(event) => update('checkIn', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Check-out Date <span>*</span>
                  <input
                    type="date"
                    min={stay.checkIn || localDate()}
                    value={stay.checkOut}
                    onChange={(event) => update('checkOut', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Adults <span>*</span>
                  <input
                    type="number"
                    min="1"
                    max={room.capacity}
                    value={stay.adults}
                    onChange={(event) => update('adults', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Children
                  <input
                    type="number"
                    min="0"
                    max={room.capacity - 1}
                    value={stay.children}
                    onChange={(event) => update('children', event.target.value)}
                    required
                  />
                </label>
              </div>
              <label className="booking-notes">
                Special Requests / Notes <small>(Optional)</small>
                <textarea
                  value={stay.specialRequests}
                  onChange={(event) =>
                    update('specialRequests', event.target.value)
                  }
                  maxLength={500}
                  rows={3}
                  placeholder="e.g. High floor, extra pillows, late check-in, etc."
                />
                <small>{stay.specialRequests.length}/500</small>
              </label>
            </fieldset>
          </section>

          {!locked && (
            <section className="booking-panel">
              <SectionHeading
                icon={Info}
                title="Additional Information"
                description="Help us prepare for your arrival. (Optional)"
              />
              <fieldset disabled={reviewing || busy}>
                <label className="booking-arrival">
                  Estimated Arrival Time
                  <select
                    value={arrival}
                    onChange={(event) => setArrival(event.target.value)}
                  >
                    <option value="">Not sure yet</option>
                    {[
                      'Before 12:00 PM',
                      '12:00 PM – 3:00 PM',
                      '3:00 PM – 6:00 PM',
                      '6:00 PM – 9:00 PM',
                      'After 9:00 PM',
                    ].map((time) => (
                      <option key={time}>{time}</option>
                    ))}
                  </select>
                </label>
              </fieldset>
            </section>
          )}

          <section className="booking-panel">
            <SectionHeading
              icon={CreditCard}
              title="Payment Method"
              description="Complete payment on our secure hosted checkout."
            />
            <div className="booking-payment-option">
              <span>
                <ShieldCheck size={25} />
              </span>
              <div>
                <strong>PayMongo Secure Checkout</strong>
                <p>Choose from the available payment methods at checkout.</p>
              </div>
              <LockKeyhole size={18} />
            </div>
            <p className="booking-payment-note">
              Your reservation stays pending until payment is verified.
            </p>
          </section>

          <section
            className="booking-panel booking-action-panel"
            aria-label="Review and confirm"
          >
            <div aria-live="polite">
              {reservation ? (
                <>
                  <h2>
                    Reservation{' '}
                    {reservation.status.replaceAll('_', ' ').toLowerCase()}
                  </h2>
                  <p>
                    Reference: <strong>{reservation.referenceNo}</strong>
                  </p>
                  <p>
                    {payable
                      ? 'Your room is reserved pending payment. Continue to checkout to complete your payment.'
                      : 'This reservation is not awaiting payment.'}
                  </p>
                </>
              ) : reviewing ? (
                <>
                  <h2>Review Your Booking</h2>
                  <p>
                    Check your dates, guests, and price summary. Confirming will
                    create your reservation.
                  </p>
                </>
              ) : (
                <>
                  <h2>Ready for Your Coastal Stay?</h2>
                  <p>Review your booking before confirming your reservation.</p>
                </>
              )}
            </div>
            {error && (
              <p className="booking-error" role="alert">
                {error}
              </p>
            )}
            {payable && (
              <div className="booking-payment-check">
                {paymentError && <p role="alert">{paymentError}</p>}
                <button
                  type="button"
                  className="booking-back"
                  disabled={busy}
                  onClick={onRefreshPayment}
                >
                  Already paid? Check Payment Status
                </button>
              </div>
            )}
            <div className="booking-actions">
              {reviewing && !locked ? (
                <button
                  type="button"
                  className="booking-back"
                  onClick={editStay}
                  disabled={busy}
                >
                  <ArrowLeft size={16} />
                  Edit Details
                </button>
              ) : (
                <Link className="booking-back" to="/rooms">
                  <ArrowLeft size={16} />
                  Back to Rooms
                </Link>
              )}
              {(!locked || payable) && (
                <button
                  type="submit"
                  className="booking-primary"
                  disabled={busy}
                >
                  {busy
                    ? 'Please wait…'
                    : locked
                      ? 'Continue to Payment'
                      : reviewing
                        ? 'Confirm Reservation'
                        : 'Review Booking'}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </section>
        </div>
        <BookingSummary
          room={room}
          stay={stay}
          reservation={reservation}
          onEdit={editStay}
          locked={locked || busy}
        />
      </form>
    </>
  );
}
