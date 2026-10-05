import {
  BedDouble,
  CalendarCheck,
  CreditCard,
  Users,
} from 'lucide-react';

import { useAuth } from
  '../../hooks/useAuth';

import '../../styles/dashboard.css';

const statistics = [
  {
    title: 'Total Rooms',
    value: '24',
    detail: '+2 available',
    icon: BedDouble,
    className: 'blue',
  },
  {
    title: 'Current Guests',
    value: '18',
    detail: '75% occupancy',
    icon: Users,
    className: 'green',
  },
  {
    title: "Today's Check-ins",
    value: '6',
    detail: 'View details',
    icon: CalendarCheck,
    className: 'orange',
  },
  {
    title: "Today's Payments",
    value: '₱24,500',
    detail: '+12% from yesterday',
    icon: CreditCard,
    className: 'purple',
  },
];

const reservations = [
  {
    guest: 'Juan Dela Cruz',
    room: '101',
    checkIn: 'Apr 25, 2025',
    checkOut: 'Apr 28, 2025',
    status: 'Checked In',
  },
  {
    guest: 'Maria Santos',
    room: '203',
    checkIn: 'Apr 26, 2025',
    checkOut: 'Apr 30, 2025',
    status: 'Confirmed',
  },
  {
    guest: 'Pedro Reyes',
    room: '305',
    checkIn: 'Apr 27, 2025',
    checkOut: 'Apr 29, 2025',
    status: 'Pending',
  },
  {
    guest: 'Ana Lopez',
    room: '118',
    checkIn: 'Apr 27, 2025',
    checkOut: 'Apr 31, 2025',
    status: 'Confirmed',
  },
];

function getStatusClass(status) {
  return status
    .toLowerCase()
    .replaceAll(' ', '-');
}

export default function DashboardPage() {
  const { user } =
    useAuth();

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <h1>
          Good Morning,{' '}
          {user?.firstName || 'Admin'}!
        </h1>

        <p>
          Here's what's happening with
          your condotel today.
        </p>
      </header>

      <div className="stat-grid">
        {statistics.map(
          ({
            title,
            value,
            detail,
            icon: Icon,
            className,
          }) => (
            <article
              key={title}
              className={`stat-card ${className}`}
            >
              <div>
                <span className="stat-title">
                  {title}
                </span>

                <strong>
                  {value}
                </strong>

                <small>
                  {detail}
                </small>
              </div>

              <Icon size={30} />
            </article>
          ),
        )}
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-panel reservations-panel">
          <div className="panel-heading">
            <h2>
              Recent Reservations
            </h2>

            <button type="button">
              View all
            </button>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>
                    Guest Name
                  </th>

                  <th>Room</th>

                  <th>
                    Check-in
                  </th>

                  <th>
                    Check-out
                  </th>

                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {reservations.map(
                  (reservation) => (
                    <tr
                      key={`${reservation.guest}-${reservation.room}`}
                    >
                      <td>
                        {reservation.guest}
                      </td>

                      <td>
                        {reservation.room}
                      </td>

                      <td>
                        {reservation.checkIn}
                      </td>

                      <td>
                        {reservation.checkOut}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            reservation.status,
                          )}`}
                        >
                          {reservation.status}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="dashboard-panel occupancy-panel">
          <h2>
            Room Occupancy
          </h2>

          <div className="occupancy-circle">
            <div>
              <strong>
                75%
              </strong>

              <span>
                Occupied
              </span>
            </div>
          </div>

          <div className="occupancy-legend">
            <span>
              <i className="occupied-dot" />
              Occupied
              <strong>18</strong>
            </span>

            <span>
              <i className="available-dot" />
              Available
              <strong>6</strong>
            </span>

            <span>
              <i className="maintenance-dot" />
              Maintenance
              <strong>0</strong>
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}