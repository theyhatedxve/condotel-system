import { useState } from 'react';
import apiClient from '../../services/apiClient';
import './reservation-notes.css';

export default function ReservationNotesEditor({ reservation, onSaved }) {
  const [notes, setNotes] = useState(reservation.specialRequests || '');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await apiClient.patch(
        `/reservations/${encodeURIComponent(reservation.id)}`,
        { specialRequests: notes || null },
      );
      await onSaved();
    } catch (failure) {
      const message =
        failure.response?.data?.message || 'Unable to update special requests.';
      setError(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setBusy(false);
    }
  }
  if (['CANCELLED', 'CHECKED_OUT'].includes(reservation.status)) return null;
  return (
    <details className="reservation-notes-editor">
      <summary>Edit Special Requests</summary>
      <div className="reservation-notes-fields">
        <label>
          Special Requests
          <textarea
            maxLength={1000}
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={busy}
          />
        </label>
        <small>Requests are subject to availability.</small>
        {error && <p role="alert">{error}</p>}
        <button type="button" disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save Requests'}
        </button>
      </div>
    </details>
  );
}
