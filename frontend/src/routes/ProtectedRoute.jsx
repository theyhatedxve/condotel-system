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