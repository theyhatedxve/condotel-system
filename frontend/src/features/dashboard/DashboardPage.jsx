import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CreditCard,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import LoadingScreen from '../auth/LoadingScreen';
import { getDashboardReport } from '../reports/reportApi';
import { useAuth } from '../auth/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { occupancyMessage, percentOf, reportDate } from './dashboardUtils';
import './dashboard.css';

function formatStatus(status) {
  return status
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDashboardReport()
      .then((result) => {
        if (!cancelled) setDashboard(result);
      })
      .catch(() => {
        if (!cancelled)
          setError('We couldn’t load the dashboard. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    setError('');
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  if (loading)
    return (
      <section className="dashboard-page">
        <LoadingScreen
          inline
          title="Loading dashboard"
          description="Getting the latest NEXORA activity."
        />
      </section>
    );
  if (error)
    return (
      <section className="dashboard-page">
        <div className="dashboard-error" role="alert">
          <h1>Dashboard unavailable</h1>
          <p>{error}</p>
          <button type="button" onClick={retry}>
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </section>
    );

  const { statistics, recentReservations } = dashboard;
  const occupancy = {
    ...dashboard.occupancy,
    totalRooms: dashboard.occupancy.totalRooms ?? statistics.totalRooms,
  };
  const occupancyPercent = Math.min(
    100,
    Math.max(0, occupancy.occupancyPercent),
  );
  const [occupancyTitle, occupancyDetail] = occupancyMessage(occupancy);
  const cards = [
    {
      title: 'Total Rooms',
      value: statistics.totalRooms,
      detail: `${occupancy.availableRooms} available`,
      icon: BedDouble,
      accentIcon: Building2,
      tone: 'blue',
      to: '/admin/rooms',
      progress: percentOf(occupancy.availableRooms, statistics.totalRooms),
    },
    {
      title: 'Current Guests',
      value: statistics.currentGuests,
      detail: `${occupancyPercent}% occupancy`,
      icon: Users,
      accentIcon: Users,
      tone: 'green',
      to: '/admin/guests',
      progress: occupancyPercent,
    },
    {
      title: "Today's Check-ins",
      value: statistics.todayCheckIns,
      detail: `${statistics.todayCheckOuts} check-out${statistics.todayCheckOuts === 1 ? '' : 's'} today`,
      icon: CalendarDays,
      accentIcon: CalendarDays,
      tone: 'orange',
      to: '/admin/reservations',
      progress: percentOf(
        statistics.todayCheckIns,
        statistics.todayCheckIns + statistics.todayCheckOuts,
      ),
    },
    {
      title: "Today's Payments",
      value: formatCurrency(statistics.todayPaymentsCentavos),
      detail: `${statistics.todayPaymentCount} paid payment(s)`,
      icon: CreditCard,
      accentIcon: TrendingUp,
      tone: 'purple',
      to: '/admin/payments',
    },
  ];

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Dashboard</p>
          <h1>Welcome back, {user?.firstName || 'there'}!</h1>
          <p>Here’s an overview of your NEXORA operations today.</p>
        </div>
        <div className="dashboard-date">
          <CalendarDays size={27} aria-hidden="true" />
          <div>
            <time dateTime={dashboard.date}>{reportDate(dashboard.date)}</time>
            <span>Have a great day managing NEXORA!</span>
          </div>
        </div>
      </header>
      <div className="stat-grid">
        {cards.map(
          ({
            title,
            value,
            detail,
            icon: Icon,
            accentIcon: AccentIcon,
            tone,
            to,
            progress,
          }) => (
            <Link
              to={to}
              className={`stat-card ${tone}`}
              key={title}
              aria-label={`${title}: ${value}. ${detail}. Open ${to.split('/').pop()}.`}
            >
              <div className="stat-card-heading">
                <span className="stat-icon">
                  <Icon size={25} />
                </span>
                <span className="stat-title">{title}</span>
                <AccentIcon
                  className="stat-watermark"
                  size={34}
                  aria-hidden="true"
                />
              </div>
              <strong className="stat-value">{value}</strong>
              <div
                className={`stat-meter${progress === undefined ? ' is-decorative' : ''}`}
                aria-hidden="true"
              >
                <span
                  style={
                    progress === undefined
                      ? undefined
                      : { width: `${progress}%` }
                  }
                />
              </div>
              <div className="stat-card-footer">
                <span>{detail}</span>
                <span className="stat-chevron">
                  <ChevronRight size={16} />
                </span>
              </div>
            </Link>
          ),
        )}
      </div>
      <div className="dashboard-grid">
        <article className="dashboard-panel reservations-panel">
          <div className="panel-heading">
            <h2>
              <CalendarDays size={24} aria-hidden="true" />
              Recent Reservations
            </h2>
            <Link to="/admin/reservations">
              View all <ArrowRight size={17} />
            </Link>
          </div>
          {recentReservations.length === 0 ? (
            <div className="dashboard-empty">
              <CalendarDays size={32} aria-hidden="true" />
              <h3>No reservations yet</h3>
              <p>New reservations will appear here.</p>
              <Link to="/admin/reservations">
                Manage reservations <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Guest Name</th>
                    <th>Room</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>
                        {reservation.guest.firstName}{' '}
                        {reservation.guest.lastName}
                      </td>
                      <td>Room {reservation.room.roomNumber}</td>
                      <td>{formatDate(reservation.checkIn)}</td>
                      <td>{formatDate(reservation.checkOut)}</td>
                      <td>
                        <span
                          className={`status-badge ${reservation.status.toLowerCase().replaceAll('_', '-')}`}
                        >
                          {formatStatus(reservation.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
        <article className="dashboard-panel occupancy-panel">
          <div className="panel-heading">
            <h2>
              <PieChart size={25} aria-hidden="true" />
              Room Occupancy
            </h2>
          </div>
          <div
            className="occupancy-circle"
            role="img"
            aria-label={`${occupancyPercent}% room occupancy. ${occupancy.occupiedRooms} occupied, ${occupancy.availableRooms} available, ${occupancy.maintenanceRooms} under maintenance.`}
            style={{ '--occupancy': `${occupancyPercent}%` }}
          >
            <div>
              <strong>{occupancyPercent}%</strong>
              <span>Occupied</span>
            </div>
          </div>
          <dl className="occupancy-legend">
            {[
              ['Occupied', occupancy.occupiedRooms, 'occupied'],
              ['Available', occupancy.availableRooms, 'available'],
              ['Maintenance', occupancy.maintenanceRooms, 'maintenance'],
            ].map(([label, count, tone]) => (
              <div key={label}>
                <dt>
                  <i className={`${tone}-dot`} aria-hidden="true" />
                  {label}
                </dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
          <div
            className={`occupancy-insight${occupancy.occupiedRooms > 0 ? ' has-guests' : ''}`}
          >
            <span>
              <CircleCheck size={23} aria-hidden="true" />
            </span>
            <div>
              <strong>{occupancyTitle}</strong>
              <p>{occupancyDetail}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
