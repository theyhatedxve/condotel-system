import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import apiClient from '../../services/apiClient';
export default function ReconcilePaymentAction({ payment, onSaved }) {
  const { user } = useAuth();
  const [session, setSession] = useState(
      payment.paymongoCheckoutSessionId || '',
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  if (user?.role !== 'ADMIN' || payment.status !== 'PENDING') return null;
  async function reconcile() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await apiClient.post(
        `/payments/${encodeURIComponent(payment.id)}/reconcile`,
        { checkoutSessionId: session.trim() },
      );
      await onSaved();
    } catch (failure) {
      const message =
        failure.response?.data?.message || 'Unable to verify this checkout.';
      setError(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="payment-id-block">
      <label>
        Verify PayMongo Checkout
        <input
          value={session}
          onChange={(event) => setSession(event.target.value)}
          placeholder="cs_…"
          disabled={busy}
        />
      </label>
      <button
        type="button"
        onClick={reconcile}
        disabled={busy || !session.trim()}
      >
        {busy ? 'Verifying…' : 'Reconcile Payment'}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
