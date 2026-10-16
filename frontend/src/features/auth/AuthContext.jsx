import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCurrentUser, loginUser } from './authApi';

import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from './authStorage';

import { AuthContext } from './auth-context';

// Restore and share the signed-in account, login/logout actions, and loading state.
export function AuthProvider({ children }) {
  // Track local state and read any session or route values needed by this component.
  const [user, setUser] = useState(null);

  const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken()));

  // Reload the current account and replace the shared authentication profile.
  const refreshUser = useCallback(async () => {
    const result = await getCurrentUser();

    setUser(result.user);

    return result.user;
  }, []);

  // Authenticate credentials, store the access token according to Remember Me, and share
  // the returned account.
  const login = useCallback(async ({ identifier, password, rememberMe }) => {
    const result = await loginUser({
      identifier,
      password,
    });

    saveAccessToken(result.accessToken, rememberMe);

    setUser(result.user);

    return result.user;
  }, []);

  // Clear stored tokens and remove the shared signed-in account.
  const logout = useCallback(() => {
    clearAccessToken();

    setUser(null);
  }, []);

  // Validate a stored token with the backend before treating the session as authenticated.
  // ProtectedRoute waits for this initialization before deciding whether to redirect.
  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    let cancelled = false;

    getCurrentUser()
      .then((result) => {
        if (!cancelled) {
          setUser(result.user);
        }
      })
      .catch(() => {
        clearAccessToken();

        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,

      isLoading,

      isAuthenticated: Boolean(user),

      login,

      logout,

      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
