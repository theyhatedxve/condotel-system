import { useEffect, useRef, useState } from 'react';

import { Plus } from 'lucide-react';

import {
  createReservation,
  getReservations,
  updateReservationStatus,
} from './reservationApi';

import { getGuests } from '../guests/guestApi';

import ReservationFormModal from './ReservationFormModal';
import ReservationNotesEditor from './ReservationNotesEditor';
import ListPagination from '../../components/ListPagination';

import { formatCurrency } from '../../utils/formatCurrency';

import { formatDate } from '../../utils/formatDate';

import useHostedCheckout from '../payments/useHostedCheckout';

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

// Render the reservations page with its loading, error, and record/form states.
export default function ReservationsPage() {
  // Track local state and read any session or route values needed by this component.
  const [reservations, setReservations] = useState([]);
  const [page, setPage] = useState(1);

  const [guests, setGuests] = useState([]);

  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const paymentInFlight = useRef(false);
  const [payingId, setPayingId] = useState(null);
  const { start, waiting, returnToSite } = useHostedCheckout();

  // Load the reservation page and guest selector data whenever the status filter or page
  // changes.
  useEffect(() => {
    let cancelled = false;

    Promise.all([getReservations(statusFilter || undefined, page), getGuests()])
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
  }, [statusFilter, page]);

  // Reload the current reservation page and status filter after a change.
  async function refreshReservations() {
    setLoading(true);

    try {
      const result = await getReservations(statusFilter || undefined, page);

      setReservations(result);
    } finally {
      setLoading(false);
    }
  }

  // Create the submitted reservation, close the form, and refresh the reservation list.
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

  // Prevent overlapping Pay requests and open the verified hosted checkout flow.
  async function handlePayment(reservation) {
    if (paymentInFlight.current) return;
    paymentInFlight.current = true;
    setPayingId(reservation.id);
    try {
      await start(reservation.id);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to start payment.';

      window.alert(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      paymentInFlight.current = false;
      setPayingId(null);
    }
  }

  // Submit a reservation status transition and refresh the management list.
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
    /* Display the "Reservations" section and its related actions. */
    <section className="reservations-page">
      {/* Show this section's heading, context, and available actions. */}
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

      {waiting && (
        <div role="status">
          <p>
            Payment is open in the PayMongo window. If payment fails or expires,
            return here to continue.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={returnToSite}
          >
            Return to Reservations
          </button>
        </div>
      )}

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
              setPage(1);
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
          {/* Display reservations records with their existing columns and row actions. */}
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
                      <ReservationNotesEditor
                        reservation={reservation}
                        onSaved={refreshReservations}
                      />
                      {reservation.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatus(reservation, 'CHECKED_IN')
                          }
                        >
                          Check In
                        </button>
                      )}
                      {reservation.status === 'CHECKED_IN' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatus(reservation, 'CHECKED_OUT')
                          }
                        >
                          Check Out
                        </button>
                      )}
                      {reservation.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handlePayment(reservation)}
                          disabled={payingId !== null}
                        >
                          {payingId === reservation.id
                            ? 'Opening checkout...'
                            : 'Pay'}
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

      <ListPagination
        label="Reservations"
        page={page}
        count={reservations.length}
        loading={loading}
        onChange={(next) => {
          setLoading(true);
          setPage(next);
        }}
      />
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
