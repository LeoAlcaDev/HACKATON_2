import type { SignalStatus } from '../types/api';

// Mapas estáticos token -> clase fija. Es a propósito: si construyéramos los
// nombres de clase dinámicamente (p. ej. `bg-${color}-500`), el motor de Tailwind
// no los vería al escanear el código y los purgaría del CSS final.
const STATUS_STYLES: Record<SignalStatus, string> = {
  RECIBIDA: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  PROCESANDO: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  ATENDIDA: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
};

const STATUS_LABELS: Record<SignalStatus, string> = {
  RECIBIDA: 'Recibida',
  PROCESANDO: 'Procesando',
  ATENDIDA: 'Atendida',
};

interface StatusBadgeProps {
  status: SignalStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
