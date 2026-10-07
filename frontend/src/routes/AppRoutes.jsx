import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from '../layouts/AdminLayout';

import DashboardPage from '../features/dashboard/DashboardPage';

import PlaceholderPage from '../features/nfc/PlaceholderPage';

import LoginPage from '../features/auth/LoginPage';

import NotFoundPage from '../pages/shared/NotFoundPage';

import UnauthorizedPage from '../pages/shared/UnauthorizedPage';

import ProtectedRoute from './ProtectedRoute';

import RoomsPage from '../features/rooms/RoomsPage';

import PaymentsPage from '../features/payments/PaymentsPage';

import PaymentResultPage from '../features/payments/PaymentResultPage';

import GuestsPage from '../features/guests/GuestsPage';

import ReservationsPage from '../features/reservations/ReservationsPage';

import TransactionsPage from '../features/transactions/TransactionsPage';

import ReportsPage from '../features/reports/ReportsPage';

import SettingsPage from '../features/settings/SettingsPage';

import ProfilePage from '../features/auth/ProfilePage';

import ChangePasswordPage from '../features/auth/ChangePasswordPage';

import UserManagementPage from '../features/user-management/UserManagementPage';
import LandingPage from '../features/landing/LandingPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />

      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
        <Route path="/payment/success" element={<PaymentResultPage />} />

        <Route path="/payment/cancelled" element={<PaymentResultPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="profile" element={<ProfilePage />} />

          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="guests" element={<GuestsPage />} />
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="users" element={<UserManagementPage />} />
          </Route>

          <Route path="rooms" element={<RoomsPage />} />

          <Route path="reservations" element={<ReservationsPage />} />

          <Route
            path="nfc"
            element={<PlaceholderPage title="NFC Management" />}
          />

          <Route path="payments" element={<PaymentsPage />} />

          <Route path="transactions" element={<TransactionsPage />} />

          <Route path="reports" element={<ReportsPage />} />

          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route
        path="/customer/home"
        element={
          <main className="loading-screen">
            Customer Portal will be implemented later.
          </main>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
