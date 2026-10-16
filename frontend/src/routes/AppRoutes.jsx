import { lazy, Suspense } from 'react';
import LoadingScreen from '../features/auth/LoadingScreen';
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

const PaymentResultPage = lazy(
  () => import('../features/payments/PaymentResultPage'),
);

const GuestsPage = lazy(() => import('../features/guests/GuestsPage'));

const ReservationsPage = lazy(
  () => import('../features/reservations/ReservationsPage'),
);

const TransactionsPage = lazy(
  () => import('../features/transactions/TransactionsPage'),
);

const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));

const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));

const ProfilePage = lazy(() => import('../features/auth/ProfilePage'));
const CustomerProfilePage = lazy(
  () => import('../features/auth/CustomerProfilePage'),
);

const ChangePasswordPage = lazy(
  () => import('../features/auth/ChangePasswordPage'),
);

const UserManagementPage = lazy(
  () => import('../features/user-management/UserManagementPage'),
);
const LandingPage = lazy(() => import('../features/landing/LandingPage'));
const HomePage = lazy(() => import('../features/home/HomePage'));
const BookingPage = lazy(() => import('../features/booking/BookingPage'));
const CheckoutPage = lazy(() => import('../features/payments/CheckoutPage'));
const MyBookingsPage = lazy(
  () => import('../features/my-bookings/MyBookingsPage'),
);

// Map public, customer-only, and staff/admin URLs to their existing pages and layouts.
export default function AppRoutes() {
  return (
    <Routes>
      {/* Keep the property homepage public. */}
      <Route
        path="/"
        element={
          <Suspense key="HomePage" fallback={<LoadingScreen />}>
            <HomePage />
          </Suspense>
        }
      />

      {/* Require a restored session for room browsing, profiles, and payment returns. */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/rooms"
          element={
            <Suspense key="LandingPage" fallback={<LoadingScreen />}>
              <LandingPage />
            </Suspense>
          }
        />
        <Route
          path="/payment/success"
          element={
            <Suspense key="PaymentResultPage" fallback={<LoadingScreen />}>
              <PaymentResultPage />
            </Suspense>
          }
        />
        <Route
          path="/payment/cancelled"
          element={
            <Suspense key="PaymentResultPage" fallback={<LoadingScreen />}>
              <PaymentResultPage />
            </Suspense>
          }
        />
        <Route
          path="/customer/home"
          element={<Navigate to="/rooms" replace />}
        />
        <Route
          path="/change-password"
          element={
            <Suspense key="ChangePasswordPage" fallback={<LoadingScreen />}>
              <ChangePasswordPage />
            </Suspense>
          }
        />
      </Route>

      {/* Customers own the booking and payment-review pages. */}
      <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
        <Route
          path="/profile"
          element={
            <Suspense key="CustomerProfilePage" fallback={<LoadingScreen />}>
              <CustomerProfilePage />
            </Suspense>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <Suspense key="MyBookingsPage" fallback={<LoadingScreen />}>
              <MyBookingsPage />
            </Suspense>
          }
        />
        <Route
          path="/booking/:roomId"
          element={
            <Suspense key="BookingPage" fallback={<LoadingScreen />}>
              <BookingPage />
            </Suspense>
          }
        />
        <Route
          path="/booking/:roomId/payment"
          element={
            <Suspense key="CheckoutPage" fallback={<LoadingScreen />}>
              <CheckoutPage />
            </Suspense>
          }
        />
      </Route>

      {/* Keep login and registration reachable before authentication. */}
      <Route
        path="/login"
        element={
          <Suspense key="LoginPage" fallback={<LoadingScreen />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/register"
        element={
          <Suspense key="RegisterPage" fallback={<LoadingScreen />}>
            <RegisterPage />
          </Suspense>
        }
      />

      <Route
        path="/unauthorized"
        element={
          <Suspense key="UnauthorizedPage" fallback={<LoadingScreen />}>
            <UnauthorizedPage />
          </Suspense>
        }
      />

      {/* Place management features inside the staff/admin layout and role guard. */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            path="profile"
            element={
              <Suspense key="ProfilePage" fallback={<LoadingScreen inline />}>
                <ProfilePage />
              </Suspense>
            }
          />

          <Route index element={<Navigate to="dashboard" replace />} />

          <Route
            path="dashboard"
            element={
              <Suspense key="DashboardPage" fallback={<LoadingScreen inline />}>
                <DashboardPage />
              </Suspense>
            }
          />

          <Route
            path="guests"
            element={
              <Suspense key="GuestsPage" fallback={<LoadingScreen inline />}>
                <GuestsPage />
              </Suspense>
            }
          />
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route
              path="users"
              element={
                <Suspense
                  key="UserManagementPage"
                  fallback={<LoadingScreen inline />}
                >
                  <UserManagementPage />
                </Suspense>
              }
            />
          </Route>

          <Route
            path="rooms"
            element={
              <Suspense key="RoomsPage" fallback={<LoadingScreen inline />}>
                <RoomsPage />
              </Suspense>
            }
          />

          <Route
            path="reservations"
            element={
              <Suspense
                key="ReservationsPage"
                fallback={<LoadingScreen inline />}
              >
                <ReservationsPage />
              </Suspense>
            }
          />

          <Route
            path="nfc"
            element={
              <Suspense
                key="PlaceholderPage"
                fallback={<LoadingScreen inline />}
              >
                <PlaceholderPage title="NFC Management" />
              </Suspense>
            }
          />

          <Route
            path="payments"
            element={
              <Suspense key="PaymentsPage" fallback={<LoadingScreen inline />}>
                <PaymentsPage />
              </Suspense>
            }
          />

          <Route
            path="transactions"
            element={
              <Suspense
                key="TransactionsPage"
                fallback={<LoadingScreen inline />}
              >
                <TransactionsPage />
              </Suspense>
            }
          />

          <Route
            path="reports"
            element={
              <Suspense key="ReportsPage" fallback={<LoadingScreen inline />}>
                <ReportsPage />
              </Suspense>
            }
          />

          <Route
            path="settings"
            element={
              <Suspense key="SettingsPage" fallback={<LoadingScreen inline />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Suspense key="NotFoundPage" fallback={<LoadingScreen />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  );
}
