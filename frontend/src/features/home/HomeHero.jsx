import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Images } from 'lucide-react';
import { gallery } from './homeContent';

// Render the hero image slides and the room/gallery actions.
export default function HomeHero({ onGallery }) {
  // Track local state and read any session or route values needed by this component.
  const [active, setActive] = useState(0);
  const photo = gallery[active];

  // Move the hero carousel by the requested direction with wraparound.
  function step(direction) {
    setActive((index) => (index + direction + gallery.length) % gallery.length);
  }

  return (
    /* Display the "Your Modern Coastal Stay Awaits" section and its related actions. */
    <section className="coast-hero" aria-labelledby="coast-title">
      <img
        className="coast-hero-photo"
        src={photo.src}
        alt=""
        style={{ objectPosition: photo.position }}
        fetchPriority="high"
      />
      <div className="coast-container coast-hero-inner">
        <div className="coast-hero-copy">
          <p className="coast-eyebrow">PREMIUM NEXORA EXPERIENCE</p>
          <h1 id="coast-title">
            Your Modern
            <br />
            Coastal Stay Awaits
          </h1>
          <p className="coast-intro">
            Experience a perfect blend of comfort, convenience, and coastal
            living.
            <br className="coast-desktop-break" /> NEXORA offers
            beautifully designed rooms, easy booking,
            <br className="coast-desktop-break" /> secure access, and a relaxing
            premium stay.
          </p>
          <div className="coast-hero-actions">
            <Link to="/rooms" className="coast-button coast-button-gold">
              Explore Rooms <ArrowRight size={17} />
            </Link>
            <button
              type="button"
              className="coast-button coast-button-glass"
              onClick={onGallery}
            >
              <Images size={17} />
              View Gallery
            </button>
          </div>
        </div>
        <div className="coast-carousel" aria-label="Property photos">
          <button
            type="button"
            aria-label="Previous property photo"
            onClick={() => step(-1)}
          >
            <ArrowLeft size={17} />
          </button>
          {gallery.map((item, index) => (
            <button
              key={item.src}
              type="button"
              className={`coast-slide-number ${index === active ? 'is-active' : ''}`}
              aria-label={`Show photo ${index + 1}: ${item.label}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            >
              {String(index + 1).padStart(2, '0')}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next property photo"
            onClick={() => step(1)}
          >
            <ArrowRight size={17} />
          </button>
          <span className="coast-sr-only" aria-live="polite">
            {photo.label}
          </span>
        </div>
      </div>
    </section>
  );
}
