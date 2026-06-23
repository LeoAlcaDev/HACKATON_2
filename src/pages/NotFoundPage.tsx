import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center text-slate-100">
      <p className="text-5xl font-bold text-slate-700">404</p>
      <h1 className="text-xl font-semibold">Ruta no encontrada</h1>
      <p className="max-w-md text-sm text-slate-400">
        La ruta que buscas no existe en la consola.
      </p>
      <Link
        to="/dashboard"
        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
      >
        Volver al dashboard
      </Link>
    </main>
  );
}
