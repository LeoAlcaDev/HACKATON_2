import { Navigate, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './auth/PrivateRoute';
import { AppLayout } from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import TropelsPage from './features/tropels/TropelsPage';
import SectorsPage from './pages/SectorsPage';
import SectorStoryPage from './pages/SectorStoryPage';
import NotFoundPage from './pages/NotFoundPage';
import SignalsLayout from './features/signals/SignalsLayout';
import SignalDetailPage from './features/signals/SignalDetailPage';

// Árbol de rutas completo. /login es pública; todo lo demás cuelga de PrivateRoute
// (redirige a /login sin sesión) y del AppLayout. El nesting de /signals se
// mantiene tal cual porque los checkpoints dependen de que feed y detalle vivan
// bajo el mismo Outlet.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tropels" element={<TropelsPage />} />
          <Route path="signals" element={<SignalsLayout />}>
            {/* El feed lo monta SignalsLayout directamente para que no se
                desmonte al abrir el detalle; por eso el index no pinta nada y
                el Outlet solo se usa para el panel del detalle (:id). */}
            <Route index element={null} />
            <Route path=":id" element={<SignalDetailPage />} />
          </Route>
          <Route path="sectors" element={<SectorsPage />} />
          <Route path="sectors/:id/story" element={<SectorStoryPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
