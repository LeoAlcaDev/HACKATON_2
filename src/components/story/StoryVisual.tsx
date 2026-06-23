import type { CSSProperties } from 'react';
import type { Climate, StoryStage } from '../../types/api';
import {
  resolveClimateTheme,
  resolveColorToken,
  signalTypeLabel,
} from '../../lib/storyVisuals';

interface StoryVisualProps {
  stage: StoryStage;
  climate: Climate;
}

// Visual persistente del scrollytelling. No es un video ni un canvas pregrabado:
// es una escena construida con CSS cuyo degradado y métricas cambian con la etapa
// activa. Pasamos el color de la etapa y el color de ambiente del clima como
// variables CSS para no depender de clases dinámicas de Tailwind y soportar
// cualquier token del backend. Las capas decorativas se animan solo si el usuario
// no pidió movimiento reducido (ver index.css).
export function StoryVisual({ stage, climate }: StoryVisualProps) {
  const climateTheme = resolveClimateTheme(climate);
  const stageColor = resolveColorToken(stage.colorToken);

  const visualStyle = {
    '--stage-color': stageColor,
    '--ambient-color': climateTheme.ambient,
  } as CSSProperties;

  return (
    <div
      className="story-visual relative flex h-full min-h-[18rem] flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 p-6 text-slate-100"
      style={visualStyle}
      // El visual es decorativo respecto al texto, pero comunica la etapa activa;
      // lo anunciamos como una imagen con una descripción legible.
      role="img"
      aria-label={`Escena de la etapa ${stage.order + 1}: ${stage.title}, evento dominante ${signalTypeLabel(stage.dominantEvent)}.`}
    >
      <div className="story-visual__orb" aria-hidden="true" />
      <div className="story-visual__grid" aria-hidden="true" />

      <div className="relative z-10 flex items-center justify-between">
        <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-200 ring-1 ring-inset ring-white/10">
          {climateTheme.label}
        </span>
        <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-inset ring-white/10">
          {signalTypeLabel(stage.dominantEvent)}
        </span>
      </div>

      <div className="relative z-10">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-300/80">
          Etapa {stage.order + 1}
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight text-white">
          {stage.title}
        </h2>
      </div>

      <dl className="relative z-10 grid grid-cols-3 gap-3 text-center">
        <StoryMetric label="Estabilidad" value={stage.metrics.stability} />
        <StoryMetric label="Energía" value={stage.metrics.energy} />
        <StoryMetric label="Alertas" value={stage.metrics.alerts} />
      </dl>
    </div>
  );
}

interface StoryMetricProps {
  label: string;
  value: number;
}

function StoryMetric({ label, value }: StoryMetricProps) {
  return (
    <div className="rounded-xl bg-black/30 px-2 py-3 ring-1 ring-inset ring-white/10">
      <dt className="text-[0.65rem] font-medium uppercase tracking-wide text-slate-300/80">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-white">
        {value}
      </dd>
    </div>
  );
}
