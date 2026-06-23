import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ApiRequestError } from '../lib/apiClient';
import { env } from '../lib/env';

// Tras autenticarse volvemos a la ruta que el usuario intentó abrir (la guarda
// PrivateRoute en location.state.from); si no hay, vamos al dashboard.
interface LocationState {
  from?: { pathname?: string };
}

export default function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Prellenamos teamCode y email desde variables VITE_ por comodidad en
  // desarrollo. El password se escribe siempre: las VITE_ quedan expuestas en el
  // bundle público y no horneamos el password en producción.
  const [teamCode, setTeamCode] = useState(env.defaultTeamCode);
  const [email, setEmail] = useState(env.defaultEmail);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname ?? '/dashboard';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login({ teamCode, email, password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.payload.message);
      } else {
        setErrorMessage(
          'No pudimos iniciar sesión. Revisa tu conexión e inténtalo de nuevo.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">TropelCare Control Room</h1>
          <p className="mt-1 text-sm text-slate-400">
            Ingresa con las credenciales de tu equipo.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <div className="space-y-1.5">
            <label htmlFor="teamCode" className="block text-sm text-slate-300">
              Código de equipo
            </label>
            <input
              id="teamCode"
              name="teamCode"
              type="text"
              autoComplete="organization"
              required
              value={teamCode}
              onChange={(event) => setTeamCode(event.target.value)}
              placeholder="TEAM-001"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="operator@tuckersoft.com"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm text-slate-300">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
            />
          </div>

          {errorMessage ? (
            <p role="alert" className="text-sm text-red-400">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}
