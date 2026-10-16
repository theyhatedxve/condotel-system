import { useEffect, useState } from 'react';
import { getPublicRooms } from './landingApi';

// Load room results for the current search and discard stale requests on search changes.
export default function usePublicRooms(search) {
  // Track local state and read any session or route values needed by this component.
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([search, attempt]);
  const [result, setResult] = useState({ key: null, rooms: [], error: '' });

  // Load rooms for the current search and abort the previous request when the search
  // changes.
  useEffect(() => {
    const controller = new AbortController();
    getPublicRooms(search, controller.signal)
      .then((rooms) => {
        if (!controller.signal.aborted) setResult({ key, rooms, error: '' });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({
            key,
            rooms: [],
            error: 'We couldn’t load the rooms. Please try again in a moment.',
          });
        }
      });
    return () => controller.abort();
  }, [search, key]);

  const loading = result.key !== key;
  return {
    rooms: loading ? [] : result.rooms,
    error: loading ? '' : result.error,
    loading,
    retry: () => setAttempt((value) => value + 1),
  };
}
