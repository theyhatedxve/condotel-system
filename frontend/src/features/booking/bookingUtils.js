export function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function nightsBetween(checkIn, checkOut) {
  // Date-only values are UTC midnight so daylight-saving changes cannot add a night.
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000;
  return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

export function displayDate(value) {
  if (!value) return 'Select a date';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function requestMessage(error, fallback) {
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join(' ') : message || fallback;
}

export function initialStay(params, reservation, capacity) {
  const checkIn = reservation?.checkIn?.slice(0, 10) || params.get('checkIn');
  const checkOut =
    reservation?.checkOut?.slice(0, 10) || params.get('checkOut');
  const validDates =
    /^\d{4}-\d{2}-\d{2}$/.test(checkIn || '') &&
    /^\d{4}-\d{2}-\d{2}$/.test(checkOut || '') &&
    nightsBetween(checkIn, checkOut) > 0 &&
    checkIn >= localDate();
  const requestedGuests = Number(params.get('guests'));
  return {
    checkIn: reservation ? checkIn : validDates ? checkIn : localDate(),
    checkOut: reservation ? checkOut : validDates ? checkOut : localDate(1),
    adults: String(
      reservation?.adults ??
        (Number.isInteger(requestedGuests) &&
        requestedGuests > 0 &&
        requestedGuests <= capacity
          ? requestedGuests
          : Math.min(2, capacity)),
    ),
    children: String(reservation?.children ?? 0),
    specialRequests: reservation?.specialRequests || '',
  };
}
