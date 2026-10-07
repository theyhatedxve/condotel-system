import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Users } from 'lucide-react';
import RoomPhoto from './RoomPhoto';
import { formatCurrency } from '../../utils/formatCurrency';

export default function RoomDetails({ room, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element.open) element.showModal();
  }, []);

  return (
    <dialog
      className="stay-dialog"
      ref={dialog}
      onClose={onClose}
      aria-labelledby="stay-detail-title"
    >
      <button
        className="stay-dialog-close"
        aria-label="Close room details"
        onClick={() => dialog.current.close()}
        autoFocus
      >
        <X />
      </button>
      <div className="stay-detail-photo">
        <RoomPhoto room={room} />
      </div>
      <div className="stay-detail-content">
        <span className="stay-room-type">
          {room.roomType} · Room {room.roomNumber}
        </span>
        <h2 id="stay-detail-title">{room.name}</h2>
        <p>
          {room.description ||
            'Contact the property for more information about this room.'}
        </p>
        <p className="stay-room-meta">
          <Users size={18} />
          Up to {room.capacity} guests
          {room.floor !== null && <span>Floor {room.floor}</span>}
        </p>
        <strong className="stay-detail-price">
          {formatCurrency(room.ratePerNightCentavos)} <small>/ night</small>
        </strong>
        <Link className="stay-button" to="/login">
          Sign in to continue
        </Link>
      </div>
    </dialog>
  );
}
