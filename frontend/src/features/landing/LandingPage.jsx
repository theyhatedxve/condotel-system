import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownUp,
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import StaySearch from './StaySearch';
import PublicRoomCard from './PublicRoomCard';
import RoomDetails from './RoomDetails';
import usePublicRooms from './usePublicRooms';
import './landing.css';

function displayDate(value) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export default function LandingPage() {
  const [search, setSearch] = useState(null);
  const [roomType, setRoomType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [sort, setSort] = useState('room-number');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const { rooms, loading, error, retry } = usePublicRooms(search);
  const roomTypes = [...new Set(rooms.map((room) => room.roomType))].sort();
  const visibleRooms = rooms
    .filter(
      (room) =>
        (!roomType || room.roomType === roomType) &&
        (!maxPrice || room.ratePerNightCentavos <= Number(maxPrice)) &&
        (!availableOnly || search || room.status === 'AVAILABLE'),
    )
    .sort((a, b) => {
      if (sort === 'price-low')
        return a.ratePerNightCentavos - b.ratePerNightCentavos;
      if (sort === 'price-high')
        return b.ratePerNightCentavos - a.ratePerNightCentavos;
      return a.roomNumber.localeCompare(b.roomNumber, undefined, {
        numeric: true,
      });
    });

  function clearFilters() {
    setRoomType('');
    setMaxPrice('');
    setAvailableOnly(true);
    setSort('room-number');
  }

  function editSearch() {
    document.getElementById('stay-check-in')?.focus();
    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="stay-page">
      <a className="stay-skip" href="#rooms">
        Skip to rooms
      </a>
      <header className="stay-header">
        <Link to="/" className="stay-brand" aria-label="Condotel home">
          <Building2 size={46} strokeWidth={1.3} />
          <span>
            CONDOTEL<small>MODERN LIVING, SMARTER ACCESS.</small>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#rooms">Rooms</a>
          <a href="#experience">Experience</a>
          <a href="#about">About</a>
        </nav>
        <div className="stay-header-actions">
          <a
            href="#rooms"
            className="stay-search-link"
            aria-label="Browse rooms"
          >
            <Search size={21} />
          </a>
          <Link to="/login" className="stay-sign-in">
            Sign In
          </Link>
          <Link to="/login" className="stay-book">
            Book Now
          </Link>
        </div>
      </header>

      <main>
        <section className="stay-hero" id="home" aria-labelledby="stay-heading">
          <div className="stay-hero-content">
            <p className="stay-eyebrow">PREMIUM CONDOTEL STAYS</p>
            <h1 id="stay-heading">Find Your Perfect Stay</h1>
            <p className="stay-hero-subtitle">
              Modern rooms. A little more comfort. A place to make your own.
            </p>
            <StaySearch
              onSearch={(criteria) => {
                setRoomType('');
                setSearch(criteria);
              }}
            />
          </div>
          <aside
            className="stay-highlights"
            aria-label="The Condotel experience"
          >
            <div>
              <MapPin />
              <span>
                <strong>Your next destination</strong>
                <small>A fresh setting for your stay</small>
              </span>
            </div>
            <div>
              <BedDouble />
              <span>
                <strong>Room to unwind</strong>
                <small>Find a space that suits you</small>
              </span>
            </div>
            <div>
              <ShieldCheck />
              <span>
                <strong>A seamless start</strong>
                <small>Explore rooms, then sign in</small>
              </span>
            </div>
          </aside>
        </section>

        <section
          className="stay-catalog"
          id="rooms"
          aria-labelledby="stay-rooms-title"
        >
          <div className="stay-catalog-heading">
            <div>
              <p className="stay-eyebrow">
                {search ? 'AVAILABLE FOR YOUR DATES' : 'EXPLORE OUR ROOMS'}
              </p>
              <h2 id="stay-rooms-title">Choose Your Room</h2>
              <p>Find the right space for a stay that feels like you.</p>
            </div>
            <label className="stay-sort">
              <ArrowDownUp size={18} />
              <span>
                Sort by
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="room-number">Room number</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </span>
            </label>
          </div>
          <div className="stay-catalog-layout">
            <aside
              className="stay-sidebar"
              aria-label="Search summary and availability"
            >
              <div className="stay-sidebar-title">
                <MapPin size={18} />
                <strong>Your Search</strong>
                <button onClick={editSearch}>Edit</button>
              </div>
              <div className="stay-search-summary">
                <p>
                  <CalendarDays size={17} />
                  <span>
                    {search ? displayDate(search.checkIn) : 'Choose your dates'}
                  </span>
                </p>
                {search && (
                  <>
                    <p>
                      <CalendarDays size={17} />
                      <span>{displayDate(search.checkOut)}</span>
                    </p>
                    <p>
                      <Users size={17} />
                      <span>{search.guests} guests · 1 room</span>
                    </p>
                  </>
                )}
              </div>
              <label className="stay-availability">
                <span>
                  <strong>Available rooms</strong>
                  <small>
                    {search
                      ? 'Matched to your travel dates'
                      : 'Show currently available rooms'}
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={availableOnly || Boolean(search)}
                  disabled={Boolean(search)}
                  onChange={(event) => setAvailableOnly(event.target.checked)}
                />
              </label>
              <div className="stay-sidebar-note">
                <ShieldCheck size={22} />
                <p>Your next stay starts here.</p>
                <span>
                  Browse the rooms and sign in when you’re ready to continue.
                </span>
              </div>
              {search && (
                <button
                  className="stay-text-button"
                  onClick={() => {
                    setSearch(null);
                    clearFilters();
                  }}
                >
                  Clear dates and browse all rooms
                </button>
              )}
            </aside>
            <div className="stay-results">
              <div className="stay-filter-bar">
                <label>
                  <BedDouble size={20} />
                  <span>
                    Room type
                    <select
                      value={roomType}
                      onChange={(event) => setRoomType(event.target.value)}
                    >
                      <option value="">All types</option>
                      {roomTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
                <label>
                  <SlidersHorizontal size={19} />
                  <span>
                    Price per night
                    <select
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value)}
                    >
                      <option value="">Any price</option>
                      <option value="250000">Up to ₱2,500</option>
                      <option value="500000">Up to ₱5,000</option>
                      <option value="1000000">Up to ₱10,000</option>
                    </select>
                  </span>
                </label>
                <button className="stay-text-button" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
              <p className="stay-result-count" aria-live="polite">
                {loading
                  ? 'Finding your next stay…'
                  : error
                    ? 'Rooms are temporarily unavailable'
                    : `Showing ${visibleRooms.length} of ${rooms.length} rooms`}
              </p>
              {loading ? (
                <div
                  className="stay-room-grid"
                  aria-label="Loading rooms"
                  aria-busy="true"
                >
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="stay-skeleton">
                      <div />
                      <span />
                      <span />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="stay-empty" role="alert">
                  <BedDouble size={36} />
                  <h3>A short pause in your search</h3>
                  <p>{error}</p>
                  <button className="stay-button" onClick={retry}>
                    Try again
                  </button>
                </div>
              ) : visibleRooms.length === 0 ? (
                <div className="stay-empty">
                  <Search size={36} />
                  <h3>No rooms found</h3>
                  <p>
                    Try different dates or adjust your room and price filters.
                  </p>
                  <button className="stay-button" onClick={editSearch}>
                    Edit your search
                  </button>
                </div>
              ) : (
                <div className="stay-room-grid">
                  {visibleRooms.map((room) => (
                    <PublicRoomCard
                      key={room.id}
                      room={room}
                      dateSearch={Boolean(search)}
                      onDetails={setSelectedRoom}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="stay-experience" id="experience">
          <div>
            <p className="stay-eyebrow">MAKE YOURSELF AT HOME</p>
            <h2>A stay that fits your plans.</h2>
          </div>
          <p>
            A quick city break or a little extra time away. Explore room
            options, compare nightly rates, and find the space that works for
            you.
          </p>
          <a href="#rooms">
            Explore rooms <ArrowRight size={18} />
          </a>
        </section>
      </main>
      <footer className="stay-footer" id="about">
        <div className="stay-brand">
          <Building2 size={30} strokeWidth={1.3} />
          <span>
            CONDOTEL<small>MODERN LIVING, SMARTER ACCESS.</small>
          </span>
        </div>
        <p>Your space. Your pace. Your next stay.</p>
        <Link to="/login">
          Sign in <ArrowRight size={16} />
        </Link>
      </footer>
      {selectedRoom && (
        <RoomDetails
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
