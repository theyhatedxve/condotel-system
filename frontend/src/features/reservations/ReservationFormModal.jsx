import { useRef, useState } from 'react';

import { Search, X } from 'lucide-react';

import { getAvailableRooms } from './reservationApi';

import { formatCurrency } from '../../utils/formatCurrency';

export default function ReservationFormModal({
  guests,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  // Track local state and read any session or route values needed by this component.
  const [form, setForm] = useState({
    guestId: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    adults: '1',
    children: '0',
    specialRequests: '',
  });

  const [availableRooms, setAvailableRooms] = useState([]);

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [step, setStep] = useState(1);
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const availabilityRequest = useRef(0);
  const selectedRoom = availableRooms.find((room) => room.id === form.roomId);

  // Update one controlled form field while retaining the remaining field values.
  function updateField(field, value) {
    // Date or guest-count changes invalidate both the selected room and its availability results.
    setForm((current) => ({
      ...current,

      [field]: value,

      ...(['checkIn', 'checkOut', 'adults', 'children'].includes(field)
        ? {
            roomId: '',
          }
        : {}),
    }));

    if (['checkIn', 'checkOut', 'adults', 'children'].includes(field)) {
      // Discard in-flight responses for a stay that has since changed.
      availabilityRequest.current += 1;
      setCheckingAvailability(false);
      setHasCheckedAvailability(false);
      setAvailabilityMessage('');
      setAvailableRooms([]);
    }
  }

  // Request available rooms for the selected stay before allowing reservation
  // submission.
  async function checkAvailability(event) {
    if (!event.currentTarget.form.reportValidity()) return;
    if (!form.checkIn || !form.checkOut) {
      window.alert('Select check-in and check-out dates first.');

      return;
    }

    if (form.checkOut <= form.checkIn) {
      setAvailabilityMessage('Check-out must be after check-in.');
      return;
    }
    const requestId = ++availabilityRequest.current;
    setCheckingAvailability(true);
    setAvailableRooms([]);
    setForm((current) => ({ ...current, roomId: '' }));
    setHasCheckedAvailability(false);
    setAvailabilityMessage('');

    try {
      const capacity = Number(form.adults) + Number(form.children);

      const rooms = await getAvailableRooms({
        checkIn: form.checkIn,

        checkOut: form.checkOut,

        capacity,
      });

      if (requestId !== availabilityRequest.current) return;
      setAvailableRooms(rooms);
      setHasCheckedAvailability(true);

      if (rooms.length === 0) {
        setAvailabilityMessage(
          'No rooms are available for those dates and guest counts.',
        );
      }
    } catch (error) {
      if (requestId !== availabilityRequest.current) return;
      const message =
        error.response?.data?.message || 'Unable to check availability.';

      setAvailabilityMessage(
        Array.isArray(message) ? message.join(' ') : message,
      );
    } finally {
      if (requestId === availabilityRequest.current)
        setCheckingAvailability(false);
    }
  }

  // Submit the selected guest, room, dates, and guest counts to the parent reservation
  // handler.
  function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;
    if (!selectedRoom || checkingAvailability) {
      window.alert('Check availability and select a room.');

      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }
    onSubmit({
      guestId: form.guestId,

      roomId: form.roomId,

      checkIn: form.checkIn,

      checkOut: form.checkOut,

      adults: Number(form.adults),

      children: Number(form.children),

      specialRequests: form.specialRequests || undefined,
    });
  }

  return (
    <div className="modal-backdrop">
      {/* Display the "New Reservation" section and its related actions. */}
      <section className="reservation-modal">
        {/* Show this section's heading, context, and available actions. */}
        <header className="reservation-modal-header">
          <div>
            <h2>New Reservation</h2>

            <p>
              {step === 1
                ? 'Step 1 of 2: Select guest, dates, and an available room.'
                : 'Step 2 of 2: Add special requests and confirm.'}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            aria-label="Close new reservation"
            disabled={isSubmitting}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        {/* Collect the reservations form fields and submit them through the handler above. */}
        <form className="reservation-form" onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <label>
                <span>Guest</span>

                <select
                  required
                  value={form.guestId}
                  onChange={(event) =>
                    updateField('guestId', event.target.value)
                  }
                >
                  <option value="">Select guest</option>

                  {guests.map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guest.firstName} {guest.lastName}
                    </option>
                  ))}
                </select>
              </label>

              <div className="reservation-form-grid">
                <label>
                  <span>Check-in</span>

                  <input
                    required
                    type="date"
                    value={form.checkIn}
                    onChange={(event) =>
                      updateField('checkIn', event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Check-out</span>

                  <input
                    required
                    type="date"
                    value={form.checkOut}
                    onChange={(event) =>
                      updateField('checkOut', event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Adults</span>

                  <input
                    type="number"
                    min="1"
                    required
                    value={form.adults}
                    onChange={(event) =>
                      updateField('adults', event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Children</span>

                  <input
                    type="number"
                    min="0"
                    required
                    value={form.children}
                    onChange={(event) =>
                      updateField('children', event.target.value)
                    }
                  />
                </label>
              </div>

              <button
                type="button"
                className="availability-button"
                onClick={checkAvailability}
                disabled={checkingAvailability}
              >
                <Search size={16} />

                {checkingAvailability ? 'Checking...' : 'Check Availability'}
              </button>

              <p
                className="reservation-availability-message"
                role="status"
                aria-live="polite"
              >
                {checkingAvailability
                  ? 'Checking room availability...'
                  : availabilityMessage}
              </p>
              {hasCheckedAvailability && availableRooms.length > 0 && (
                <fieldset className="reservation-room-picker">
                  <legend>Available rooms</legend>
                  <p>Scroll to browse, then select a room to continue.</p>
                  <div className="reservation-room-list">
                    {availableRooms.map((room) => (
                      <label
                        className={`reservation-room-card${form.roomId === room.id ? ' is-selected' : ''}`}
                        key={room.id}
                      >
                        <input
                          type="radio"
                          name="availableRoom"
                          value={room.id}
                          checked={form.roomId === room.id}
                          onChange={() => updateField('roomId', room.id)}
                        />
                        <span className="reservation-room-details">
                          <strong>Room {room.roomNumber}</strong>
                          <span>{room.roomType}</span>
                          <span>Up to {room.capacity} guests</span>
                          <strong>
                            {formatCurrency(room.ratePerNightCentavos)} / night
                          </strong>
                        </span>
                        <span className="reservation-room-selection">
                          {form.roomId === room.id ? 'Selected' : 'Select room'}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </>
          ) : (
            <>
              <div className="reservation-stay-summary">
                <h3>Stay details</h3>
                <p>
                  Room {selectedRoom?.roomNumber} · {selectedRoom?.roomType}
                </p>
                <p>
                  {form.checkIn} to {form.checkOut}
                </p>
                <p>
                  {form.adults} adult(s) · {form.children} child(ren)
                </p>
                <p>
                  {formatCurrency(selectedRoom?.ratePerNightCentavos ?? 0)} /
                  night
                </p>
              </div>

              <label>
                <span>Special Requests (optional)</span>

                <textarea
                  rows="3"
                  maxLength={1000}
                  disabled={isSubmitting}
                  value={form.specialRequests}
                  onChange={(event) =>
                    updateField('specialRequests', event.target.value)
                  }
                />
              </label>
            </>
          )}

          {/* Show the property footer links and contact information. */}
          <footer className="reservation-modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={step === 1 ? onClose : () => setStep(1)}
              disabled={isSubmitting}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting || checkingAvailability || !selectedRoom}
            >
              {step === 1
                ? 'Next: Special Requests'
                : isSubmitting
                  ? 'Creating...'
                  : 'Create Reservation'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
