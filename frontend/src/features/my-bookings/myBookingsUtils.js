export function isCurrentBooking(booking) {
  return ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(booking.status);
}

export function paymentLabel(booking) {
  const payments = booking.payments || [];
  const paid = payments
    .filter((payment) => payment.status === 'PAID')
    .reduce((total, payment) => total + payment.amountCentavos, 0);
  if (paid > 0 && paid >= booking.totalAmountCentavos) return 'Paid';
  if (paid > 0) return 'Partially paid';
  if (payments.some((payment) => payment.status === 'REFUNDED'))
    return 'Refunded';
  if (payments.some((payment) => payment.status === 'PENDING'))
    return 'Awaiting payment';
  return 'Unpaid';
}

export function checkoutPath(booking) {
  return `/booking/${encodeURIComponent(booking.roomId)}/payment?${new URLSearchParams({ reservationId: booking.id })}`;
}
