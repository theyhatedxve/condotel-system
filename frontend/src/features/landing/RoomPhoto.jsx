import { BedDouble } from 'lucide-react';
import { useState } from 'react';

export default function RoomPhoto({ room }) {
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
