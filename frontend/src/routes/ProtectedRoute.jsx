import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import LoadingScreen from
  '../features/auth/LoadingScreen';

import {
  useAuth,
} from '../features/auth/useAuth';

export default function ProtectedRoute({
  allowedRoles,
}) {
  const {
    user,
    isLoading,
    isAuthenticated,
  } = useAuth();

  const location =
    useLocation();

  // Wait for session restoration so a valid stored token does not cause a login redirect.
  if (isLoading) {
    return (
      <LoadingScreen />
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Keep the password-change page reachable to avoid a redirect loop for temporary passwords.
  if (
    user?.mustChangePassword &&
    location.pathname !==
      '/change-password'
  ) {
    return (
      <Navigate
        to="/change-password"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(
      user.role,
    )
  ) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  return <Outlet />;
}