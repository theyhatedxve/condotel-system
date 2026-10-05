import {
  useEffect,
  useState,
} from 'react';

import {
  Eye,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from 'lucide-react';

import {
  getTransactions,
} from '../../api/transactionApi';

import {
  formatCurrency,
} from '../../utils/formatCurrency';

import '../../styles/transactions.css';

const statusOptions = [
  {
    label: 'All Statuses',
    value: '',
  },
  {
    label: 'Succeeded',
    value: 'SUCCEEDED',
  },
  {
    label: 'Pending',
    value: 'PENDING',
  },
  {
    label: 'Failed',
    value: 'FAILED',
  },
];

const typeOptions = [
  {
    label: 'All Types',
    value: '',
  },
  {
    label: 'Payment',
    value: 'PAYMENT',
  },
  {
    label: 'Refund',
    value: 'REFUND',
  },
  {
    label: 'Adjustment',
    value: 'ADJUSTMENT',
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

export default function TransactionsPage() {
  const [
    transactions,
    setTransactions,
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
    typeFilter,
    setTypeFilter,
  ] = useState('');

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getTransactions()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setTransactions(
          Array.isArray(result)
            ? result
            : [],
        );
      })
      .catch(() => {
        if (!cancelled) {
          window.alert(
            'Unable to load transactions.',
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

  async function refreshTransactions() {
    setLoading(true);

    try {
      const result =
        await getTransactions();

      setTransactions(
        Array.isArray(result)
          ? result
          : [],
      );
    } catch {
      window.alert(
        'Unable to refresh transactions.',
      );
    } finally {
      setLoading(false);
    }
  }

  const successfulTransactions =
    transactions.filter(
      (transaction) =>
        transaction.status ===
        'SUCCEEDED',
    );

  const failedTransactions =
    transactions.filter(
      (transaction) =>
        transaction.status ===
        'FAILED',
    );

  const refundTransactions =
    transactions.filter(
      (transaction) =>
        transaction.type ===
        'REFUND',
    );

  const successfulPaymentAmount =
    successfulTransactions
      .filter(
        (transaction) =>
          transaction.type ===
          'PAYMENT',
      )
      .reduce(
        (
          total,
          transaction,
        ) =>
          total +
          Number(
            transaction
              .amountCentavos ||
              0,
          ),
        0,
      );

  const normalizedSearch =
    searchQuery
      .trim()
      .toLowerCase();

  const filteredTransactions =
    transactions.filter(
      (transaction) => {
        const payment =
          transaction.payment;

        const reservation =
          payment?.reservation;

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
            transaction.id,
            transaction.type,
            transaction.status,
            transaction
              .providerReference,
            transaction
              .description,
            payment?.id,
            payment?.method,
            payment?.status,
            payment
              ?.paymongoPaymentId,
            reservation
              ?.referenceNo,
            guestName,
            guest?.email,
            room?.roomNumber,
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
          transaction.status ===
            statusFilter;

        const matchesType =
          !typeFilter ||
          transaction.type ===
            typeFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesType
        );
      },
    );

  return (
    <section className="transactions-page">
      <header className="transactions-header">
        <div>
          <h1>
            Transactions
          </h1>

          <p>
            Review payment transactions,
            refunds, and financial activity.
          </p>
        </div>

        <button
          type="button"
          className="transactions-refresh-button"
          onClick={
            refreshTransactions
          }
          disabled={loading}
        >
          <RefreshCw
            size={16}
          />

          Refresh
        </button>
      </header>

      <div className="transaction-summary-grid">
        <article className="transaction-summary-card">
          <div className="transaction-summary-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Total Transactions
            </span>

            <strong>
              {
                transactions.length
              }
            </strong>
          </div>
        </article>

        <article className="transaction-summary-card">
          <div className="transaction-summary-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Successful Volume
            </span>

            <strong>
              {formatCurrency(
                successfulPaymentAmount,
              )}
            </strong>
          </div>
        </article>

        <article className="transaction-summary-card">
          <div className="transaction-summary-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Failed
            </span>

            <strong>
              {
                failedTransactions.length
              }
            </strong>
          </div>
        </article>

        <article className="transaction-summary-card">
          <div className="transaction-summary-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Refunds
            </span>

            <strong>
              {
                refundTransactions.length
              }
            </strong>
          </div>
        </article>
      </div>

      <div className="transactions-toolbar">
        <div className="transactions-search">
          <Search
            size={17}
          />

          <input
            type="search"
            value={
              searchQuery
            }
            placeholder="Search transaction, reference, guest, room, or provider ID..."
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
                  'all-statuses'
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
            typeFilter
          }
          onChange={(
            event,
          ) =>
            setTypeFilter(
              event.target.value,
            )
          }
        >
          {typeOptions.map(
            (option) => (
              <option
                key={
                  option.value ||
                  'all-types'
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
        <div className="transactions-loading">
          Loading transactions...
        </div>
      ) : transactions.length ===
        0 ? (
        <div className="transactions-empty">
          No transaction records found.
        </div>
      ) : filteredTransactions
          .length === 0 ? (
        <div className="transactions-empty">
          No transactions match your
          current filters.
        </div>
      ) : (
        <div className="transactions-table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>
                  Reservation
                </th>

                <th>Guest</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Occurred At</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map(
                (transaction) => {
                  const payment =
                    transaction.payment;

                  const reservation =
                    payment
                      ?.reservation;

                  const guest =
                    reservation
                      ?.guest;

                  return (
                    <tr
                      key={
                        transaction.id
                      }
                    >
                      <td>
                        <strong className="transaction-reference">
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
                        <span className="transaction-type">
                          {
                            transaction.type
                          }
                        </span>
                      </td>

                      <td>
                        {formatMethod(
                          payment
                            ?.method,
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          transaction
                            .amountCentavos,
                        )}
                      </td>

                      <td>
                        <span
                          className={`transaction-status ${transaction.status.toLowerCase()}`}
                        >
                          {
                            transaction.status
                          }
                        </span>
                      </td>

                      <td>
                        {formatDateTime(
                          transaction
                            .occurredAt,
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="transaction-view-button"
                          onClick={() =>
                            setSelectedTransaction(
                              transaction,
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

      {selectedTransaction && (
        <div className="transaction-modal-backdrop">
          <div className="transaction-details-modal">
            <header className="transaction-details-header">
              <div>
                <h2>
                  Transaction Details
                </h2>

                <p>
                  {
                    selectedTransaction
                      .payment
                      ?.reservation
                      ?.referenceNo ??
                    'No reservation reference'
                  }
                </p>
              </div>

              <button
                type="button"
                className="transaction-modal-close"
                aria-label="Close transaction details"
                onClick={() =>
                  setSelectedTransaction(
                    null,
                  )
                }
              >
                <X
                  size={20}
                />
              </button>
            </header>

            <div className="transaction-details-body">
              <div className="transaction-detail-row">
                <span>
                  Transaction Type
                </span>

                <strong>
                  {
                    selectedTransaction
                      .type
                  }
                </strong>
              </div>

              <div className="transaction-detail-row">
                <span>
                  Status
                </span>

                <strong>
                  <span
                    className={`transaction-status ${selectedTransaction.status.toLowerCase()}`}
                  >
                    {
                      selectedTransaction
                        .status
                    }
                  </span>
                </strong>
              </div>

              <div className="transaction-detail-row">
                <span>
                  Amount
                </span>

                <strong>
                  {formatCurrency(
                    selectedTransaction
                      .amountCentavos,
                  )}
                </strong>
              </div>

              <div className="transaction-detail-row">
                <span>
                  Guest
                </span>

                <strong>
                  {selectedTransaction
                    .payment
                    ?.reservation
                    ?.guest
                    ? `${selectedTransaction.payment.reservation.guest.firstName} ${selectedTransaction.payment.reservation.guest.lastName}`
                    : '—'}
                </strong>
              </div>

              <div className="transaction-detail-row">
                <span>
                  Room
                </span>

                <strong>
                  {selectedTransaction
                    .payment
                    ?.reservation
                    ?.room
                    ? `Room ${selectedTransaction.payment.reservation.room.roomNumber}`
                    : '—'}
                </strong>
              </div>

              <div className="transaction-detail-row">
                <span>
                  Payment Method
                </span>

                <strong>
                  {formatMethod(
                    selectedTransaction
                      .payment
                      ?.method,
                  )}
                </strong>
              </div>

              <div className="transaction-detail-row">
                <span>
                  Payment Status
                </span>

                <strong>
                  {
                    selectedTransaction
                      .payment
                      ?.status ??
                    '—'
                  }
                </strong>
              </div>

              <div className="transaction-detail-row">
                <span>
                  Occurred At
                </span>

                <strong>
                  {formatDateTime(
                    selectedTransaction
                      .occurredAt,
                  )}
                </strong>
              </div>

              <div className="transaction-details-divider" />

              <div className="transaction-id-block">
                <span>
                  Transaction ID
                </span>

                <code>
                  {
                    selectedTransaction
                      .id
                  }
                </code>
              </div>

              <div className="transaction-id-block">
                <span>
                  Payment ID
                </span>

                <code>
                  {
                    selectedTransaction
                      .paymentId
                  }
                </code>
              </div>

              <div className="transaction-id-block">
                <span>
                  Provider Reference
                </span>

                <code>
                  {
                    selectedTransaction
                      .providerReference ??
                    '—'
                  }
                </code>
              </div>

              <div className="transaction-detail-row">
                <span>
                  Description
                </span>

                <strong>
                  {
                    selectedTransaction
                      .description ??
                    '—'
                  }
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}