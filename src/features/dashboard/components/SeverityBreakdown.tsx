import { SeverityBadge } from '../../../components/SeverityBadge';
import type { Severity } from '../../../types/api';

// Orden fijo de severidad de menor a mayor gravedad. No iteramos las claves del
// objeto del backend directamente porque su orden no está garantizado, y aquí
// queremos que el desglose suba siempre de Leve a Crítico de forma consistente.
const SEVERITY_ORDER: ReadonlyArray<Severity> = [
  'LEVE',
  'MODERADO',
  'GRAVE',
  'CRITICO',
];

interface SeverityBreakdownProps {
  counts: Record<Severity, number>;
}

export function SeverityBreakdown({ counts }: SeverityBreakdownProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Señales por severidad
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {SEVERITY_ORDER.map((severity) => (
          <li
            key={severity}
            className="flex items-center justify-between gap-4"
          >
            <SeverityBadge severity={severity} />
            <span className="text-lg font-semibold tabular-nums text-slate-100">
              {counts[severity]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
