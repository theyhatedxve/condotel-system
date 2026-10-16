import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import HomeBrand from '../home/HomeBrand';
import { featuredRooms } from '../home/homeContent';
import '../landing/landing.css';
import './booking.css';
import CustomerHeader from '../home/CustomerHeader';

// Wrap booking/payment content in the shared property header and navigation layout.
export default function BookingShell({
  title,
  description,
  bookingPath,
  payment = false,
  pageLabel,
  children,
}) {
  return (
    <div className={`stay-page booking-page ${payment ? 'checkout-page' : ''}`}>
      <a className="stay-skip" href="#booking-main">
        Skip to {payment ? 'payment' : 'booking'}
      </a>
      {/* Show this section's heading, context, and available actions. */}
      <CustomerHeader />
      {/* Group the related content and actions into a distinct page section. */}
      <section
        className="stay-hero booking-hero"
        style={{ '--stay-hero-room': `url("${featuredRooms[0].imageUrl}")` }}
        aria-labelledby="booking-title"
      >
        <div className="stay-container">
          {/* Provide the navigation links or page controls for this part of the interface. */}
          <nav className="stay-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <Link to="/rooms">Rooms</Link>
            <ChevronRight size={14} />
            {payment ? (
              <>
                <Link to={bookingPath}>Booking</Link>
                <ChevronRight size={14} />
                <span aria-current="page">Payment</span>
              </>
            ) : (
              <span aria-current="page">{pageLabel || 'Booking'}</span>
            )}
          </nav>
          <h1 id="booking-title">{title}</h1>
          <p className="stay-hero-subtitle">{description}</p>
        </div>
      </section>
      <main id="booking-main" className="stay-container booking-main">
        {children}
      </main>
      {/* Show the property footer links and contact information. */}
      <footer className="stay-footer">
        <div className="stay-container">
          <HomeBrand />
          <p>Your next coastal stay starts here.</p>
          <Link to="/rooms">
            Back to rooms <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
