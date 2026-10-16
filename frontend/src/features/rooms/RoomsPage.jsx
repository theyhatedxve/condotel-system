import LoadingScreen from '../auth/LoadingScreen';
import { useEffect, useState } from 'react';

import { Plus } from 'lucide-react';

import {
  createRoom,
  deactivateRoom,
  getRooms,
  reactivateRoom,
  updateRoom,
} from './roomApi';

import RoomCard from './RoomCard';

import RoomFormModal from './RoomFormModal';

import { useAuth } from '../auth/useAuth';

import './rooms.css';

const filters = [
  {
    label: 'All',
    value: '',
  },
  {
    label: 'Available',
    value: 'AVAILABLE',
  },
  {
    label: 'Occupied',
    value: 'OCCUPIED',
  },
  {
    label: 'Maintenance',
    value: 'MAINTENANCE',
  },
];

// Convert an API failure into a readable message, including validation-message arrays.
function getErrorMessage(error, fallbackMessage) {
  const message = error.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message || fallbackMessage;
}

// Render the rooms page with its loading, error, and record/form states.
export default function RoomsPage() {
  // Track local state and read any session or route values needed by this component.
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);

  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === 'ADMIN';

  // Load rooms for the selected status and ignore a request completed after unmount.
  useEffect(() => {
    let cancelled = false;

    getRooms(statusFilter || undefined)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setRooms(result);
        setError('');
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setError(getErrorMessage(requestError, 'Unable to load rooms.'));
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

  // Reload rooms with the current management status filter.
  async function refreshRooms() {
    setLoading(true);

    try {
      const result = await getRooms(statusFilter || undefined);

      setRooms(result);
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load rooms.'));
    } finally {
      setLoading(false);
    }
  }

  // Select the management room status filter and refresh its loading state.
  function handleFilterChange(value) {
    if (value === statusFilter) {
      return;
    }

    setLoading(true);
    setStatusFilter(value);
  }

  // Open the room form with the existing new-room defaults.
  function openCreateModal() {
    setSelectedRoom(null);
    setModalOpen(true);
  }

  // Select the room to edit and open its form.
  function openEditModal(room) {
    setSelectedRoom(room);
    setModalOpen(true);
  }

  // Close the management form and clear the selected record.
  function closeModal() {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setSelectedRoom(null);
  }

  // Create or update a room using the selected form mode, then refresh the room list.
  async function handleSave(payload) {
    setSubmitting(true);

    try {
      if (selectedRoom) {
        await updateRoom(selectedRoom.id, payload);
      } else {
        await createRoom(payload);
      }

      setModalOpen(false);
      setSelectedRoom(null);

      await refreshRooms();
    } catch (requestError) {
      window.alert(getErrorMessage(requestError, 'Unable to save room.'));
    } finally {
      setSubmitting(false);
    }
  }

  // Confirm room deactivation and refresh the room list after success.
  async function handleDeactivate(room) {
    const confirmed = window.confirm(`Deactivate Room ${room.roomNumber}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deactivateRoom(room.id);

      await refreshRooms();
    } catch (requestError) {
      window.alert(getErrorMessage(requestError, 'Unable to deactivate room.'));
    }
  }

  // Restore the selected room and refresh the management list.
  async function handleReactivate(room) {
    try {
      await reactivateRoom(room.id);

      await refreshRooms();
    } catch (requestError) {
      window.alert(getErrorMessage(requestError, 'Unable to reactivate room.'));
    }
  }

  return (
    /* Display the "Room Management" section and its related actions. */
    <section className="rooms-page">
      {/* Show this section's heading, context, and available actions. */}
      <header className="rooms-page-header">
        <div>
          <h1>Room Management</h1>

          <p>Manage NEXORA rooms, rates, and availability.</p>
        </div>

        {canManage && (
          <button
            type="button"
            className="primary-button add-room-button"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            Add Room
          </button>
        )}
      </header>

      <div className="room-filter-bar">
        {filters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            className={
              statusFilter === filter.value
                ? 'room-filter active'
                : 'room-filter'
            }
            onClick={() => handleFilterChange(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && <div className="rooms-error">{error}</div>}

      {loading ? (
        <div className="rooms-loading">
          <LoadingScreen
            inline
            title="Loading rooms"
            description="Fetching the latest details for this page."
          />
        </div>
      ) : rooms.length === 0 ? (
        <div className="rooms-empty">No rooms found.</div>
      ) : (
        <div className="room-grid">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              canManage={canManage}
              onEdit={openEditModal}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <RoomFormModal
          key={selectedRoom?.id ?? 'new-room'}
          room={selectedRoom}
          isSubmitting={submitting}
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}
    </section>
  );
}
