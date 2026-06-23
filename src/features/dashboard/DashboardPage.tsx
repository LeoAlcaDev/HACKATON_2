import { ErrorState } from '../../components/ErrorState';
import { KpiCard } from './components/KpiCard';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { SeverityBreakdown } from './components/SeverityBreakdown';
import { useDashboardSummary } from './useDashboardSummary';
import type { DashboardSummary } from '../../types/api';

// Formatea el promedio de estabilidad como porcentaje entero. El backend lo manda
// en escala 0..100, así que solo redondeamos; no dividimos entre 100.
function formatStabilityPercent(value: number): string {
  return `${Math.round(value)}%`;
}

// Formatea el timestamp de generación a hora local de Perú. Lo envolvemos por si
// `generatedAt` llegara malformado: en ese caso preferimos mostrar el valor crudo
// antes que romper toda la página por un Date inválido.
function formatGeneratedAt(generatedAt: string): string {
  const parsed = new Date(generatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return generatedAt;
  }
  return parsed.toLocaleString('es-PE');
}

// El workspace recién creado, sin tropeles ni señales, es un estado VÁLIDO: no es
// un error ni un vacío que esconder. Lo detectamos para añadir una nota sutil,
// pero igual pintamos los ceros reales que mandó el backend.
function isWorkspaceWithoutActivity(summary: DashboardSummary): boolean {
  return (
    summary.totalTropels === 0 &&
    summary.criticalTropels === 0 &&
    summary.openSignals === 0
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  const sinActividad = isWorkspaceWithoutActivity(summary);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Tropeles totales"
          value={summary.totalTropels}
          accent="emerald"
          hint={sinActividad ? 'Sin actividad registrada en el workspace todavía.' : undefined}
        />
        <KpiCard
          label="Tropeles críticos"
          value={summary.criticalTropels}
          accent="red"
        />
        <KpiCard
          label="Señales abiertas"
          value={summary.openSignals}
          accent="amber"
        />
        <KpiCard
          label="Estabilidad media del sector"
          value={formatStabilityPercent(summary.sectorStabilityAvg)}
          accent="sky"
        />
      </div>

      <div className="mt-4">
        <SeverityBreakdown counts={summary.signalsBySeverity} />
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Actualizado el {formatGeneratedAt(summary.generatedAt)}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { status, data, errorMessage, refetch } = useDashboardSummary();

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Indicadores globales del workspace en tiempo real.
        </p>
      </header>

      {status === 'loading' ? <DashboardSkeleton /> : null}

      {status === 'error' ? (
        <ErrorState
          title="No pudimos cargar el dashboard"
          message={errorMessage ?? undefined}
          onRetry={refetch}
        />
      ) : null}

      {status === 'success' && data ? <DashboardContent summary={data} /> : null}
    </section>
  );
}
