import { useContext } from 'react';
import { AuthContext } from './authContext';
import type { AuthContextValue } from './authContext';

// Hook de acceso al contexto de auth. Lanza si se usa fuera del proveedor para
// detectar el error en desarrollo en vez de propagar un null silencioso.
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return context;
}
