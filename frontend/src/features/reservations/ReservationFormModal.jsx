import { useState } from 'react';

import { Search, X } from 'lucide-react';

import { getAvailableRooms } from './reservationApi';

import { formatCurrency } from '../../utils/formatCurrency';

export default function ReservationFormModal({
  guests,
  isSubmitting,
  onClose,
  onSubmit,
}) {
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
      setAvailableRooms([]);
    }
  }

  async function checkAvailability() {
    if (!form.checkIn || !form.checkOut) {
      window.alert('Select check-in and check-out dates first.');

      return;
    }

    setCheckingAvailability(true);

    try {
      const capacity = Number(form.adults) + Number(form.children);

      const rooms = await getAvailableRooms({
        checkIn: form.checkIn,

        checkOut: form.checkOut,

        capacity,
      });

      setAvailableRooms(rooms);

      if (rooms.length === 0) {
        window.alert('No rooms are available for those dates.');
      }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Unable to check availability.';

      window.alert(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setCheckingAvailability(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.roomId) {
      window.alert('Check availability and select a room.');

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
      <section className="reservation-modal">
        <header className="reservation-modal-header">
          <div>
            <h2>New Reservation</h2>

            <p>Select guest, dates, and an available room.</p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        <form className="reservation-form" onSubmit={handleSubmit}>
          <label>
            <span>Guest</span>

            <select
              required
              value={form.guestId}
              onChange={(event) => updateField('guestId', event.target.value)}
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
                onChange={(event) => updateField('checkIn', event.target.value)}
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
                value={form.adults}
                onChange={(event) => updateField('adults', event.target.value)}
              />
            </label>

            <label>
              <span>Children</span>

              <input
                type="number"
                min="0"
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

          <label>
            <span>Available Room</span>

            <select
              required
              value={form.roomId}
              onChange={(event) => updateField('roomId', event.target.value)}
            >
              <option value="">Select available room</option>

              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {'Room'} {room.roomNumber} {'—'} {room.roomType} {'—'}{' '}
                  {formatCurrency(room.ratePerNightCentavos)}
                  /night
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Special Requests</span>

            <textarea
              rows="3"
              value={form.specialRequests}
              onChange={(event) =>
                updateField('specialRequests', event.target.value)
              }
            />
          </label>

          <footer className="reservation-modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Reservation'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
