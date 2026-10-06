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

import PaymentsPage from
  '../pages/admin/PaymentsPage';

import PaymentResultPage from
  '../pages/shared/PaymentResultPage';

import GuestsPage from
  '../pages/admin/GuestsPage';

import ReservationsPage from
  '../pages/admin/ReservationsPage';

import TransactionsPage from
  '../pages/admin/TransactionsPage';

import ReportsPage from
  '../pages/admin/ReportsPage';

import SettingsPage from
  '../pages/admin/SettingsPage';

import ProfilePage from
  '../pages/admin/ProfilePage';

import ChangePasswordPage from
  '../pages/shared/ChangePasswordPage';

import UserManagementPage from
  '../pages/admin/UserManagementPage';

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
        element={
          <ProtectedRoute />
        }
      >
        <Route
          path="/change-password"
          element={
            <ChangePasswordPage />
          }
        />
      </Route>

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
          path="/payment/success"
          element={
            <PaymentResultPage />
          }
        />

        <Route
          path="/payment/cancelled"
          element={
            <PaymentResultPage />
          }
        />
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          
          <Route
            path="profile"
            element={
              <ProfilePage />
            }
          />

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
            element={
              <ProtectedRoute
                allowedRoles={[
                  'ADMIN',
                ]}
              />
            }
          >
            <Route
              path="users"
              element={
                <UserManagementPage />
              }
            />
          </Route>
          
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
              <PaymentsPage />
            }
          />

          <Route
            path="transactions"
            element={
              <TransactionsPage />
            }
          />

          <Route
            path="reports"
            element={
              <ReportsPage />
            }
          />

          <Route
            path="settings"
            element={
              <SettingsPage />
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