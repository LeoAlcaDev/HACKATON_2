import type { ReactNode } from 'react';

// Tarjeta de un indicador global. Aceptamos el acento como prop con un valor
// restringido a un mapa estático de clases, porque construir `text-${color}-300`
// dinámicamente haría que Tailwind purgue esos colores del bundle.
export type KpiAccent = 'emerald' | 'red' | 'amber' | 'sky';

const ACCENT_VALUE_CLASS: Record<KpiAccent, string> = {
  emerald: 'text-emerald-300',
  red: 'text-red-300',
  amber: 'text-amber-300',
  sky: 'text-sky-300',
};

interface KpiCardProps {
  label: string;
  value: ReactNode;
  accent?: KpiAccent;
  // Texto auxiliar opcional bajo el valor (p. ej. la nota de "sin actividad").
  hint?: string;
}

export function KpiCard({ label, value, accent = 'emerald', hint }: KpiCardProps) {
  return (
    <div className="flex h-29 flex-col justify-between rounded-lg border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-semibold tabular-nums ${ACCENT_VALUE_CLASS[accent]}`}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
