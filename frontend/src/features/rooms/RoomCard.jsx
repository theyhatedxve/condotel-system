import {
  BedDouble,
  MoreVertical,
  Pencil,
  Power,
  RotateCcw,
  Users,
} from 'lucide-react';

import { formatCurrency } from '../../utils/formatCurrency';

function getStatusClass(status) {
  return status.toLowerCase().replaceAll('_', '-');
}

export default function RoomCard({
  room,
  canManage,
  onEdit,
  onDeactivate,
  onReactivate,
}) {
  return (
    <article className={`room-card ${!room.isActive ? 'inactive' : ''}`}>
      <div className="room-image">
        {room.imageUrl ? (
          <img src={room.imageUrl} alt={`Room ${room.roomNumber}`} />
        ) : (
          <div className="room-image-placeholder">
            <BedDouble size={42} />

            <span>Room {room.roomNumber}</span>
          </div>
        )}

        {!room.isActive && <span className="inactive-overlay">Inactive</span>}
      </div>

      <div className="room-card-body">
        <div className="room-card-heading">
          <div>
            <h3>Room {room.roomNumber}</h3>

            <p>{room.roomType}</p>
          </div>

          <MoreVertical size={18} />
        </div>

        <strong className="room-price">
          {formatCurrency(room.ratePerNightCentavos)}
          <span>/night</span>
        </strong>

        <div className="room-details">
          <span>
            <Users size={14} />
            {room.capacity} {'guest'}
            {room.capacity === 1 ? '' : 's'}
          </span>

          {room.floor !== null && <span>Floor {room.floor}</span>}
        </div>

        <div className="room-card-footer">
          <span className={`room-status ${getStatusClass(room.status)}`}>
            {room.status.replaceAll('_', ' ')}
          </span>

          {canManage && (
            <div className="room-actions">
              <button
                type="button"
                title="Edit room"
                onClick={() => onEdit(room)}
              >
                <Pencil size={15} />
              </button>

              {room.isActive ? (
                <button
                  type="button"
                  title="Deactivate room"
                  onClick={() => onDeactivate(room)}
                >
                  <Power size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  title="Reactivate room"
                  onClick={() => onReactivate(room)}
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
