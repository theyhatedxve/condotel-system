import { useEffect, useState } from 'react';

import { Pencil, Plus, Search } from 'lucide-react';

import { createGuest, getGuests, updateGuest } from './guestApi';

import GuestFormModal from './GuestFormModal';

import './guests.css';
import ListPagination from '../../components/ListPagination';

// Render the guests page with its loading, error, and record/form states.
export default function GuestsPage() {
  // Track local state and read any session or route values needed by this component.
  const [guests, setGuests] = useState([]);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Only submitted searches reach the API; typing alone does not reload the guest list.
  const [appliedSearch, setAppliedSearch] = useState('');

  const [selectedGuest, setSelectedGuest] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Load guest records for the applied search, status, and page while ignoring stale
  // results.
  useEffect(() => {
    let cancelled = false;

    getGuests(appliedSearch || undefined, status || undefined, page)
      .then((result) => {
        if (!cancelled) {
          setGuests(result);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to load guests.');
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
  }, [appliedSearch, status, page]);

  // Reload the current guest list after saving or reapplying its filters.
  async function refreshGuests() {
    setLoading(true);

    try {
      const result = await getGuests(
        appliedSearch || undefined,
        status || undefined,
        page,
      );

      setGuests(result);
      setError('');
    } catch {
      setError('Unable to load guests.');
    } finally {
      setLoading(false);
    }
  }

  // Apply the entered search text and reset guest pagination when the search changes.
  function handleSearch(event) {
    event.preventDefault();
    if (appliedSearch === search.trim()) {
      void refreshGuests();
      return;
    }
    setLoading(true);
    setAppliedSearch(search.trim());
    setPage(1);
  }

  // Open an empty guest form for account creation.
  function openCreate() {
    setSelectedGuest(null);
    setModalOpen(true);
  }

  // Select the record and open its editing form.
  function openEdit(guest) {
    setSelectedGuest(guest);
    setModalOpen(true);
  }

  // Create or update the selected guest, then close the form and reload its list.
  async function handleSave(payload) {
    setSubmitting(true);

    try {
      if (selectedGuest) {
        await updateGuest(selectedGuest.id, payload);
      } else {
        await createGuest(payload);
      }

      setModalOpen(false);
      setSelectedGuest(null);

      await refreshGuests();
    } catch (requestError) {
      const message =
        requestError.response?.data?.message || 'Unable to save guest.';

      window.alert(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /* Display the "Guest Management" section and its related actions. */
    <section className="guests-page">
      {/* Show this section's heading, context, and available actions. */}
      <header className="guests-header">
        <div>
          <h1>Guest Management</h1>

          <p>Manage registered and walk-in guests.</p>
        </div>

        <button type="button" className="primary-button" onClick={openCreate}>
          <Plus size={17} />
          Add Guest
        </button>
      </header>

      {/* Collect the guests form fields and submit them through the handler above. */}
      <form className="guest-search" onSubmit={handleSearch}>
        <Search size={17} />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name/username or exact email/phone"
          maxLength={255}
        />

        <button type="submit" className="primary-button">
          Search
        </button>
        <select
          aria-label="Guest status"
          value={status}
          onChange={(event) => {
            setLoading(true);
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
          <option>SUSPENDED</option>
        </select>
      </form>

      {error && <div className="rooms-error">{error}</div>}

      {loading ? (
        <div className="rooms-loading">Loading guests...</div>
      ) : (
        <div className="guest-table-wrapper">
          {/* Display guests records with their existing columns and row actions. */}
          <table className="guest-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id}>
                  <td>
                    {guest.firstName} {guest.lastName}
                  </td>

                  <td>{guest.email}</td>

                  <td>{guest.phone || '-'}</td>

                  <td>
                    <span className="guest-active-badge">{guest.status}</span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="table-icon-button"
                      onClick={() => openEdit(guest)}
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ListPagination
        label="Guests"
        page={page}
        count={guests.length}
        loading={loading}
        onChange={(next) => {
          setLoading(true);
          setPage(next);
        }}
      />
      {modalOpen && (
        <GuestFormModal
          key={selectedGuest?.id ?? 'new-guest'}
          guest={selectedGuest}
          isSubmitting={submitting}
          onClose={() => {
            if (!submitting) {
              setModalOpen(false);
              setSelectedGuest(null);
            }
          }}
          onSubmit={handleSave}
        />
      )}
    </section>
  );
}
