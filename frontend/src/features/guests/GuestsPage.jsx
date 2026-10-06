import {
  useEffect,
  useState,
} from 'react';

import {
  Pencil,
  Plus,
  Search,
} from 'lucide-react';

import {
  createGuest,
  getGuests,
  updateGuest,
} from './guestApi';

import GuestFormModal from
  './GuestFormModal';

import './guests.css';

export default function GuestsPage() {
  const [guests, setGuests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState('');

  const [
    selectedGuest,
    setSelectedGuest,
  ] = useState(null);

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getGuests(
      appliedSearch ||
        undefined,
    )
      .then((result) => {
        if (!cancelled) {
          setGuests(result);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            'Unable to load guests.',
          );
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
  }, [appliedSearch]);

  async function refreshGuests() {
    setLoading(true);

    try {
      const result =
        await getGuests(
          appliedSearch ||
            undefined,
        );

      setGuests(result);
      setError('');
    } catch {
      setError(
        'Unable to load guests.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();

    setLoading(true);
    setAppliedSearch(
      search.trim(),
    );
  }

  function openCreate() {
    setSelectedGuest(null);
    setModalOpen(true);
  }

  function openEdit(guest) {
    setSelectedGuest(guest);
    setModalOpen(true);
  }

  async function handleSave(
    payload,
  ) {
    setSubmitting(true);

    try {
      if (selectedGuest) {
        await updateGuest(
          selectedGuest.id,
          payload,
        );
      } else {
        await createGuest(
          payload,
        );
      }

      setModalOpen(false);
      setSelectedGuest(null);

      await refreshGuests();
    } catch (requestError) {
      const message =
        requestError.response
          ?.data?.message ||
        'Unable to save guest.';

      window.alert(
        Array.isArray(message)
          ? message.join(' ')
          : message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="guests-page">
      <header className="guests-header">
        <div>
          <h1>
            Guest Management
          </h1>

          <p>
            Manage registered and
            walk-in guests.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreate}
        >
          <Plus size={17} />
          Add Guest
        </button>
      </header>

      <form
        className="guest-search"
        onSubmit={handleSearch}
      >
        <Search size={17} />

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Search by name, email, username, or phone..."
        />

        <button
          type="submit"
          className="primary-button"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="rooms-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rooms-loading">
          Loading guests...
        </div>
      ) : (
        <div className="guest-table-wrapper">
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
              {guests.map(
                (guest) => (
                  <tr key={guest.id}>
                    <td>
                      {guest.firstName}{' '}
                      {guest.lastName}
                    </td>

                    <td>
                      {guest.email}
                    </td>

                    <td>
                      {guest.phone ||
                        '-'}
                    </td>

                    <td>
                      <span className="guest-active-badge">
                        {guest.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="table-icon-button"
                        onClick={() =>
                          openEdit(
                            guest,
                          )
                        }
                      >
                        <Pencil
                          size={15}
                        />
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <GuestFormModal
          key={
            selectedGuest?.id ??
            'new-guest'
          }
          guest={
            selectedGuest
          }
          isSubmitting={
            submitting
          }
          onClose={() => {
            if (!submitting) {
              setModalOpen(false);
              setSelectedGuest(
                null,
              );
            }
          }}
          onSubmit={
            handleSave
          }
        />
      )}
    </section>
  );
}