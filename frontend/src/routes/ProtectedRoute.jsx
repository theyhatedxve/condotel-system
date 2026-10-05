import {
  Navigate,
  Outlet,
} from 'react-router-dom';

import LoadingScreen from
  '../components/common/LoadingScreen';

import { useAuth } from
  '../hooks/useAuth';

export default function ProtectedRoute({
  allowedRoles,
}) {
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