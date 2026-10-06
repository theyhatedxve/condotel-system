import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import LoadingScreen from
  '../components/common/LoadingScreen';

import { useAuth } from
  '../hooks/useAuth';

export default function ProtectedRoute({
  allowedRoles,
}) {

  const location =
  useLocation();
  if (!isAuthenticated) {
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
  const {
    user,
    isLoading,
    isAuthenticated,
  } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
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
    allowedRoles &&
    !allowedRoles.includes(user.role)
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
}