import { useEffect, useState } from 'react';

import {
  BedDouble,
  CalendarDays,
  CreditCard,
  RefreshCw,
  WalletCards,
} from 'lucide-react';

import { getReportSummary } from './reportApi';

import { formatCurrency } from '../../utils/formatCurrency';

import './reports.css';

function getToday() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, '0');

  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonthStart() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}-01`;
}

export default function ReportsPage() {
  const [from, setFrom] = useState(getMonthStart);

  const [to, setTo] = useState(getToday);

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);

  // Load the initial date range once; subsequent date edits are applied by loadReport.
  useEffect(() => {
    let cancelled = false;

    getReportSummary({
      from,
      to,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setReport(result);
      })
      .catch(() => {
        if (!cancelled) {
          window.alert('Unable to load reports.');
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

  async function loadReport() {
    if (!from || !to) {
      window.alert('Select both report dates.');

      return;
    }

    if (from > to) {
      window.alert('Start date cannot be after end date.');

      return;
    }

    setLoading(true);

    try {
      const result = await getReportSummary({
        from,
        to,
      });

      setReport(result);
    } catch (error) {
      const message =
        error.response?.data?.message || 'Unable to load reports.';

      window.alert(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setLoading(false);
    }
  }

  const revenue = report?.revenue ?? {
    grossRevenueCentavos: 0,
    refundedCentavos: 0,
    adjustmentCentavos: 0,
    netRevenueCentavos: 0,
  };

  const reservations = report?.reservations ?? {
    total: 0,
    pending: 0,
    confirmed: 0,
    checkedIn: 0,
    checkedOut: 0,
    cancelled: 0,
  };

  const payments = report?.payments ?? {
    total: 0,
    paid: 0,
    pending: 0,
    failed: 0,
    cancelled: 0,
    expired: 0,
    refunded: 0,
  };

  const rooms = report?.rooms ?? {
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
    occupancyPercent: 0,
  };

  return (
    <section className="reports-page">
      <header className="reports-header">
        <div>
          <h1>Reports</h1>

          <p>Review financial, reservation, payment, and room statistics.</p>
        </div>
      </header>

      <div className="reports-filter-bar">
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>

        <button type="button" onClick={loadReport} disabled={loading}>
          <RefreshCw size={16} />
          Apply
        </button>
      </div>

      {loading ? (
        <div className="reports-loading">Loading report...</div>
      ) : (
        <>
          <div className="report-summary-grid">
            <article className="report-summary-card">
              <WalletCards size={21} />

              <div>
                <span>Gross Revenue</span>

                <strong>{formatCurrency(revenue.grossRevenueCentavos)}</strong>
              </div>
            </article>

            <article className="report-summary-card">
              <CreditCard size={21} />

              <div>
                <span>Net Revenue</span>

                <strong>{formatCurrency(revenue.netRevenueCentavos)}</strong>
              </div>
            </article>

            <article className="report-summary-card">
              <CalendarDays size={21} />

              <div>
                <span>Reservations</span>

                <strong>{reservations.total}</strong>
              </div>
            </article>

            <article className="report-summary-card">
              <BedDouble size={21} />

              <div>
                <span>Occupancy</span>

                <strong>{rooms.occupancyPercent}%</strong>
              </div>
            </article>
          </div>

          <div className="reports-grid">
            <article className="report-panel">
              <h2>Reservation Summary</h2>

              <div className="report-data-list">
                <span>
                  Total
                  <strong>{reservations.total}</strong>
                </span>

                <span>
                  Pending
                  <strong>{reservations.pending}</strong>
                </span>

                <span>
                  Confirmed
                  <strong>{reservations.confirmed}</strong>
                </span>

                <span>
                  Checked In
                  <strong>{reservations.checkedIn}</strong>
                </span>

                <span>
                  Checked Out
                  <strong>{reservations.checkedOut}</strong>
                </span>

                <span>
                  Cancelled
                  <strong>{reservations.cancelled}</strong>
                </span>
              </div>
            </article>

            <article className="report-panel">
              <h2>Payment Summary</h2>

              <div className="report-data-list">
                <span>
                  Total
                  <strong>{payments.total}</strong>
                </span>

                <span>
                  Paid
                  <strong>{payments.paid}</strong>
                </span>

                <span>
                  Pending
                  <strong>{payments.pending}</strong>
                </span>

                <span>
                  Failed
                  <strong>{payments.failed}</strong>
                </span>

                <span>
                  Cancelled
                  <strong>{payments.cancelled}</strong>
                </span>

                <span>
                  Refunded
                  <strong>{payments.refunded}</strong>
                </span>
              </div>
            </article>

            <article className="report-panel">
              <h2>Financial Summary</h2>

              <div className="report-data-list">
                <span>
                  Gross Revenue
                  <strong>
                    {formatCurrency(revenue.grossRevenueCentavos)}
                  </strong>
                </span>

                <span>
                  Refunds
                  <strong>{formatCurrency(revenue.refundedCentavos)}</strong>
                </span>

                <span>
                  Adjustments
                  <strong>{formatCurrency(revenue.adjustmentCentavos)}</strong>
                </span>

                <span>
                  Net Revenue
                  <strong>{formatCurrency(revenue.netRevenueCentavos)}</strong>
                </span>
              </div>
            </article>

            <article className="report-panel">
              <h2>Room Summary</h2>

              <div className="report-data-list">
                <span>
                  Total Rooms
                  <strong>{rooms.total}</strong>
                </span>

                <span>
                  Available
                  <strong>{rooms.available}</strong>
                </span>

                <span>
                  Occupied
                  <strong>{rooms.occupied}</strong>
                </span>

                <span>
                  Maintenance
                  <strong>{rooms.maintenance}</strong>
                </span>

                <span>
                  Occupancy
                  <strong>{rooms.occupancyPercent}%</strong>
                </span>
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
