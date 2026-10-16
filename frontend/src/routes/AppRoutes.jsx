import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from '../layouts/AdminLayout';

const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));

const PlaceholderPage = lazy(() => import('../features/nfc/PlaceholderPage'));

const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'));

const NotFoundPage = lazy(() => import('../pages/shared/NotFoundPage'));

const UnauthorizedPage = lazy(() => import('../pages/shared/UnauthorizedPage'));

import ProtectedRoute from './ProtectedRoute';

const RoomsPage = lazy(() => import('../features/rooms/RoomsPage'));

const PaymentsPage = lazy(() => import('../features/payments/PaymentsPage'));

const PaymentResultPage = lazy(() => import('../features/payments/PaymentResultPage'));

const GuestsPage = lazy(() => import('../features/guests/GuestsPage'));

const ReservationsPage = lazy(() => import('../features/reservations/ReservationsPage'));

const TransactionsPage = lazy(() => import('../features/transactions/TransactionsPage'));

const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));

const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));

const ProfilePage = lazy(() => import('../features/auth/ProfilePage'));
const CustomerProfilePage = lazy(() => import('../features/auth/CustomerProfilePage'));

const ChangePasswordPage = lazy(() => import('../features/auth/ChangePasswordPage'));

const UserManagementPage = lazy(() => import('../features/user-management/UserManagementPage'));
const LandingPage = lazy(() => import('../features/landing/LandingPage'));
const HomePage = lazy(() => import('../features/home/HomePage'));
const BookingPage = lazy(() => import('../features/booking/BookingPage'));
const CheckoutPage = lazy(() => import('../features/payments/CheckoutPage'));
const MyBookingsPage = lazy(() => import('../features/my-bookings/MyBookingsPage'));

// Map public, customer-only, and staff/admin URLs to their existing pages and layouts.
export default function AppRoutes() {
  return (
    <Routes>
      {/* Keep the property homepage public. */}
      <Route path="/" element={<HomePage />} />

      {/* Require a restored session for room browsing, profiles, and payment returns. */}
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

      {/* Customers own the booking and payment-review pages. */}
      <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
        <Route path="/profile" element={<CustomerProfilePage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/booking/:roomId" element={<BookingPage />} />
        <Route path="/booking/:roomId/payment" element={<CheckoutPage />} />
      </Route>

      {/* Keep login and registration reachable before authentication. */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Place management features inside the staff/admin layout and role guard. */}
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
