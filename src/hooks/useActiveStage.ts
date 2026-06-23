import { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';

// Sigue qué etapa de la historia está activa según el scroll y permite saltar de
// una a otra con el teclado. La etapa activa es la que cruza una banda estrecha en
// el centro del viewport, así el visual persistente y las métricas siempre
// corresponden a lo que el usuario está leyendo, igual en desktop que en mobile.
export function useActiveStage(stageCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Guardamos las referencias a cada sección de etapa por índice para poder
  // observarlas y hacer scroll programático hacia ellas desde el teclado.
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  // Espejo del índice activo para poder consultarlo dentro de callbacks estables
  // (el early-return de goToStage) sin meter activeIndex en sus dependencias y sin
  // arrastrar un valor obsoleto por una closure.
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  // Mientras dura un salto programático (teclado o puntos de progreso) el scroll
  // suave atraviesa varias secciones intermedias y el IntersectionObserver
  // dispararía con esos índices, pisando el destino. Con esta guarda el observer
  // ignora sus actualizaciones hasta que el salto termina.
  const isProgrammaticScroll = useRef(false);
  // Timeout de respaldo para soltar la guarda en navegadores sin evento scrollend.
  const programmaticScrollTimeout = useRef<number | null>(null);

  const registerSection = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      sectionRefs.current[index] = element;
    },
    [],
  );

  useEffect(() => {
    const sections = sectionRefs.current.filter(
      (element): element is HTMLElement => element !== null,
    );
    if (sections.length === 0) {
      return;
    }

    // Reducimos el "root" a una franja del 10% en el centro vertical: la sección
    // que la cruza es la activa. Funciona igual en pantallas altas y bajas porque
    // el margen es proporcional al viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        // Durante un salto programático no dejamos que las secciones intermedias
        // cambien la etapa activa: el destino ya lo fijó goToStage.
        if (isProgrammaticScroll.current) {
          return;
        }

        // Varias secciones pueden cruzar la franja central a la vez; nos quedamos
        // con la que más superficie tiene dentro (mayor intersectionRatio) en lugar
        // de con la última iterada, que era arbitraria.
        let mostCentered: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (
            mostCentered === null ||
            entry.intersectionRatio > mostCentered.intersectionRatio
          ) {
            mostCentered = entry;
          }
        }

        if (mostCentered === null) {
          return;
        }

        const index = Number(
          (mostCentered.target as HTMLElement).dataset.stageIndex,
        );
        if (!Number.isNaN(index)) {
          setActiveIndex(index);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [stageCount]);

  // Lleva el foco y el scroll a una etapa concreta. Respetamos reduced-motion
  // usando scroll instantáneo, y movemos el foco sin que el navegador haga su
  // propio scroll para no pelear con el nuestro.
  const goToStage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, stageCount - 1));
      // Si ya estamos en la etapa destino no tiene sentido relanzar scroll ni
      // setState. Leemos el índice por ref para no depender de activeIndex aquí.
      if (clamped === activeIndexRef.current) {
        return;
      }

      const section = sectionRefs.current[clamped];
      if (!section) return;

      // Activamos la guarda antes de mover el scroll para que el observer ignore
      // las secciones intermedias del recorrido suave hacia el destino.
      isProgrammaticScroll.current = true;
      if (programmaticScrollTimeout.current !== null) {
        window.clearTimeout(programmaticScrollTimeout.current);
      }

      // El scroll suave termina de forma asíncrona. Soltamos la guarda con el
      // evento scrollend cuando existe, y dejamos un timeout de respaldo (~600ms)
      // para los navegadores que aún no lo emiten.
      const releaseGuard = () => {
        isProgrammaticScroll.current = false;
        if (programmaticScrollTimeout.current !== null) {
          window.clearTimeout(programmaticScrollTimeout.current);
          programmaticScrollTimeout.current = null;
        }
        window.removeEventListener('scrollend', releaseGuard);
      };
      window.addEventListener('scrollend', releaseGuard, { once: true });
      programmaticScrollTimeout.current = window.setTimeout(releaseGuard, 600);

      section.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'center',
      });
      section.focus({ preventScroll: true });
      setActiveIndex(clamped);
    },
    [stageCount],
  );

  // Si el componente se desmonta en mitad de un salto, limpiamos el timeout
  // pendiente para no dejar trabajo programado tras la vida del hook.
  useEffect(() => {
    return () => {
      if (programmaticScrollTimeout.current !== null) {
        window.clearTimeout(programmaticScrollTimeout.current);
      }
    };
  }, []);

  return { activeIndex, registerSection, goToStage };
}
