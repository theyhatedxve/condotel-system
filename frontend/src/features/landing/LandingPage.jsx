import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  ChevronRight,
  CreditCard,
  LayoutGrid,
  List,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import HomeBrand from '../home/HomeBrand';
import { featuredRooms } from '../home/homeContent';
import StaySearch from './StaySearch';
import RoomFilters from './RoomFilters';
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
  const [layout, setLayout] = useState('grid');
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
        <div className="stay-container stay-header-inner">
          <HomeBrand />
          <nav aria-label="Main navigation">
            <Link to="/">Home</Link>
            <Link to="/rooms" aria-current="page">
              Rooms
            </Link>
            <Link to="/#amenities">Amenities</Link>
            <Link to="/#location">Location</Link>
            <a href="#about">About</a>
          </nav>
          <div className="stay-header-actions">
            <button
              type="button"
              className="stay-search-link"
              aria-label="Edit room search"
              onClick={editSearch}
            >
              <Search size={21} />
            </button>
            <button type="button" className="stay-book" onClick={editSearch}>
              Book Now <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section
          className="stay-hero"
          id="home"
          aria-labelledby="stay-heading"
          style={{ '--stay-hero-room': `url("${featuredRooms[0].imageUrl}")` }}
        >
          <div className="stay-container stay-hero-content">
            <nav className="stay-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <ChevronRight size={15} />
              <span aria-current="page">Rooms</span>
            </nav>
            <h1 id="stay-heading">Discover Our Rooms</h1>
            <p className="stay-hero-subtitle">
              Choose the perfect stay for your coastal escape. Modern comfort,
              <br className="stay-desktop-break" /> thoughtful spaces, and a
              place to make your own.
            </p>
          </div>
        </section>

        <div className="stay-container stay-search-wrap">
          <StaySearch
            roomTypes={roomTypes}
            roomType={roomType}
            onRoomTypeChange={setRoomType}
            onSearch={setSearch}
          />
        </div>

        <section
          className="stay-container stay-catalog"
          id="rooms"
          aria-label="Room listings"
        >
          <div className="stay-catalog-layout">
            <RoomFilters
              rooms={rooms}
              roomTypes={roomTypes}
              roomType={roomType}
              onRoomTypeChange={setRoomType}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              availableOnly={availableOnly}
              onAvailabilityChange={setAvailableOnly}
              dateSearch={Boolean(search)}
              onReset={clearFilters}
            >
              {search && (
                <div className="stay-search-summary">
                  <strong>Your stay</strong>
                  <p>
                    <CalendarDays size={15} />
                    {displayDate(search.checkIn)} –{' '}
                    {displayDate(search.checkOut)}
                  </p>
                  <p>
                    <Users size={15} />
                    {search.guests} guests · 1 room
                  </p>
                  <button
                    type="button"
                    className="stay-text-button"
                    onClick={editSearch}
                  >
                    Edit dates
                  </button>
                  <button
                    type="button"
                    className="stay-text-button"
                    onClick={() => {
                      setSearch(null);
                      clearFilters();
                    }}
                  >
                    Clear dates and browse all rooms
                  </button>
                </div>
              )}
            </RoomFilters>

            <div className="stay-results">
              <div className="stay-results-toolbar">
                <p className="stay-result-count" aria-live="polite">
                  {loading
                    ? 'Finding your next stay…'
                    : error
                      ? 'Rooms are temporarily unavailable'
                      : `Showing ${visibleRooms.length} of ${rooms.length} rooms`}
                </p>
                <div className="stay-results-controls">
                  <label className="stay-sort">
                    Sort by
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                    >
                      <option value="room-number">Room number</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                    </select>
                  </label>
                  <div
                    className="stay-layout-toggle"
                    role="group"
                    aria-label="Room display"
                  >
                    <button
                      type="button"
                      aria-label="Grid view"
                      aria-pressed={layout === 'grid'}
                      onClick={() => setLayout('grid')}
                    >
                      <LayoutGrid size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="List view"
                      aria-pressed={layout === 'list'}
                      onClick={() => setLayout('list')}
                    >
                      <List size={19} />
                    </button>
                  </div>
                </div>
              </div>
              {loading ? (
                <div
                  className="stay-room-grid"
                  aria-label="Loading rooms"
                  aria-busy="true"
                >
                  {[1, 2, 3, 4, 5, 6].map((item) => (
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
                  <h2>A short pause in your search</h2>
                  <p>{error}</p>
                  <button className="stay-button" onClick={retry}>
                    Try again
                  </button>
                </div>
              ) : visibleRooms.length === 0 ? (
                <div className="stay-empty">
                  <Search size={36} />
                  <h2>No rooms found</h2>
                  <p>
                    Try different dates or adjust your room and price filters.
                  </p>
                  <button className="stay-button" onClick={editSearch}>
                    Edit your search
                  </button>
                </div>
              ) : (
                <div
                  className={`stay-room-grid ${layout === 'list' ? 'stay-room-list' : ''}`}
                >
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

        <section
          className="stay-container stay-benefits"
          aria-label="Plan your stay"
        >
          <div>
            <CalendarDays />
            <span>
              <strong>Flexible Search</strong>
              <small>
                Find a room for your travel dates and number of guests.
              </small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <strong>Secure & Contactless</strong>
              <small>Modern stays with NFC access for a seamless visit.</small>
            </span>
          </div>
          <div>
            <CreditCard />
            <span>
              <strong>Cashless Payments</strong>
              <small>A more convenient way to pay for your stay.</small>
            </span>
          </div>
          <div>
            <BedDouble />
            <span>
              <strong>Your Perfect Space</strong>
              <small>Compare room details and find the right fit.</small>
            </span>
          </div>
        </section>
      </main>
      <footer className="stay-footer" id="about">
        <div className="stay-container">
          <HomeBrand />
          <p>Your space. Your pace. Your next coastal stay.</p>
          <Link to="/">
            Back to homepage <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
      {selectedRoom && (
        <RoomDetails
          room={selectedRoom}
          search={search}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
