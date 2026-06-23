import type { CSSProperties, KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSectorStory } from '../hooks/useSectorStory';
import { useActiveStage } from '../hooks/useActiveStage';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { StoryProgress } from '../components/story/StoryProgress';
import { StoryVisual } from '../components/story/StoryVisual';
import { StoryStageSection } from '../components/story/StoryStageSection';
import { resolveClimateTheme } from '../lib/storyVisuals';
import type { SectorStoryResponse } from '../types/api';

export default function SectorStoryPage() {
  const { id } = useParams<{ id: string }>();
  const { state, reload } = useSectorStory(id);

  if (state.status === 'loading') {
    return <LoadingState label="Cargando la historia del sector…" />;
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState
          title="No pudimos cargar la historia"
          message={state.message}
          onRetry={reload}
        />
      </div>
    );
  }

  // El backend promete exactamente 8 etapas ordenadas, pero si por algún motivo
  // llegaran cero no tiene sentido montar el motor de scroll: mostramos vacío.
  if (state.data.stages.length === 0) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          title="Sector sin historia"
          message="Este sector no tiene etapas narrativas para mostrar."
        />
      </div>
    );
  }

  // Separamos el contenido en su propio componente para poder usar hooks (etapa
  // activa, teclado) solo cuando ya tenemos datos garantizados.
  return <StoryContent data={state.data} sectorId={id} />;
}

function StoryContent({
  data,
  sectorId,
}: {
  data: SectorStoryResponse;
  sectorId: string | undefined;
}) {
  const { sector, stages } = data;
  const { activeIndex, registerSection, goToStage } = useActiveStage(
    stages.length,
  );
  const activeStage = stages[activeIndex] ?? stages[0];
  const climateTheme = resolveClimateTheme(sector.climate);

  // Navegación por teclado entre etapas. Solo intervenimos cuando el foco está en
  // una sección de etapa (tiene data-stage-index), así no secuestramos el scroll
  // normal del resto de la página. Cada tecla mueve foco y scroll a otra etapa,
  // sin ocultar contenido.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Intervenimos si el foco está dentro de una sección de etapa, no solo cuando
    // recae exactamente sobre ella: con closest cubrimos también el caso de que el
    // foco esté en un hijo de la sección. Si no hay match, dejamos pasar la tecla
    // para no secuestrar el scroll global de la página.
    const target = event.target as HTMLElement;
    if (target.closest('[data-stage-index]') === null) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
      case 'PageDown':
        event.preventDefault();
        goToStage(activeIndex + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        goToStage(activeIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        goToStage(0);
        break;
      case 'End':
        event.preventDefault();
        goToStage(stages.length - 1);
        break;
      default:
        break;
    }
  };

  // El nombre de transición debe coincidir con el de la tarjeta del sector en
  // /sectors para que la View Transition API haga el morph del título al navegar.
  const titleTransitionStyle = {
    viewTransitionName: sectorId ? `sector-title-${sectorId}` : undefined,
  } as CSSProperties;

  return (
    <div onKeyDown={handleKeyDown}>
      <StoryProgress
        activeIndex={activeIndex}
        total={stages.length}
        onJumpToStage={goToStage}
      />

      <header className="mt-6 space-y-3">
        <BackLink />
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80">
          {climateTheme.label}
        </p>
        <h1
          className="text-3xl font-semibold text-slate-100"
          style={titleTransitionStyle}
        >
          {sector.name}
        </h1>
        <p className="max-w-prose text-sm text-slate-400">
          Recorre las {stages.length} etapas de este sector: desplázate o usa las
          flechas del teclado sobre cada etapa. El visual y las métricas de la
          izquierda corresponden siempre a la etapa que estás leyendo.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="sticky top-14 z-10 self-start lg:top-24">
          <StoryVisual stage={activeStage} climate={sector.climate} />
        </div>

        <div className="space-y-8">
          {stages.map((stage, index) => (
            <StoryStageSection
              key={stage.id}
              stage={stage}
              index={index}
              isActive={index === activeIndex}
              registerRef={registerSection(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/sectors"
      viewTransition
      className="inline-flex items-center text-sm text-emerald-400 transition hover:text-emerald-300"
    >
      ← Volver a sectores
    </Link>
  );
}
