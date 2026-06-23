// Esqueleto de carga del dashboard. Replica la MISMA rejilla y alturas que la
// vista real (cuatro tarjetas KPI arriba, el desglose de severidad abajo) para
// que cuando lleguen los datos no haya salto de layout: el contenido aparece en
// el mismo sitio que ya ocupaban los bloques en pulso.

// Alto fijo que comparten las tarjetas KPI y sus placeholders. Lo centralizamos
// aquí para que el skeleton y la tarjeta real no se desincronicen.
const CARD_HEIGHT = 'h-29';

function KpiCardSkeleton() {
  return (
    <div
      className={`flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900 p-5 ${CARD_HEIGHT}`}
    >
      <div className="h-3 w-24 rounded bg-slate-800" />
      <div className="h-8 w-16 rounded bg-slate-800" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-5">
        <div className="h-3 w-40 rounded bg-slate-800" />
        <div className="mt-4 flex flex-col gap-3">
          <div className="h-6 w-full rounded bg-slate-800" />
          <div className="h-6 w-full rounded bg-slate-800" />
          <div className="h-6 w-full rounded bg-slate-800" />
          <div className="h-6 w-full rounded bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
