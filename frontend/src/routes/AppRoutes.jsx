import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AdminLayout from
  '../layouts/AdminLayout';

import DashboardPage from
  '../pages/admin/DashboardPage';

import PlaceholderPage from
  '../pages/admin/PlaceholderPage';

import LoginPage from
  '../pages/auth/LoginPage';

import NotFoundPage from
  '../pages/shared/NotFoundPage';

import UnauthorizedPage from
  '../pages/shared/UnauthorizedPage';

import ProtectedRoute from
  './ProtectedRoute';

import RoomsPage from
  '../pages/admin/RoomsPage';

import GuestsPage from
  '../pages/admin/GuestsPage';

import ReservationsPage from
  '../pages/admin/ReservationsPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/unauthorized"
        element={
          <UnauthorizedPage />
        }
      />

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              'ADMIN',
              'STAFF',
            ]}
          />
        }
      >
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <DashboardPage />
            }
          />

          <Route
            path="guests"
            element={<GuestsPage />}
          />

          <Route
            path="rooms"
            element={<RoomsPage />}
          />

          <Route
            path="reservations"
            element={
              <ReservationsPage />
            }
          />

          <Route
            path="nfc"
            element={
              <PlaceholderPage
                title="NFC Management"
              />
            }
          />

          <Route
            path="payments"
            element={
              <PlaceholderPage
                title="Payments"
              />
            }
          />

          <Route
            path="transactions"
            element={
              <PlaceholderPage
                title="Transactions"
              />
            }
          />

          <Route
            path="reports"
            element={
              <PlaceholderPage
                title="Reports"
              />
            }
          />

          <Route
            path="settings"
            element={
              <PlaceholderPage
                title="Settings"
              />
            }
          />
        </Route>
      </Route>

      <Route
        path="/customer/home"
        element={
          <main className="loading-screen">
            Customer Portal will be
            implemented later.
          </main>
        }
      />

      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  );
}