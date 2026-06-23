import type { Severity } from '../types/api';

// Igual que StatusBadge: mapas estáticos token -> clase fija para que Tailwind no
// purgue estos colores. La severidad sube de gris (leve) a rojo (crítico).
const SEVERITY_STYLES: Record<Severity, string> = {
  LEVE: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
  MODERADO: 'bg-yellow-500/15 text-yellow-300 ring-yellow-500/30',
  GRAVE: 'bg-orange-500/15 text-orange-300 ring-orange-500/30',
  CRITICO: 'bg-red-500/15 text-red-300 ring-red-500/30',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  LEVE: 'Leve',
  MODERADO: 'Moderado',
  GRAVE: 'Grave',
  CRITICO: 'Crítico',
};

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${SEVERITY_STYLES[severity]}`}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
