interface LoadingStateProps {
  label?: string;
}

// Estado de carga reutilizable. Usamos role="status" + aria-live para que los
// lectores de pantalla anuncien la carga sin romper la accesibilidad.
export function LoadingState({ label = 'Cargando…' }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-3 py-12 text-slate-400"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400"
      />
      <span>{label}</span>
    </div>
  );
}
