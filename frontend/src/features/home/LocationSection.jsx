import { Footprints, Utensils, ShoppingBag, Plane, MapPin } from 'lucide-react';
import { coastImage, gallery, property } from './homeContent';

const nearby = [
  { icon: Footprints, time: '3 mins', label: 'to the Beach' },
  { icon: Utensils, time: '5 mins', label: 'to Restaurants' },
  { icon: ShoppingBag, time: '8 mins', label: 'to Shopping Mall' },
  { icon: Plane, time: '15 mins', label: 'to the Airport' },
];

export default function LocationSection() {
  return (
    <section
      id="location"
      className="coast-location coast-container"
      aria-labelledby="coast-location-title"
    >
      <div className="coast-location-copy">
        <p className="coast-eyebrow">PRIME LOCATION</p>
        <h2 id="coast-location-title">Where We’re Located</h2>
        <p>{property.description}</p>
        <div className="coast-nearby">
          {nearby.map(({ icon: Icon, time, label }) => (
            <div key={label}>
              <span className="coast-nearby-icon">
                <Icon size={19} />
              </span>
              <span>
                <strong>{time}</strong>
                <small>{label}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div
        className="coast-map"
        role="img"
        aria-label="Illustrative map of the sample Bayview City location"
      >
        <svg
          viewBox="0 0 520 260"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="coast-map-blocks"
              width="64"
              height="52"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-28)"
            >
              <rect width="64" height="52" fill="#e8ebed" />
              <path d="M0 0H64V52H0Z" fill="none" stroke="white" strokeWidth="5" />
              <path d="M32 0V52" stroke="#f8fafb" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="520" height="260" fill="url(#coast-map-blocks)" />
          <path
            d="M0 0H188Q148 58 177 92T153 171Q121 227 72 260H0Z"
            fill="#98d9ec"
          />
          <path
            d="M188 0Q148 58 177 92T153 171Q121 227 72 260"
            fill="none"
            stroke="#d6eac5"
            strokeWidth="23"
          />
          <path
            d="M202 -15Q167 48 190 87T164 182Q138 232 95 270"
            fill="none"
            stroke="#fff"
            strokeWidth="7"
          />
          <path
            d="M212 34L520 197M165 190L461 14M320 0L428 260"
            fill="none"
            stroke="#fff"
            strokeWidth="7"
          />
          <path d="M212 34L520 197" stroke="#f6e3b4" strokeWidth="3" />
          <circle cx="180" cy="104" r="6" fill="#40a67d" />
          <circle cx="403" cy="176" r="6" fill="#3c97c6" />
          <text x="66" y="107" fill="#3c657b" fontSize="12">
            Bayview Beach
          </text>
          <text x="381" y="201" fill="#607c8d" fontSize="10">
            City Central
          </text>
          <text x="71" y="222" fill="#428eac" fontSize="12" letterSpacing="2">
            THE COAST
          </text>
        </svg>
        <div className="coast-map-marker">
          <MapPin size={39} fill="#113d64" />
          <span>
            <strong>{property.name}</strong>
            <small>{property.address}</small>
          </span>
        </div>
        <small className="coast-map-caption">
          Illustrative location · sample details
        </small>
      </div>
      <div className="coast-location-photo">
        <img
          src={coastImage}
          alt="A sheltered coastal cove and blue ocean"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = gallery[0].src;
          }}
        />
        <span>
          <MapPin size={25} fill="currentColor" />
          <span>
            Steps from
            <br />
            stunning beaches
          </span>
        </span>
      </div>
    </section>
  );
}
