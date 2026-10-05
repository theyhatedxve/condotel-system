import {
  useEffect,
  useState,
} from 'react';

import {
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from 'lucide-react';

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

const statusOptions = [
  {
    label: 'All Statuses',
    value: '',
  },
  {
    label: 'Paid',
    value: 'PAID',
  },
  {
    label: 'Pending',
    value: 'PENDING',
  },
  {
    label: 'Failed',
    value: 'FAILED',
  },
  {
    label: 'Cancelled',
    value: 'CANCELLED',
  },
  {
    label: 'Expired',
    value: 'EXPIRED',
  },
  {
    label: 'Refunded',
    value: 'REFUNDED',
  },
];

const methodOptions = [
  {
    label: 'All Methods',
    value: '',
  },
  {
    label: 'Card',
    value: 'CARD',
  },
  {
    label: 'GCash',
    value: 'GCASH',
  },
  {
    label: 'Maya',
    value: 'MAYA',
  },
  {
    label: 'Bank Transfer',
    value: 'BANK_TRANSFER',
  },
  {
    label: 'Other',
    value: 'OTHER',
  },
];

function formatDateTime(
  value,
) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-PH',
    {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
    },
  ).format(
    new Date(value),
  );
}

function formatMethod(
  method,
) {
  if (!method) {
    return '—';
  }

  if (
    method ===
    'BANK_TRANSFER'
  ) {
    return 'Bank Transfer';
  }

  return method;
}

export default function PaymentsPage() {
  const [
    payments,
    setPayments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('');

  const [
    methodFilter,
    setMethodFilter,
  ] = useState('');

  const [
    selectedPayment,
    setSelectedPayment,
  ] = useState(null);

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

  async function refreshPayments() {
    setLoading(true);

    try {
      const result =
        await getPayments();

      setPayments(
        Array.isArray(result)
          ? result
          : [],
      );
    } catch {
      window.alert(
        'Unable to refresh payments.',
      );
    } finally {
      setLoading(false);
    }
  }

  const paidPayments =
    payments.filter(
      (payment) =>
        payment.status ===
        'PAID',
    );

  const pendingPayments =
    payments.filter(
      (payment) =>
        payment.status ===
        'PENDING',
    );

  const failedPayments =
    payments.filter(
      (payment) =>
        [
          'FAILED',
          'CANCELLED',
          'EXPIRED',
        ].includes(
          payment.status,
        ),
    );

  const totalPaidAmount =
    paidPayments.reduce(
      (
        total,
        payment,
      ) =>
        total +
        Number(
          payment
            .amountCentavos ||
            0,
        ),
      0,
    );

  const normalizedSearch =
    searchQuery
      .trim()
      .toLowerCase();

  const filteredPayments =
    payments.filter(
      (payment) => {
        const reservation =
          payment.reservation;

        const guest =
          reservation?.guest;

        const room =
          reservation?.room;

        const guestName =
          guest
            ? `${guest.firstName} ${guest.lastName}`
            : '';

        const searchableText =
          [
            reservation
              ?.referenceNo,
            guestName,
            guest?.email,
            room?.roomNumber,
            payment.provider,
            payment.method,
            payment.status,
            payment
              .paymongoCheckoutSessionId,
            payment
              .paymongoPaymentIntentId,
            payment
              .paymongoPaymentId,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          searchableText.includes(
            normalizedSearch,
          );

        const matchesStatus =
          !statusFilter ||
          payment.status ===
            statusFilter;

        const matchesMethod =
          !methodFilter ||
          payment.method ===
            methodFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesMethod
        );
      },
    );

  return (
    <section className="payments-page">
      <header className="payments-header">
        <div>
          <h1>Payments</h1>

          <p>
            Monitor PayMongo payments,
            reservation payments, and
            transaction statuses.
          </p>
        </div>

        <button
          type="button"
          className="payments-refresh-button"
          onClick={
            refreshPayments
          }
          disabled={loading}
        >
          <RefreshCw
            size={16}
          />

          Refresh
        </button>
      </header>

      <div className="payment-summary-grid">
        <article className="payment-summary-card">
          <div className="payment-summary-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Total Payments
            </span>

            <strong>
              {payments.length}
            </strong>
          </div>
        </article>

        <article className="payment-summary-card">
          <div className="payment-summary-icon">
            <CreditCard
              size={20}
            />
          </div>

          <div>
            <span>
              Paid Revenue
            </span>

            <strong>
              {formatCurrency(
                totalPaidAmount,
              )}
            </strong>
          </div>
        </article>

        <article className="payment-summary-card">
          <div className="payment-summary-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {
                pendingPayments.length
              }
            </strong>
          </div>
        </article>

        <article className="payment-summary-card">
          <div className="payment-summary-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Needs Attention
            </span>

            <strong>
              {
                failedPayments.length
              }
            </strong>
          </div>
        </article>
      </div>

      <div className="payments-toolbar">
        <div className="payments-search">
          <Search
            size={17}
          />

          <input
            type="search"
            value={
              searchQuery
            }
            placeholder="Search reference, guest, room, or PayMongo ID..."
            onChange={(
              event,
            ) =>
              setSearchQuery(
                event.target
                  .value,
              )
            }
          />
        </div>

        <select
          value={
            statusFilter
          }
          onChange={(
            event,
          ) =>
            setStatusFilter(
              event.target.value,
            )
          }
        >
          {statusOptions.map(
            (option) => (
              <option
                key={
                  option.value ||
                  'all'
                }
                value={
                  option.value
                }
              >
                {
                  option.label
                }
              </option>
            ),
          )}
        </select>

        <select
          value={
            methodFilter
          }
          onChange={(
            event,
          ) =>
            setMethodFilter(
              event.target.value,
            )
          }
        >
          {methodOptions.map(
            (option) => (
              <option
                key={
                  option.value ||
                  'all'
                }
                value={
                  option.value
                }
              >
                {
                  option.label
                }
              </option>
            ),
          )}
        </select>
      </div>

      {loading ? (
        <div className="payments-loading">
          Loading payments...
        </div>
      ) : payments.length ===
        0 ? (
        <div className="payments-empty">
          No payment records found.
        </div>
      ) : filteredPayments
          .length === 0 ? (
        <div className="payments-empty">
          No payments match your
          current filters.
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
                <th>Room</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid At</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.map(
                (payment) => {
                  const reservation =
                    payment.reservation;

                  const guest =
                    reservation
                      ?.guest;

                  const room =
                    reservation
                      ?.room;

                  return (
                    <tr
                      key={
                        payment.id
                      }
                    >
                      <td>
                        <strong className="payment-reference">
                          {
                            reservation
                              ?.referenceNo ??
                            '—'
                          }
                        </strong>
                      </td>

                      <td>
                        {guest
                          ? `${guest.firstName} ${guest.lastName}`
                          : '—'}
                      </td>

                      <td>
                        {room
                          ? `Room ${room.roomNumber}`
                          : '—'}
                      </td>

                      <td>
                        {formatMethod(
                          payment.method,
                        )}
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

                      <td>
                        <button
                          type="button"
                          className="payment-view-button"
                          onClick={() =>
                            setSelectedPayment(
                              payment,
                            )
                          }
                        >
                          <Eye
                            size={15}
                          />

                          View
                        </button>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedPayment && (
        <div className="payment-modal-backdrop">
          <div className="payment-details-modal">
            <header className="payment-details-header">
              <div>
                <h2>
                  Payment Details
                </h2>

                <p>
                  {
                    selectedPayment
                      .reservation
                      ?.referenceNo ??
                    'No reservation reference'
                  }
                </p>
              </div>

              <button
                type="button"
                className="payment-modal-close"
                aria-label="Close payment details"
                onClick={() =>
                  setSelectedPayment(
                    null,
                  )
                }
              >
                <X
                  size={20}
                />
              </button>
            </header>

            <div className="payment-details-body">
              <div className="payment-detail-row">
                <span>
                  Payment Status
                </span>

                <strong>
                  <span
                    className={`payment-status ${selectedPayment.status.toLowerCase()}`}
                  >
                    {
                      selectedPayment
                        .status
                    }
                  </span>
                </strong>
              </div>

              <div className="payment-detail-row">
                <span>
                  Guest
                </span>

                <strong>
                  {selectedPayment
                    .reservation
                    ?.guest
                    ? `${selectedPayment.reservation.guest.firstName} ${selectedPayment.reservation.guest.lastName}`
                    : '—'}
                </strong>
              </div>

              <div className="payment-detail-row">
                <span>
                  Guest Email
                </span>

                <strong>
                  {
                    selectedPayment
                      .reservation
                      ?.guest
                      ?.email ??
                    '—'
                  }
                </strong>
              </div>

              <div className="payment-detail-row">
                <span>
                  Room
                </span>

                <strong>
                  {selectedPayment
                    .reservation
                    ?.room
                    ? `Room ${selectedPayment.reservation.room.roomNumber}`
                    : '—'}
                </strong>
              </div>

              <div className="payment-detail-row">
                <span>
                  Amount
                </span>

                <strong>
                  {formatCurrency(
                    selectedPayment
                      .amountCentavos,
                  )}
                </strong>
              </div>

              <div className="payment-detail-row">
                <span>
                  Method
                </span>

                <strong>
                  {formatMethod(
                    selectedPayment
                      .method,
                  )}
                </strong>
              </div>

              <div className="payment-detail-row">
                <span>
                  Provider
                </span>

                <strong>
                  {
                    selectedPayment
                      .provider ??
                    '—'
                  }
                </strong>
              </div>

              <div className="payment-detail-row">
                <span>
                  Created At
                </span>

                <strong>
                  {formatDateTime(
                    selectedPayment
                      .createdAt,
                  )}
                </strong>
              </div>

              <div className="payment-detail-row">
                <span>
                  Paid At
                </span>

                <strong>
                  {formatDateTime(
                    selectedPayment
                      .paidAt,
                  )}
                </strong>
              </div>

              <div className="payment-details-divider" />

              <div className="payment-id-block">
                <span>
                  Checkout Session ID
                </span>

                <code>
                  {
                    selectedPayment
                      .paymongoCheckoutSessionId ??
                    '—'
                  }
                </code>
              </div>

              <div className="payment-id-block">
                <span>
                  Payment Intent ID
                </span>

                <code>
                  {
                    selectedPayment
                      .paymongoPaymentIntentId ??
                    '—'
                  }
                </code>
              </div>

              <div className="payment-id-block">
                <span>
                  PayMongo Payment ID
                </span>

                <code>
                  {
                    selectedPayment
                      .paymongoPaymentId ??
                    '—'
                  }
                </code>
              </div>

              <div className="payment-detail-row">
                <span>
                  Transactions
                </span>

                <strong>
                  {
                    selectedPayment
                      .transactions
                      ?.length ??
                    0
                  }
                </strong>
              </div>

              {selectedPayment
                .failureReason && (
                <div className="payment-failure-box">
                  <strong>
                    Failure Reason
                  </strong>

                  <p>
                    {
                      selectedPayment
                        .failureReason
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}