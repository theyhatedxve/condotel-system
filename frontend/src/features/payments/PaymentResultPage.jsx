import {
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import {
  useEffect,
} from 'react';

import {
  cancelPendingCheckout,
} from './paymentApi';

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import './payment-result.css';

export default function PaymentResultPage() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const reservationId =
    searchParams.get(
      'reservationId',
    );

  // This URL controls presentation only; the verified backend webhook confirms payment.
  const success =
    location.pathname ===
    '/payment/success';

    useEffect(() => {
        if (
          success ||
          !reservationId
        ) {
          return;
        }

        cancelPendingCheckout(
          reservationId,
        ).catch(() => {
          // The result page should still load
          // even if checkout cancellation
          // synchronization fails.
        });
      }, [
        reservationId,
        success,
      ]);

  function handleReturn() {
    navigate(
      '/admin/reservations',
    );
  }

  return (
    <main className="payment-result-page">
      <div className="payment-result-card">
        <div
          className={
            success
              ? 'payment-result-icon success'
              : 'payment-result-icon cancelled'
          }
        >
          {success ? (
            <CheckCircle2
              size={54}
            />
          ) : (
            <XCircle
              size={54}
            />
          )}
        </div>

        <h1>
          {success
            ? 'Payment Submitted'
            : 'Payment Cancelled'}
        </h1>

        <p>
          {success
            ? 'Your payment was received by PayMongo. The reservation will be confirmed after the payment webhook is verified.'
            : 'The payment was not completed. Your reservation remains pending.'}
        </p>

        {reservationId && (
          <div className="payment-result-reference">
            Reservation ID:
            <strong>
              {' '}
              {reservationId}
            </strong>
          </div>
        )}

        <button
          type="button"
          onClick={
            handleReturn
          }
        >
          Back to Reservations
        </button>
      </div>
    </main>
  );
}