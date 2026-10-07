import { useEffect, useState } from 'react';

import { Plus } from 'lucide-react';

import {
  createReservation,
  getReservations,
  updateReservationStatus,
} from './reservationApi';

import { getGuests } from '../guests/guestApi';

import ReservationFormModal from './ReservationFormModal';

import { formatCurrency } from '../../utils/formatCurrency';

import { formatDate } from '../../utils/formatDate';

import { createCheckout } from '../payments/paymentApi';

import './reservations.css';

const filters = [
  {
    label: 'All',
    value: '',
  },
  {
    label: 'Confirmed',
    value: 'CONFIRMED',
  },
  {
    label: 'Pending',
    value: 'PENDING',
  },
  {
    label: 'Checked In',
    value: 'CHECKED_IN',
  },
  {
    label: 'Checked Out',
    value: 'CHECKED_OUT',
  },
];

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);

  const [guests, setGuests] = useState([]);

  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getReservations(statusFilter || undefined), getGuests()])
      .then(([reservationResult, guestResult]) => {
        if (cancelled) {
          return;
        }

        setReservations(reservationResult);

        setGuests(guestResult);
      })
      .catch(() => {
        if (!cancelled) {
          window.alert('Unable to load reservation data.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  async function refreshReservations() {
    setLoading(true);

    try {
      const result = await getReservations(statusFilter || undefined);

      setReservations(result);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(payload) {
    setSubmitting(true);

    try {
      await createReservation(payload);

      setModalOpen(false);

      await refreshReservations();
    } catch (error) {
      const message =
        error.response?.data?.message || 'Unable to create reservation.';

      window.alert(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayment(reservation) {
    try {
      const result = await createCheckout(reservation.id);

      if (!result.checkoutUrl) {
        window.alert('Checkout URL was not returned.');

        return;
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      const message =
        error.response?.data?.message || 'Unable to start payment.';

      window.alert(Array.isArray(message) ? message.join(' ') : message);
    }
  }

  async function handleStatus(reservation, status) {
    try {
      await updateReservationStatus(reservation.id, status);

      await refreshReservations();
    } catch (error) {
      const message =
        error.response?.data?.message || 'Unable to update reservation.';

      window.alert(Array.isArray(message) ? message.join(' ') : message);
    }
  }

  return (
    <section className="reservations-page">
      <header className="reservations-header">
        <div>
          <h1>Reservations</h1>

          <p>Manage bookings and room availability.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={17} />
          New Reservation
        </button>
      </header>

      <div className="reservation-filters">
        {filters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            className={
              statusFilter === filter.value
                ? 'room-filter active'
                : 'room-filter'
            }
            onClick={() => {
              setLoading(true);

              setStatusFilter(filter.value);
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rooms-loading">Loading reservations...</div>
      ) : (
        <div className="reservation-table-wrapper">
          <table className="reservation-table">
            <thead>
              <tr>
                <th>Reference No.</th>

                <th>Guest</th>
                <th>{'Room'}</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{reservation.referenceNo}</td>

                  <td>
                    {reservation.guest.firstName} {reservation.guest.lastName}
                  </td>

                  <td>
                    {'Room'} {reservation.room.roomNumber}
                  </td>

                  <td>{formatDate(reservation.checkIn)}</td>

                  <td>{formatDate(reservation.checkOut)}</td>

                  <td>{formatCurrency(reservation.totalAmountCentavos)}</td>

                  <td>
                    <span
                      className={`reservation-status ${reservation.status.toLowerCase()}`}
                    >
                      {reservation.status}
                    </span>
                  </td>

                  <td>
                    <div className="reservation-actions">
                      {reservation.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handlePayment(reservation)}
                        >
                          Pay
                        </button>
                      )}

                      {['PENDING', 'CONFIRMED'].includes(
                        reservation.status,
                      ) && (
                        <button
                          type="button"
                          onClick={() => handleStatus(reservation, 'CANCELLED')}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ReservationFormModal
          key="new-reservation"
          guests={guests}
          isSubmitting={submitting}
          onClose={() => {
            if (!submitting) {
              setModalOpen(false);
            }
          }}
          onSubmit={handleCreate}
        />
      )}
    </section>
  );
}
