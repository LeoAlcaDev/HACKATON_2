import { useEffect, useMemo, useState } from 'react';
import { supportsScrollTimeline } from '../../lib/motion';

interface StoryProgressProps {
  activeIndex: number;
  total: number;
  // Permite saltar a una etapa al pulsar su punto; reusa la navegación por
  // teclado/scroll del hook de etapa activa.
  onJumpToStage: (index: number) => void;
}

// Barra de progreso del recorrido. Cuando el navegador soporta animaciones
// dirigidas por scroll, la barra superior la rellena el CSS con
// `animation-timeline: scroll()` (ver index.css). Cuando no, calculamos la
// fracción de scroll en JS y la aplicamos como ancho: el progreso se ve igual en
// ambos casos. Además mostramos puntos por etapa que sirven de salto accesible.
export function StoryProgress({
  activeIndex,
  total,
  onJumpToStage,
}: StoryProgressProps) {
  const hasScrollTimeline = useMemo(() => supportsScrollTimeline(), []);
  const [scrollFraction, setScrollFraction] = useState(0);

  useEffect(() => {
    // Calculamos la fracción de scroll siempre, incluso cuando el CSS dirige el
    // relleno con scroll-timeline. El motivo es que el progressbar accesible debe
    // reportar el avance continuo (aria-valuenow en %), y ese valor solo existe en
    // JS: la scroll-timeline pinta el ancho pero no nos da un número que leer.
    const updateFraction = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const fraction = scrollable > 0 ? window.scrollY / scrollable : 0;
      setScrollFraction(Math.min(1, Math.max(0, fraction)));
    };

    updateFraction();
    window.addEventListener('scroll', updateFraction, { passive: true });
    window.addEventListener('resize', updateFraction);
    return () => {
      window.removeEventListener('scroll', updateFraction);
      window.removeEventListener('resize', updateFraction);
    };
  }, []);

  return (
    <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur">
      <div
        className="h-1 w-full overflow-hidden bg-slate-800"
        role="progressbar"
        aria-label="Progreso del recorrido"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scrollFraction * 100)}
      >
        <div
          className={
            hasScrollTimeline
              ? 'story-progress-fill h-full origin-left bg-emerald-400'
              : 'h-full origin-left bg-emerald-400'
          }
          style={
            hasScrollTimeline ? undefined : { width: `${scrollFraction * 100}%` }
          }
        />
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <p className="text-xs font-medium text-slate-400">
          Etapa {activeIndex + 1} de {total}
        </p>
        <nav
          aria-label="Saltar a una etapa"
          className="flex items-center gap-1.5"
        >
          {Array.from({ length: total }, (_, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => onJumpToStage(index)}
                aria-label={`Ir a la etapa ${index + 1}`}
                aria-current={isActive ? 'step' : undefined}
                className={
                  isActive
                    ? 'h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30 transition'
                    : 'h-2.5 w-2.5 rounded-full bg-slate-600 transition hover:bg-slate-400'
                }
              />
            );
          })}
        </nav>
      </div>
    </div>
  );
}
