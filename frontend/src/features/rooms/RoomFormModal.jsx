import { useState } from 'react';

import { X } from 'lucide-react';

function createInitialForm(room) {
  if (!room) {
    return {
      roomNumber: '',
      name: '',
      roomType: '',
      description: '',
      floor: '',
      capacity: '2',
      ratePerNight: '',
      status: 'AVAILABLE',
      imageUrl: '',
    };
  }

  return {
    roomNumber: room.roomNumber ?? '',

    name: room.name ?? '',

    roomType: room.roomType ?? '',

    description: room.description ?? '',

    floor: room.floor ?? '',

    capacity: String(room.capacity ?? 2),

    ratePerNight: String((room.ratePerNightCentavos ?? 0) / 100),

    status: room.status ?? 'AVAILABLE',

    imageUrl: room.imageUrl ?? '',
  };
}

export default function RoomFormModal({
  room,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => createInitialForm(room));

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const ratePerNight = Number(form.ratePerNight);

    const payload = {
      roomNumber: form.roomNumber.trim(),

      name: form.name.trim(),

      roomType: form.roomType.trim(),

      description: form.description.trim() || undefined,

      floor: form.floor === '' ? undefined : Number(form.floor),

      capacity: Number(form.capacity),

      // The form accepts pesos; the API stores integer centavos.
      ratePerNightCentavos: Math.round(ratePerNight * 100),

      status: form.status,

      imageUrl: form.imageUrl.trim() || undefined,
    };

    onSubmit(payload);
  }

  return (
    <div className="modal-backdrop">
      <section className="room-modal">
        <header className="room-modal-header">
          <div>
            <h2>{room ? 'Edit Room' : 'Add Room'}</h2>

            <p>
              {room
                ? 'Update room information.'
                : 'Create a new condotel room.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="modal-close-button"
            aria-label="Close room form"
          >
            <X size={20} />
          </button>
        </header>

        <form className="room-form" onSubmit={handleSubmit}>
          <div className="room-form-grid">
            <label>
              <span>Room Number</span>

              <input
                required
                value={form.roomNumber}
                onChange={(event) =>
                  updateField('roomNumber', event.target.value)
                }
                placeholder="101"
              />
            </label>

            <label>
              <span>Room Name</span>

              <input
                required
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Room 101"
              />
            </label>

            <label>
              <span>Room Type</span>

              <input
                required
                value={form.roomType}
                onChange={(event) =>
                  updateField('roomType', event.target.value)
                }
                placeholder="Deluxe Room"
              />
            </label>

            <label>
              <span>Floor</span>

              <input
                type="number"
                min="0"
                value={form.floor}
                onChange={(event) => updateField('floor', event.target.value)}
                placeholder="1"
              />
            </label>

            <label>
              <span>Capacity</span>

              <input
                required
                type="number"
                min="1"
                value={form.capacity}
                onChange={(event) =>
                  updateField('capacity', event.target.value)
                }
              />
            </label>

            <label>
              <span>Rate / Night (₱)</span>

              <input
                required
                type="number"
                min="1"
                step="0.01"
                value={form.ratePerNight}
                onChange={(event) =>
                  updateField('ratePerNight', event.target.value)
                }
                placeholder="2500"
              />
            </label>

            <label>
              <span>Status</span>

              <select
                value={form.status}
                onChange={(event) => updateField('status', event.target.value)}
              >
                <option value="AVAILABLE">Available</option>

                <option value="OCCUPIED">Occupied</option>

                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </label>

            <label>
              <span>Image URL</span>

              <input
                value={form.imageUrl}
                onChange={(event) =>
                  updateField('imageUrl', event.target.value)
                }
                placeholder="Optional"
              />
            </label>
          </div>

          <label className="room-description-field">
            <span>Description</span>

            <textarea
              rows="4"
              value={form.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
              placeholder="Room description..."
            />
          </label>

          <footer className="room-modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : room ? 'Save Changes' : 'Add Room'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
