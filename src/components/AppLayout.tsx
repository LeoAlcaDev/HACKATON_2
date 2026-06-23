import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

// Shell de las páginas privadas: navegación principal, datos del usuario, botón de
// logout y el Outlet donde se monta cada página. La preservación de scroll del
// feed se resuelve en su propio sub-layout (SignalsLayout), no aquí.
const NAV_ITEMS: ReadonlyArray<{ to: string; label: string }> = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tropels', label: 'Tropeles' },
  { to: '/signals', label: 'Señales' },
  { to: '/sectors', label: 'Sectores' },
];

// Devolvemos clases fijas según el estado activo del enlace, sin construir nombres
// de clase dinámicos, para no pelear con el purgado de Tailwind.
function navLinkClass({ isActive }: { isActive: boolean }): string {
  const base = 'rounded-md px-3 py-1.5 text-sm font-medium transition';
  return isActive
    ? `${base} bg-slate-800 text-emerald-300`
    : `${base} text-slate-400 hover:text-slate-100`;
}

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="font-semibold tracking-tight">
              TropelCare
            </Link>
            <nav className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="text-right text-xs leading-tight">
                <p className="text-slate-300">{user.displayName}</p>
                <p className="text-slate-500">{user.teamCode}</p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
