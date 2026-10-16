import { Navigate, Outlet, useLocation } from 'react-router-dom';

import LoadingScreen from '../features/auth/LoadingScreen';

import { useAuth } from '../features/auth/useAuth';

// Wait for session restoration, require login/password change, and enforce allowed roles
// before rendering child routes.
export default function ProtectedRoute({ allowedRoles }) {
  // Track local state and read any session or route values needed by this component.
  const { user, isLoading, isAuthenticated } = useAuth();

  const location = useLocation();

  // Wait for session restoration so a valid stored token does not cause a login redirect.
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    const isPaymentReturn = ['/payment/success', '/payment/cancelled'].includes(
      location.pathname,
    );
    return (
      <Navigate
        to="/login"
        replace
        state={
          isPaymentReturn
            ? { paymentReturn: location.pathname + location.search }
            : undefined
        }
      />
    );
  }

  // Keep the password-change page reachable to avoid a redirect loop for temporary passwords.
  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
