import {
  BedDouble,
  CalendarDays,
  Check,
  CreditCard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import RoomPhoto from '../landing/RoomPhoto';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate, nightsBetween } from './bookingUtils';

export default function BookingSummary({
  room,
  stay,
  reservation,
  onEdit,
  locked,
}) {
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const total = reservation
    ? reservation.totalAmountCentavos
    : nights * room.ratePerNightCentavos;
  return (
    <aside className="booking-summary" aria-label="Your booking summary">
      <section className="booking-panel">
        <header className="booking-section-heading">
          <span>
            <CalendarDays size={21} />
          </span>
          <div>
            <h2>Your Booking Summary</h2>
            <p>Review your selected room and stay details.</p>
          </div>
        </header>
        <div className="booking-room-photo">
          <RoomPhoto room={room} />
        </div>
        <h3>{room.name}</h3>
        <p className="booking-room-description">
          {room.description || 'Your own space for a comfortable stay.'}
        </p>
        <div className="booking-room-facts">
          <span>
            <Users size={16} />
            Up to {room.capacity} guests
          </span>
          <span>
            <BedDouble size={16} />
            Room {room.roomNumber}
          </span>
        </div>
        <div className="booking-summary-title">
          <strong>Stay Information</strong>
          {!locked && (
            <button type="button" onClick={onEdit}>
              Edit
            </button>
          )}
        </div>
        <dl>
          <div>
            <dt>
              <CalendarDays size={14} />
              Check-in
            </dt>
            <dd>{displayDate(stay.checkIn)}</dd>
          </div>
          <div>
            <dt>
              <CalendarDays size={14} />
              Check-out
            </dt>
            <dd>{displayDate(stay.checkOut)}</dd>
          </div>
          <div>
            <dt>
              <BedDouble size={14} />
              Nights
            </dt>
            <dd>
              {nights} {nights === 1 ? 'night' : 'nights'}
            </dd>
          </div>
          <div>
            <dt>
              <Users size={14} />
              Guests
            </dt>
            <dd>
              {Number(stay.adults) + Number(stay.children)} ({stay.adults}{' '}
              adults{Number(stay.children) ? `, ${stay.children} children` : ''}
              )
            </dd>
          </div>
          <div>
            <dt>
              <BedDouble size={14} />
              Room Type
            </dt>
            <dd>{room.roomType}</dd>
          </div>
        </dl>
      </section>
      <section
        className="booking-panel booking-price-panel"
        aria-label="Price breakdown"
      >
        <h2>Price Breakdown</h2>
        <div className="booking-price-row">
          <span>
            {reservation
              ? 'Reserved stay'
              : `${formatCurrency(room.ratePerNightCentavos)} × ${nights} ${nights === 1 ? 'night' : 'nights'}`}
          </span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <div className="booking-total">
          <strong>{reservation ? 'Total Amount' : 'Estimated Total'}</strong>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <p>
          {reservation
            ? 'Reservation amount recorded for your stay.'
            : 'Your final amount is calculated when you confirm your reservation.'}
        </p>
      </section>
      <section className="booking-panel booking-reassurance">
        <h2>
          <ShieldCheck size={21} />
          Why Book With Seabreeze?
        </h2>
        <div>
          <CreditCard />
          <span>
            <strong>Secure Checkout</strong>
            <small>Complete payment through our payment provider.</small>
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <strong>NFC Smart Access</strong>
            <small>Contactless access for a seamless stay.</small>
          </span>
        </div>
        <div>
          <Check />
          <span>
            <strong>Clear Booking Details</strong>
            <small>Review your room, dates, and total before confirming.</small>
          </span>
        </div>
      </section>
    </aside>
  );
}
