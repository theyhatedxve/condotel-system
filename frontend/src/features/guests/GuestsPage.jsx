import LoadingScreen from '../auth/LoadingScreen';
import { useEffect, useState } from 'react';

import {
  ArrowRight,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';

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

  function clearFilters() {
    setSearch('');
    if (!appliedSearch && !status && page === 1) {
      void refreshGuests();
      return;
    }
    setLoading(true);
    setAppliedSearch('');
    setStatus('');
    setPage(1);
  }

  const filtered = Boolean(appliedSearch || status);
  return (
    <section className="guests-page">
      <header className="guests-header">
        <div>
          <span className="guests-eyebrow">Guest directory</span>
          <h1>Guest Management</h1>
          <p>A warm welcome starts with knowing your guests.</p>
        </div>
        <button type="button" className="primary-button" onClick={openCreate}>
          <Plus size={18} />
          Add Guest
        </button>
      </header>
      <section
        className="guest-search-panel"
        aria-labelledby="guest-search-title"
      >
        <div className="guest-search-heading">
          <span className="guest-section-icon">
            <Search size={22} />
          </span>
          <div>
            <h2 id="guest-search-title">Find a guest</h2>
            <p>
              Search by name or username, or use an exact email or phone number.
            </p>
          </div>
        </div>
        <form className="guest-search" onSubmit={handleSearch}>
          <div className="guest-search-input">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Search guests"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, username, email or phone..."
              maxLength={255}
            />
            {search && (
              <button
                type="button"
                className="guest-clear-search"
                aria-label="Clear search text"
                onClick={() => setSearch('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <select
            aria-label="Guest status"
            disabled={loading}
            value={status}
            onChange={(event) => {
              setLoading(true);
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button type="submit" className="primary-button" disabled={loading}>
            <Search size={17} />
            Search Guests
          </button>
          {filtered && (
            <button
              type="button"
              className="guest-reset-filters"
              onClick={clearFilters}
              disabled={loading}
            >
              Reset filters
            </button>
          )}
        </form>
      </section>
      <section
        className="guest-directory"
        aria-labelledby="guest-directory-title"
      >
        <header className="guest-directory-heading">
          <div>
            <span className="guest-section-icon">
              <Users size={23} />
            </span>
            <div>
              <h2 id="guest-directory-title">Guest Directory</h2>
              <p aria-live="polite">
                {loading
                  ? 'Updating your guest list...'
                  : error
                    ? 'Your guest list is temporarily unavailable.'
                    : `${guests.length} guest${guests.length === 1 ? '' : 's'} on this page${filtered ? ' · Filtered results' : ''}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="guest-refresh"
            onClick={refreshGuests}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>
        {loading ? (
          <LoadingScreen
            inline
            title="Loading guests"
            description="Getting your latest guest records."
          />
        ) : error ? (
          <div className="guest-empty" role="alert">
            <Users size={34} aria-hidden="true" />
            <h3>Unable to load guests</h3>
            <p>{error}</p>
            <button
              type="button"
              className="primary-button"
              onClick={refreshGuests}
            >
              Try again
            </button>
          </div>
        ) : guests.length === 0 ? (
          <div className="guest-empty">
            <span className="guest-empty-icon">
              <Users size={34} />
            </span>
            <h3>
              {filtered
                ? 'No matching guests'
                : 'Your guest directory starts here'}
            </h3>
            <p>
              {filtered
                ? 'Try a different search or reset your filters.'
                : 'Add your first guest to keep their contact details ready for their stay.'}
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={filtered ? clearFilters : openCreate}
            >
              {filtered ? 'Reset filters' : 'Add your first guest'}
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="guest-table-wrapper">
            <table className="guest-table">
              <thead>
                <tr>
                  <th scope="col">Guest</th>
                  <th scope="col">Email Address</th>
                  <th scope="col">Phone Number</th>
                  <th scope="col">Account Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => {
                  const fullName = [guest.firstName, guest.lastName]
                    .filter(Boolean)
                    .join(' ');
                  const initials = [guest.firstName, guest.lastName]
                    .filter(Boolean)
                    .map((name) => name.charAt(0).toUpperCase())
                    .join('');
                  return (
                    <tr key={guest.id}>
                      <td>
                        <div className="guest-identity">
                          <span className="guest-avatar" aria-hidden="true">
                            {initials || 'G'}
                          </span>
                          <div>
                            <strong>{fullName || 'Guest'}</strong>
                            <span>
                              {guest.username
                                ? `@${guest.username}`
                                : 'Guest account'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="guest-contact">
                          <Mail size={16} aria-hidden="true" />
                          {guest.email}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`guest-contact${guest.phone ? '' : ' is-missing'}`}
                        >
                          <Phone size={15} aria-hidden="true" />
                          {guest.phone || 'Not provided'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`guest-active-badge ${guest.status.toLowerCase()}`}
                        >
                          <i aria-hidden="true" />
                          {guest.status.charAt(0) +
                            guest.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-icon-button"
                          aria-label={`Edit ${fullName || 'guest'}`}
                          title="Edit guest"
                          onClick={() => openEdit(guest)}
                        >
                          <Pencil size={16} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="guest-directory-footer">
          <span>
            {!loading && !error
              ? `Page ${page} · ${guests.length} guest${guests.length === 1 ? '' : 's'} shown`
              : 'Guest records are visible to authorized staff only.'}
          </span>
          <ListPagination
            label="Guests"
            page={page}
            count={guests.length}
            loading={loading || Boolean(error)}
            onChange={(next) => {
              setLoading(true);
              setPage(next);
            }}
          />
        </div>
      </section>
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
