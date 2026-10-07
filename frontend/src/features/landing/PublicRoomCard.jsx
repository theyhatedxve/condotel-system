import { Users } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import RoomPhoto from './RoomPhoto';

export default function PublicRoomCard({ room, dateSearch, onDetails }) {
  const available = dateSearch || room.status === 'AVAILABLE';
  return (
    <article className="stay-room-card">
      <div className="stay-room-photo">
        <RoomPhoto room={room} />
        <span className={`stay-status ${available ? '' : 'stay-status-muted'}`}>
          {available
            ? 'Available'
            : room.status.replaceAll('_', ' ').toLowerCase()}
        </span>
      </div>
      <div className="stay-room-content">
        <span className="stay-room-type">{room.roomType}</span>
        <h3>{room.name}</h3>
        <p className="stay-room-description">
          {room.description ||
            `Explore ${room.name} and find space for your next stay.`}
        </p>
        <div className="stay-room-meta">
          <Users size={16} />
          Up to {room.capacity} guests<span>Room {room.roomNumber}</span>
        </div>
        <div className="stay-room-bottom">
          <p>
            <strong>{formatCurrency(room.ratePerNightCentavos)}</strong>
            <span> / night</span>
          </p>
          <button className="stay-button" onClick={() => onDetails(room)}>
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}
