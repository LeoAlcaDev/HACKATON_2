import type { StoryStage } from '../../types/api';
import { signalTypeLabel } from '../../lib/storyVisuals';

interface StoryStageSectionProps {
  stage: StoryStage;
  index: number;
  isActive: boolean;
  registerRef: (element: HTMLElement | null) => void;
}

// Una etapa narrativa del recorrido. Es enfocable con teclado (tabIndex 0) para
// que las flechas y el tabulador la alcancen sin perder contenido. La clase
// `story-stage` aplica el reveal con animaciones dirigidas por scroll cuando hay
// soporte; si no lo hay (o el usuario pidió movimiento reducido) el contenido se
// muestra siempre, porque el estado base del CSS ya es visible.
export function StoryStageSection({
  stage,
  index,
  isActive,
  registerRef,
}: StoryStageSectionProps) {
  return (
    <section
      ref={registerRef}
      data-stage-index={index}
      tabIndex={0}
      aria-current={isActive ? 'step' : undefined}
      aria-label={`Etapa ${stage.order + 1} de la historia: ${stage.title}`}
      className={`story-stage flex min-h-[70vh] scroll-mt-24 flex-col justify-center rounded-2xl border px-6 py-10 outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-emerald-400 ${
        isActive
          ? 'border-emerald-500/40 bg-slate-900/70'
          : 'border-slate-800 bg-slate-900/30'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80">
        Etapa {stage.order + 1} · {signalTypeLabel(stage.dominantEvent)}
      </p>
      <h3 className="mt-2 text-2xl font-semibold text-slate-100">
        {stage.title}
      </h3>
      <p className="mt-4 max-w-prose text-base leading-relaxed text-slate-300">
        {stage.narrative}
      </p>

      <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
        <div className="flex items-center gap-1.5">
          <dt className="font-medium text-slate-500">Estabilidad:</dt>
          <dd className="tabular-nums text-slate-200">
            {stage.metrics.stability}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="font-medium text-slate-500">Energía:</dt>
          <dd className="tabular-nums text-slate-200">{stage.metrics.energy}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="font-medium text-slate-500">Alertas:</dt>
          <dd className="tabular-nums text-slate-200">{stage.metrics.alerts}</dd>
        </div>
      </dl>
    </section>
  );
}
