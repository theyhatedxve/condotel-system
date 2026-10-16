import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import HomeBrand from './HomeBrand';
import HomeDialog from './HomeDialog';
import './home.css';
import './customer-header.css';

// Share navigation, account actions, and sizing across the customer pages.
export default function CustomerHeader({ onSearch }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { pathname } = useLocation();
  const [aboutOpen, setAboutOpen] = useState(false);
  const roomsActive = pathname === '/rooms' || pathname.startsWith('/booking/');
  function handleSearch(event) {
    if (onSearch) {
      event.preventDefault();
      onSearch();
    }
  }
  return (
    <>
      <header className="customer-header">
        <div className="customer-header-inner">
          <HomeBrand />
          <nav className="customer-header-nav" aria-label="Main navigation">
            <Link to="/" aria-current={pathname === '/' ? 'page' : undefined}>
              Home
            </Link>
            <Link to="/rooms" aria-current={roomsActive ? 'page' : undefined}>
              Rooms
            </Link>
            {user?.role === 'CUSTOMER' && (
              <Link
                to="/my-bookings"
                aria-current={pathname === '/my-bookings' ? 'page' : undefined}
              >
                My Bookings
              </Link>
            )}
            <a href="/#amenities">Amenities</a>
            <a href="/#location">Location</a>
            <button type="button" onClick={() => setAboutOpen(true)}>
              About
            </button>
          </nav>
          <div className="customer-header-actions">
            <Link
              to="/rooms"
              className="customer-header-search"
              aria-label="Search rooms"
              onClick={handleSearch}
            >
              <Search size={21} />
            </Link>
            {!isLoading &&
              (isAuthenticated ? (
                <>
                  <Link
                    aria-current={
                      pathname === '/profile' || pathname === '/admin/profile'
                        ? 'page'
                        : undefined
                    }
                    to={
                      user?.role === 'CUSTOMER' ? '/profile' : '/admin/profile'
                    }
                  >
                    My Account
                  </Link>
                  <button type="button" onClick={logout}>
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login">Sign In</Link>
              ))}
            <Link
              to="/rooms"
              className="customer-header-book"
              onClick={handleSearch}
            >
              Book Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>
      {aboutOpen && (
        <HomeDialog
          selection={{ type: 'about' }}
          onClose={() => setAboutOpen(false)}
        />
      )}
    </>
  );
}
