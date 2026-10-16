import { BedDouble } from 'lucide-react';
import { useState } from 'react';

// Render the room image and use the existing fallback when the image is missing or
// fails.
export default function RoomPhoto({ room }) {
  // Track local state and read any session or route values needed by this component.
  const [failedUrl, setFailedUrl] = useState(null);
  return room.imageUrl && failedUrl !== room.imageUrl ? (
    <img
      src={room.imageUrl}
      alt={room.name}
      loading="lazy"
      onError={() => setFailedUrl(room.imageUrl)}
    />
  ) : (
    <div className="stay-photo-placeholder">
      <BedDouble size={42} strokeWidth={1} />
      <span>Room {room.roomNumber}</span>
    </div>
  );
}
