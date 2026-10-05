import {
  useEffect,
  useState,
} from 'react';

import {
  getPayments,
} from '../../api/paymentApi';

import {
  formatCurrency,
} from '../../utils/formatCurrency';

import {
  formatDate,
} from '../../utils/formatDate';

import '../../styles/payments.css';

export default function PaymentsPage() {
  const [
    payments,
    setPayments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getPayments()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setPayments(
          Array.isArray(result)
            ? result
            : [],
        );
      })
      .catch(() => {
        if (!cancelled) {
          window.alert(
            'Unable to load payments.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="payments-page">
      <header className="payments-header">
        <div>
          <h1>Payments</h1>

          <p>
            View reservation payment
            transactions and statuses.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="payments-loading">
          Loading payments...
        </div>
      ) : payments.length === 0 ? (
        <div className="payments-empty">
          No payment records found.
        </div>
      ) : (
        <div className="payments-table-wrapper">
          <table className="payments-table">
            <thead>
              <tr>
                <th>
                  Reference No.
                </th>

                <th>Guest</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid At</th>
              </tr>
            </thead>

            <tbody>
              {payments.map(
                (payment) => {
                  const guest =
                    payment.reservation
                      ?.guest;

                  return (
                    <tr
                      key={
                        payment.id
                      }
                    >
                      <td>
                        {
                          payment
                            .reservation
                            ?.referenceNo ??
                          '—'
                        }
                      </td>

                      <td>
                        {guest
                          ? `${guest.firstName} ${guest.lastName}`
                          : '—'}
                      </td>

                      <td>
                        {
                          payment.method ??
                          '—'
                        }
                      </td>

                      <td>
                        {formatCurrency(
                          payment
                            .amountCentavos,
                        )}
                      </td>

                      <td>
                        <span
                          className={`payment-status ${payment.status.toLowerCase()}`}
                        >
                          {
                            payment.status
                          }
                        </span>
                      </td>

                      <td>
                        {payment.paidAt
                          ? formatDate(
                              payment.paidAt,
                            )
                          : '—'}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}