import { useCallback, useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  // Se invoca cuando el sentinela entra en el viewport (o en el root). El caller
  // decide qué hacer; aquí solo detectamos la intersección.
  onIntersect: () => void;
  // Mientras sea false NO observamos. El feed lo apaga cuando no hay más páginas,
  // mientras una carga está en vuelo o cuando hay un error pendiente de reintento,
  // para no disparar cargas de más ni spamear el backend.
  enabled: boolean;
  // Contenedor con scroll propio si el feed no scrollea con la ventana. Por defecto
  // (null) el observer usa el viewport.
  root?: Element | null;
}

// Hook genérico de scroll infinito. Devuelve un callback ref para colgar en el
// elemento sentinela del final de la lista. Usamos IntersectionObserver en vez de
// escuchar el evento scroll porque es más barato y no requiere medir posiciones a
// mano. Guardamos onIntersect en un ref para que cambiar el callback (que el feed
// recrea en cada render) no obligue a reconstruir el observer.
export function useInfiniteScroll({
  onIntersect,
  enabled,
  root = null,
}: UseInfiniteScrollOptions): (node: Element | null) => void {
  const onIntersectRef = useRef(onIntersect);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<Element | null>(null);

  // Mantenemos la referencia al callback siempre fresca sin recrear el observer.
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  // Crea (o recrea) el observer sobre el sentinela actual. Lo concentramos en una
  // función para reutilizarla tanto cuando cambia el nodo como cuando cambia
  // `enabled`. Siempre desconectamos el observer anterior antes de crear uno nuevo.
  const observe = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const sentinel = sentinelRef.current;
    // Si está deshabilitado o no hay sentinela montado, no observamos nada: así el
    // feed corta la carga automática cuando no hay más páginas o hay un error.
    if (!enabled || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          onIntersectRef.current();
        }
      },
      { root, rootMargin: '200px' },
    );
    observer.observe(sentinel);
    observerRef.current = observer;
  }, [enabled, root]);

  // Callback ref: React nos entrega el nodo del sentinela cuando se monta y null
  // cuando se desmonta. Guardamos el nodo y (re)observamos en cada cambio.
  const sentinelCallbackRef = useCallback(
    (node: Element | null) => {
      sentinelRef.current = node;
      observe();
    },
    [observe],
  );

  // Cuando cambia `enabled` (o el root) reevaluamos la observación sin esperar a que
  // el sentinela se vuelva a montar.
  useEffect(() => {
    observe();
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [observe]);

  return sentinelCallbackRef;
}
