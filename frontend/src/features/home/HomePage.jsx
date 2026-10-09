import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  CreditCard,
  Dumbbell,
  KeyRound,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Waves,
  Wifi,
} from 'lucide-react';
import HomeBrand from './HomeBrand';
import HomeHero from './HomeHero';
import HomeDialog from './HomeDialog';
import FeaturedRooms from './FeaturedRooms';
import LocationSection from './LocationSection';
import { property } from './homeContent';
import { useAuth } from '../auth/useAuth';
import './home.css';

const benefits = [
  {
    icon: BedDouble,
    title: 'Modern Accommodations',
    description:
      'Stylish, comfortable rooms designed for short or extended stays.',
  },
  {
    icon: KeyRound,
    title: 'Smart & Convenient Access',
    description:
      'Hassle-free check-in with secure NFC access for a seamless stay.',
  },
  {
    icon: CreditCard,
    title: 'Secure & Cashless Payments',
    description:
      'Book with confidence using our encrypted, cashless payment system.',
  },
];

const amenities = [
  { icon: Waves, title: 'Ocean View', description: 'Enjoy breathtaking views' },
  {
    icon: Wifi,
    title: 'High-Speed Wi-Fi',
    description: 'Stay connected always',
  },
  { icon: Waves, title: 'Swimming Pool', description: 'Relax and unwind' },
  {
    icon: Dumbbell,
    title: 'Fitness Center',
    description: 'Keep up with your routine',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Access',
    description: 'NFC entry for peace of mind',
  },
  {
    icon: CreditCard,
    title: 'Cashless Payments',
    description: 'Safe, easy, and encrypted',
  },
];

export default function HomePage() {
  const [dialog, setDialog] = useState(null);
  const { isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${property.name} | Your Coastal Stay Awaits`;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="coast-page">
      <a className="coast-skip" href="#coast-main">
        Skip to main content
      </a>
      <header className="coast-header">
        <div className="coast-container coast-header-inner">
          <HomeBrand />
          <nav aria-label="Main navigation">
            <Link to="/" aria-current="page">
              Home
            </Link>
            <Link to="/rooms">Rooms</Link>
            <a href="#amenities">Amenities</a>
            <a href="#location">Location</a>
            <button type="button" onClick={() => setDialog({ type: 'about' })}>
              About
            </button>
          </nav>
          <div className="coast-header-actions">
            <Link
              to="/rooms"
              className="coast-search-link"
              aria-label="Search rooms"
            >
              <Search size={21} />
            </Link>
            {!isLoading &&
              (isAuthenticated ? (
                <button
                  type="button"
                  className="coast-sign-in coast-sign-out"
                  onClick={logout}
                >
                  Sign Out
                </button>
              ) : (
                <Link to="/rooms" className="coast-sign-in">
                  Sign In
                </Link>
              ))}
            <Link to="/rooms" className="coast-button coast-button-gold">
              Book Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main id="coast-main">
        <HomeHero onGallery={() => setDialog({ type: 'gallery' })} />
        <section className="coast-benefits" aria-label="Why stay with us">
          <div className="coast-container coast-benefit-grid">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article key={title}>
                <span className="coast-benefit-icon">
                  <Icon size={29} strokeWidth={1.7} />
                </span>
                <div>
                  <h2>{title}</h2>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <LocationSection />
        <FeaturedRooms onSelect={(room) => setDialog({ type: 'room', room })} />
        <section
          className="coast-amenities"
          id="amenities"
          aria-label="Amenities"
        >
          <div className="coast-container">
            {amenities.map(({ icon: Icon, title, description }) => (
              <div className="coast-amenity" key={title}>
                <Icon size={30} strokeWidth={1.6} />
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="coast-footer">
        <div className="coast-container">
          <div className="coast-footer-top">
            <HomeBrand />
            <nav aria-label="Footer navigation">
              <Link to="/">Home</Link>
              <Link to="/rooms">Rooms</Link>
              <a href="#amenities">Amenities</a>
              <a href="#location">Location</a>
              <button
                type="button"
                onClick={() => setDialog({ type: 'about' })}
              >
                About
              </button>
            </nav>
            <div className="coast-contact">
              <span>
                <Phone size={15} />
                {property.phone}
              </span>
              <span>
                <Mail size={17} />
                {property.email}
              </span>
            </div>
          </div>
          <div className="coast-footer-bottom">
            <p>
              © {new Date().getFullYear()} {property.name}. All rights reserved.
            </p>
            <p>Sample property details · Made for your next escape</p>
          </div>
        </div>
      </footer>
      {dialog && (
        <HomeDialog selection={dialog} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
