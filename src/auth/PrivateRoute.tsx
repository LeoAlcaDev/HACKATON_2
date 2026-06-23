import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { LoadingState } from '../components/LoadingState';

// Guard de las rutas privadas. Mientras restauramos la sesión mostramos un estado
// de carga (no decidimos aún); si no hay sesión, redirigimos a /login recordando
// a dónde quería ir el usuario para volver ahí tras autenticarse.
export function PrivateRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <LoadingState label="Restaurando sesión…" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
