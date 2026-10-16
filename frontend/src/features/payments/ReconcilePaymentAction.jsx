import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import apiClient from '../../services/apiClient';
// Let an administrator verify a provider session for an unresolved pending payment.
export default function ReconcilePaymentAction({ payment, onSaved }) {
  // Track local state and read any session or route values needed by this component.
  const { user } = useAuth();
  const [session, setSession] = useState(
    payment.paymongoCheckoutSessionId || '',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (user?.role !== 'ADMIN' || payment.status !== 'PENDING') return null;
  // Submit the checkout session ID for server-side reconciliation and refresh the
  // payment display.
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
