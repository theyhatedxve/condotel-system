import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getCurrentUser,
  loginUser,
} from '../api/authApi';

import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from '../utils/authStorage';

import {
  AuthContext,
} from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [isLoading, setIsLoading] = useState(
    () => Boolean(getAccessToken()),
  );

  const login = useCallback(
    async ({
      identifier,
      password,
      rememberMe,
    }) => {
      const result = await loginUser({
        identifier,
        password,
      });

      saveAccessToken(
        result.accessToken,
        rememberMe,
      );

      setUser(result.user);

      return result.user;
    },
    [],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, []);

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

      isAuthenticated:
        Boolean(user),

      login,
      logout,
    }),
    [
      user,
      isLoading,
      login,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}