import { formatCurrency } from '../../utils/formatCurrency';

export default function RoomFilters({
  rooms,
  roomTypes,
  roomType,
  onRoomTypeChange,
  maxPrice,
  onMaxPriceChange,
  availableOnly,
  onAvailabilityChange,
  dateSearch,
  onReset,
  children,
}) {
  const priceCeiling = Math.max(
    1000000,
    ...rooms.map((room) => room.ratePerNightCentavos),
  );
  return (
    <aside className="stay-sidebar" aria-label="Filter rooms">
      <div className="stay-sidebar-title">
        <h2>Filter Rooms</h2>
        <button type="button" className="stay-text-button" onClick={onReset}>
          Reset All
        </button>
      </div>
      <details className="stay-filter-section" open>
        <summary>
          Price Range <span>(per night)</span>
        </summary>
        <label className="stay-price-control">
          <span>
            Maximum price{' '}
            <strong>
              {maxPrice ? formatCurrency(Number(maxPrice)) : 'Any price'}
            </strong>
          </span>
          <input
            type="range"
            aria-label="Maximum price per night"
            min="0"
            max={priceCeiling}
            step="1"
            value={maxPrice || priceCeiling}
            onChange={(event) =>
              onMaxPriceChange(
                Number(event.target.value) === priceCeiling
                  ? ''
                  : event.target.value,
              )
            }
          />
        </label>
        <div className="stay-price-labels">
          <span>{formatCurrency(0)}</span>
          <span>{formatCurrency(priceCeiling)}+</span>
        </div>
        <label className="stay-price-preset">
          Price limit
          <select
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
          >
            <option value="">Any price</option>
            <option value="250000">Up to ₱2,500</option>
            <option value="500000">Up to ₱5,000</option>
            <option value="1000000">Up to ₱10,000</option>
            {maxPrice &&
              !['250000', '500000', '1000000'].includes(maxPrice) && (
                <option value={maxPrice}>
                  {formatCurrency(Number(maxPrice))}
                </option>
              )}
          </select>
        </label>
      </details>
      <details className="stay-filter-section" open>
        <summary>Room Type</summary>
        <div className="stay-type-options">
          <label>
            <input
              type="checkbox"
              checked={!roomType}
              onChange={() => onRoomTypeChange('')}
            />
            <span>All Types</span>
            <small>{rooms.length}</small>
          </label>
          {roomTypes.map((type) => (
            <label key={type}>
              <input
                type="checkbox"
                checked={roomType === type}
                onChange={() => onRoomTypeChange(roomType === type ? '' : type)}
              />
              <span>{type}</span>
              <small>
                {rooms.filter((room) => room.roomType === type).length}
              </small>
            </label>
          ))}
        </div>
      </details>
      <label className="stay-availability">
        <span>
          <strong>Availability</strong>
          <small>
            {dateSearch
              ? 'Matched to your travel dates'
              : 'Show only available rooms'}
          </small>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={availableOnly || dateSearch}
          disabled={dateSearch}
          onChange={(event) => onAvailabilityChange(event.target.checked)}
        />
      </label>
      {children}
    </aside>
  );
}
