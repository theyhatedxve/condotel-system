import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Users, X, ArrowRight } from 'lucide-react';
import RoomPhoto from '../landing/RoomPhoto';
import { formatCurrency } from '../../utils/formatCurrency';
import { gallery, property } from './homeContent';

// Render the selected homepage information, gallery, or featured-room dialog.
export default function HomeDialog({ selection, onClose }) {
  // Track local state and read any session or route values needed by this component.
  const ref = useRef(null);
  const room = selection.room;
  const title = room
    ? room.name
    : selection.type === 'gallery'
      ? 'A glimpse of your next escape'
      : `About ${property.name}`;

  // Open the browser dialog after its DOM element is mounted.
  useEffect(() => {
    if (!ref.current.open) ref.current.showModal();
  }, []);

  return (
    /* Display the selected information in a closable browser dialog. */
    <dialog
      ref={ref}
      className="coast-dialog"
      aria-labelledby="coast-dialog-title"
      onClose={onClose}
    >
      {/* Show this section's heading, context, and available actions. */}
      <header>
        <div>
          <p className="coast-eyebrow">{property.name}</p>
          <h2 id="coast-dialog-title">{title}</h2>
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={() => ref.current.close()}
          autoFocus
        >
          <X size={22} />
        </button>
      </header>
      {room ? (
        <div className="coast-room-preview">
          <div className="coast-preview-photo">
            <RoomPhoto room={room} />
          </div>
          <div className="coast-preview-copy">
            <p className="coast-eyebrow">SAMPLE ROOM PREVIEW</p>
            <p>{room.description}</p>
            <div className="coast-room-facts">
              <span>
                <Users size={16} />
                {room.capacity} Guests
              </span>
              <span>
                <BedDouble size={16} />
                {room.beds}
              </span>
            </div>
            <p className="coast-preview-price">
              <strong>{formatCurrency(room.ratePerNightCentavos)}</strong> /
              night
            </p>
            <Link to="/rooms" className="coast-button coast-button-navy">
              Browse available rooms <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : selection.type === 'gallery' ? (
        <div className="coast-gallery">
          {gallery.map((photo) => (
            <figure key={photo.src}>
              <img src={photo.src} alt={photo.alt} />
              <figcaption>{photo.label}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="coast-about-copy">
          <p>
            Modern living meets the easy rhythm of the coast. Discover
            comfortable spaces, thoughtfully designed surroundings, and a place
            to make your own.
          </p>
          <p>
            This homepage currently uses sample property details. Browse the
            room catalog for the rooms available in the system.
          </p>
          <Link to="/rooms" className="coast-button coast-button-navy">
            Explore rooms <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </dialog>
  );
}
