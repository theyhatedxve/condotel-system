import { CalendarDays, Search, Users } from 'lucide-react';
import { useState } from 'react';

function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export default function StaySearch({ onSearch }) {
  const [checkIn, setCheckIn] = useState(() => localDate());
  const [checkOut, setCheckOut] = useState(() => localDate(1));
  const [guests, setGuests] = useState('2');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (checkIn < localDate() || checkOut <= checkIn) {
      setError('Choose a check-in date from today and a later check-out date.');
      return;
    }
    setError('');
    onSearch({ checkIn, checkOut, guests: Number(guests) });
    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <form
      className="stay-search"
      onSubmit={submit}
      aria-label="Find available rooms"
    >
      <label>
        <CalendarDays size={22} />
        <span>
          Check-in
          <input
            id="stay-check-in"
            type="date"
            min={localDate()}
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
            required
          />
        </span>
      </label>
      <label>
        <CalendarDays size={22} />
        <span>
          Check-out
          <input
            type="date"
            min={checkIn || localDate()}
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            required
          />
        </span>
      </label>
      <label>
        <Users size={22} />
        <span>
          Guests
          <select
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
          >
            {[1, 2, 3, 4, 5, 6, 8].map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? 'Guest' : 'Guests'}
              </option>
            ))}
          </select>
        </span>
      </label>
      <button className="stay-button" type="submit">
        <Search size={20} />
        Search Rooms
      </button>
      {error && (
        <p className="stay-search-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
