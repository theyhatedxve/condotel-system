import { useContext } from 'react';

import { AuthContext } from './auth-context';

// Read the shared authentication context and reject use outside its provider.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
