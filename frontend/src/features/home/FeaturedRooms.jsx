import { ArrowRight, BedDouble, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import RoomPhoto from '../landing/RoomPhoto';
import { formatCurrency } from '../../utils/formatCurrency';
import { featuredRooms } from './homeContent';

export default function FeaturedRooms({ onSelect }) {
  return (
    <section className="coast-featured" aria-labelledby="coast-featured-title">
      <div className="coast-container coast-featured-layout">
        <div className="coast-featured-copy">
          <p className="coast-eyebrow">OUR ROOMS</p>
          <h2 id="coast-featured-title">Featured Rooms</h2>
          <p>
            A glimpse of our most popular stays. Each room is designed for
            comfort, style, and a memorable experience.
          </p>
          <Link to="/rooms" className="coast-button coast-button-outline">
            View All Rooms <ArrowRight size={16} />
          </Link>
        </div>
        <div className="coast-featured-grid">
          {featuredRooms.map((room) => (
            <article className="coast-room-card" key={room.id}>
              <div className="coast-room-image">
                <RoomPhoto room={room} />
              </div>
              <div className="coast-room-copy">
                <h3>{room.name}</h3>
                <p>{room.description}</p>
                <div className="coast-room-facts">
                  <span>
                    <Users size={14} />
                    {room.capacity} Guests
                  </span>
                  <span>
                    <BedDouble size={15} />
                    {room.beds}
                  </span>
                </div>
                <div className="coast-room-price">
                  <p>
                    <strong>{formatCurrency(room.ratePerNightCentavos)}</strong>{' '}
                    <span>/ night</span>
                  </p>
                  <button
                    type="button"
                    className="coast-button coast-button-navy"
                    onClick={() => onSelect(room)}
                  >
                    View Room <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
