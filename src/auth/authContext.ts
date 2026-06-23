import { createContext } from 'react';
import type { LoginRequest, SessionUser } from '../types/api';

// Separamos el objeto de contexto y sus tipos del componente proveedor para que
// Fast Refresh siga funcionando (un archivo que solo exporta componentes no se
// mezcla con exports de valores no-componente).

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: SessionUser | null;
  // 'loading' mientras intentamos restaurar la sesión al arrancar; recién después
  // sabemos si el usuario está autenticado o no.
  status: AuthStatus;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
