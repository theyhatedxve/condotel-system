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
import HomePage from '../features/home/HomePage';
import BookingPage from '../features/booking/BookingPage';
import CheckoutPage from '../features/payments/CheckoutPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/rooms" element={<LandingPage />} />
        <Route path="/payment/success" element={<PaymentResultPage />} />
        <Route path="/payment/cancelled" element={<PaymentResultPage />} />
        <Route
          path="/customer/home"
          element={<Navigate to="/rooms" replace />}
        />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
        <Route path="/booking/:roomId" element={<BookingPage />} />
        <Route path="/booking/:roomId/payment" element={<CheckoutPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />

      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
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

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
