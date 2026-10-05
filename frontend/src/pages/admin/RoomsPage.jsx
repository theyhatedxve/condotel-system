import {
  useEffect,
  useState,
} from 'react';

import {
  Plus,
} from 'lucide-react';

import {
  createRoom,
  deactivateRoom,
  getRooms,
  reactivateRoom,
  updateRoom,
} from '../../api/roomApi';

import RoomCard from
  '../../components/rooms/RoomCard';

import RoomFormModal from
  '../../components/rooms/RoomFormModal';

import { useAuth } from
  '../../hooks/useAuth';

import '../../styles/rooms.css';

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

function getErrorMessage(
  error,
  fallbackMessage,
) {
  const message =
    error.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return (
    message ||
    fallbackMessage
  );
}

export default function RoomsPage() {
  const { user } =
    useAuth();

  const [rooms, setRooms] =
    useState([]);

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    selectedRoom,
    setSelectedRoom,
  ] = useState(null);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const canManage =
    user?.role === 'ADMIN';

  useEffect(() => {
    let cancelled = false;

    getRooms(
      statusFilter ||
        undefined,
    )
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

        setError(
          getErrorMessage(
            requestError,
            'Unable to load rooms.',
          ),
        );
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

  async function refreshRooms() {
    setLoading(true);

    try {
      const result =
        await getRooms(
          statusFilter ||
            undefined,
        );

      setRooms(result);
      setError('');
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Unable to load rooms.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(
    value,
  ) {
    if (
      value === statusFilter
    ) {
      return;
    }

    setLoading(true);
    setStatusFilter(value);
  }

  function openCreateModal() {
    setSelectedRoom(null);
    setModalOpen(true);
  }

  function openEditModal(room) {
    setSelectedRoom(room);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setSelectedRoom(null);
  }

  async function handleSave(
    payload,
  ) {
    setSubmitting(true);

    try {
      if (selectedRoom) {
        await updateRoom(
          selectedRoom.id,
          payload,
        );
      } else {
        await createRoom(
          payload,
        );
      }

      setModalOpen(false);
      setSelectedRoom(null);

      await refreshRooms();
    } catch (requestError) {
      window.alert(
        getErrorMessage(
          requestError,
          'Unable to save room.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(
    room,
  ) {
    const confirmed =
      window.confirm(
        `Deactivate Room ${room.roomNumber}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deactivateRoom(
        room.id,
      );

      await refreshRooms();
    } catch (requestError) {
      window.alert(
        getErrorMessage(
          requestError,
          'Unable to deactivate room.',
        ),
      );
    }
  }

  async function handleReactivate(
    room,
  ) {
    try {
      await reactivateRoom(
        room.id,
      );

      await refreshRooms();
    } catch (requestError) {
      window.alert(
        getErrorMessage(
          requestError,
          'Unable to reactivate room.',
        ),
      );
    }
  }

  return (
    <section className="rooms-page">
      <header className="rooms-page-header">
        <div>
          <h1>
            Room Management
          </h1>

          <p>
            Manage condotel rooms,
            rates, and availability.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="primary-button add-room-button"
            onClick={
              openCreateModal
            }
          >
            <Plus size={17} />

            Add Room
          </button>
        )}
      </header>

      <div className="room-filter-bar">
        {filters.map(
          (filter) => (
            <button
              key={
                filter.label
              }
              type="button"
              className={
                statusFilter ===
                filter.value
                  ? 'room-filter active'
                  : 'room-filter'
              }
              onClick={() =>
                handleFilterChange(
                  filter.value,
                )
              }
            >
              {filter.label}
            </button>
          ),
        )}
      </div>

      {error && (
        <div className="rooms-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rooms-loading">
          Loading rooms...
        </div>
      ) : rooms.length === 0 ? (
        <div className="rooms-empty">
          No rooms found.
        </div>
      ) : (
        <div className="room-grid">
          {rooms.map(
            (room) => (
              <RoomCard
                key={room.id}
                room={room}
                canManage={
                  canManage
                }
                onEdit={
                  openEditModal
                }
                onDeactivate={
                  handleDeactivate
                }
                onReactivate={
                  handleReactivate
                }
              />
            ),
          )}
        </div>
      )}

      {modalOpen && (
        <RoomFormModal
          key={
            selectedRoom?.id ??
            'new-room'
          }
          room={selectedRoom}
          isSubmitting={
            submitting
          }
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}
    </section>
  );
}