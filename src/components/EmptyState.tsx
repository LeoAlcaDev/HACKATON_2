import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  // Hueco para una acción opcional (p. ej. limpiar filtros) en los checkpoints.
  action?: ReactNode;
}

export function EmptyState({
  title = 'Sin resultados',
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-900/40 px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-slate-300">{title}</h2>
      {message ? <p className="max-w-md text-sm text-slate-500">{message}</p> : null}
      {action}
    </div>
  );
}
