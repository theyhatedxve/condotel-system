import { createContext } from 'react';

// Share the session contract without coupling consumers to the provider component.
export const AuthContext = createContext(null);
