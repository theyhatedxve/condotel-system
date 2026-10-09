import { Link } from 'react-router-dom';
import { property } from './homeContent';

export default function HomeBrand() {
  return (
    <Link to="/" className="coast-brand" aria-label={`${property.name} home`}>
      <svg viewBox="0 0 56 52" fill="none" aria-hidden="true">
        <path
          d="M4 48Q28 38 52 48M12 44V22L21 18V42M21 42V10L29 5L36 9V43M29 5V42M36 15L44 19V44"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M29 5L36 9V43M44 19V44" stroke="#e9bd6b" strokeWidth="1.8" />
      </svg>
      <span>
        {property.brand}
        <small>CONDOTEL</small>
      </span>
    </Link>
  );
}
