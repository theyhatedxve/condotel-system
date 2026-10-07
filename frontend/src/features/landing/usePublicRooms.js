import { useEffect, useState } from 'react';
import { getPublicRooms } from './landingApi';

export default function usePublicRooms(search) {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([search, attempt]);
  const [result, setResult] = useState({ key: null, rooms: [], error: '' });

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
