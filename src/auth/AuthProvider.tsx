import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  apiGet,
  apiPost,
  setAuthToken,
  setUnauthorizedHandler,
} from '../lib/apiClient';
import type { LoginRequest, LoginResponse, SessionUser } from '../types/api';
import { AuthContext } from './authContext';
import type { AuthContextValue, AuthStatus } from './authContext';

// Guardamos el token en localStorage como fuente única para poder restaurar la
// sesión al recargar, y lo espejamos en el cliente HTTP (que lo inyecta como
// Bearer) y en el estado de React (que lo usa el render).
const TOKEN_STORAGE_KEY = 'tropelcare.token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Limpia toda la sesión de una vez: estado de React, token del cliente HTTP y
  // localStorage. La usamos tanto en logout como ante un 401.
  const clearSession = useCallback(() => {
    setUser(null);
    setStatus('unauthenticated');
    setAuthToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const result = await apiPost<LoginResponse>('/auth/login', credentials);
    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    setAuthToken(result.token);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // Cableamos el handler de 401 del cliente: cualquier petición que falle por
  // sesión inválida o expirada limpia la sesión, y PrivateRoute redirige a /login.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Restauración de sesión al cargar o recargar: si hay token guardado lo
  // espejamos en el cliente y preguntamos por /auth/me. Si falla, limpiamos.
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setStatus('unauthenticated');
      return;
    }

    setAuthToken(storedToken);
    let cancelled = false;

    // Asumimos que /auth/me devuelve el SessionUser directamente. Es la forma más
    // probable del contrato; confirmar contra Swagger el día del evento y ajustar
    // aquí si el backend lo envuelve (p. ej. en { user }).
    apiGet<SessionUser>('/auth/me')
      .then((restored) => {
        if (cancelled) return;
        setUser(restored);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
