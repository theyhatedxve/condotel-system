export function percentOf(value, total) {
  return total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
}

export function occupancyMessage(occupancy) {
  const { totalRooms, availableRooms, occupiedRooms, maintenanceRooms } =
    occupancy;
  if (totalRooms === 0)
    return [
      'No rooms configured yet',
      'Add your rooms to start tracking availability.',
    ];
  if (
    availableRooms === totalRooms &&
    occupiedRooms === 0 &&
    maintenanceRooms === 0
  )
    return [
      'All rooms currently available',
      'No occupied rooms at the moment.',
    ];
  if (occupiedRooms > 0)
    return [
      `${occupiedRooms} room${occupiedRooms === 1 ? '' : 's'} currently occupied`,
      `${availableRooms} available · ${maintenanceRooms} under maintenance`,
    ];
  return [
    'Room availability at a glance',
    `${availableRooms} available · ${maintenanceRooms} under maintenance`,
  ];
}

export function reportDate(date) {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(date ? new Date(`${date}T12:00:00+08:00`) : new Date());
}
