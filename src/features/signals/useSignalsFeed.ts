import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, ApiRequestError } from '../../lib/apiClient';
import { FEED_LIMIT_DEFAULT } from '../../types/api';
import type {
  Signal,
  SignalFeedResponse,
  SignalStatus,
} from '../../types/api';
import { buildFiltersKey } from './signalsQuery';
import type { SignalsFilters } from './signalsQuery';

// Traducimos el error a un mensaje legible una sola vez aquí, para que la página no
// tenga que conocer la forma de ApiRequestError. Si es un error tipado del backend
// usamos su `message`; cualquier otra cosa (red caída, parseo) cae a un genérico.
function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.payload.message;
  }
  return 'No pudimos cargar el feed de señales. Revisa tu conexión e inténtalo de nuevo.';
}

// Estado de la PRIMERA página, modelado con una unión sobre `status` para no cruzar
// flags que se contradigan. El detalle del paginado (items, cursor, loadMore) vive
// aparte porque tiene su propio ciclo de vida.
type InitialStatus = 'loading' | 'error' | 'ready';

export interface UseSignalsFeed {
  items: Signal[];
  // Estado de la carga inicial (primera página tras un reset por filtros).
  initialStatus: InitialStatus;
  initialErrorMessage: string | null;
  // Estado de las cargas posteriores (scroll infinito).
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
  hasMore: boolean;
  totalEstimate: number;
  // Disparadores: el sentinela llama a loadMore; los botones de reintento llaman a
  // retryInitial / retryLoadMore.
  loadMore: () => void;
  retryInitial: () => void;
  retryLoadMore: () => void;
  // Puente hacia el detalle: actualiza el estado de una señal ya pintada en el feed
  // tras un PATCH exitoso, sin recargar la lista.
  actualizarEstadoEnFeed: (id: string, nuevoEstado: SignalStatus) => void;
}

// Hook que maneja TODO el estado del feed. Vive en el layout (no en la página) a
// propósito: el layout no se desmonta al abrir el detalle, así que items, cursor,
// Set de ids vistos y posición de scroll sobreviven a abrir/cerrar el panel.
export function useSignalsFeed(filters: SignalsFilters): UseSignalsFeed {
  const [items, setItems] = useState<Signal[]>([]);
  const [initialStatus, setInitialStatus] = useState<InitialStatus>('loading');
  const [initialErrorMessage, setInitialErrorMessage] = useState<string | null>(
    null,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<
    string | null
  >(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalEstimate, setTotalEstimate] = useState(0);

  // Cursor de la siguiente página. Es estado INTERNO (no va a la URL) porque el
  // backend lo rechaza si se combina con filtros distintos a los que lo generaron.
  const nextCursorRef = useRef<string | null>(null);

  // Set de ids ya pintados para deduplicar. El backend puede devolver solapamientos
  // entre páginas y nunca queremos pintar el mismo id dos veces.
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Token de "grupo de filtros". Se incrementa en cada reset (cambio de filtros o
  // retryInitial). Toda request guarda el token con el que arrancó; al resolver, si
  // su token ya no es el actual, descartamos su resultado. Así una página en vuelo
  // con filtros viejos nunca pinta items que ya no corresponden.
  const filtersTokenRef = useRef(0);

  // Guardia de una-sola-carga-en-vuelo. Es un ref (no estado) para leerlo de forma
  // síncrona dentro de loadMore y no disparar dos peticiones por renders rápidos.
  const isLoadingMoreRef = useRef(false);

  // Espejo en ref de los filtros, para que fetchNextPage lea los valores frescos sin
  // tener que figurar entre sus dependencias (lo que lo recrearía en cada render).
  const filtersRef = useRef<SignalsFilters>(filters);
  filtersRef.current = filters;

  // Espejos en ref de hasMore y del error de loadMore. fetchNextPage los consulta de
  // forma síncrona en su guardia; con refs evitamos recrear el callback (y reabrir el
  // observer) cada vez que estos cambian.
  const hasMoreRef = useRef(false);
  hasMoreRef.current = hasMore;
  const loadMoreErrorRef = useRef<string | null>(null);
  loadMoreErrorRef.current = loadMoreErrorMessage;

  // Tokens de reintento. Cada uno dispara su propio effect: retryInitial recarga
  // desde cero; retryLoadMore reintenta el MISMO cursor sin tocar items.
  const [reloadInitialToken, setReloadInitialToken] = useState(0);
  const [loadMoreRetryToken, setLoadMoreRetryToken] = useState(0);

  const filtersKey = buildFiltersKey(filters);

  // Concatena una página deduplicando por id, actualiza cursor/hasMore/total. La
  // extraemos para reusarla desde la carga inicial y el scroll infinito sin repetir
  // la lógica del Set. Como solo usa refs y setters estables, no tiene dependencias.
  const appendPage = useCallback((page: SignalFeedResponse) => {
    const nuevos = page.items.filter(
      (item) => !seenIdsRef.current.has(item.id),
    );
    for (const item of nuevos) {
      seenIdsRef.current.add(item.id);
    }
    setItems((previos) => [...previos, ...nuevos]);
    nextCursorRef.current = page.nextCursor;
    setHasMore(page.hasMore);
    setTotalEstimate(page.totalEstimate);
  }, []);

  // Carga la SIGUIENTE página usando el cursor actual y concatena. Tanto el scroll
  // infinito como el reintento de loadMore pasan por aquí. Es estable (solo refs y
  // appendPage) para no reconstruir el observer del sentinela en cada render.
  const fetchNextPage = useCallback(() => {
    // Triple guardia: no cargamos si ya hay una en vuelo, si no hay más páginas o si
    // hay un error de loadMore pendiente de reintento explícito.
    if (
      isLoadingMoreRef.current ||
      !hasMoreRef.current ||
      loadMoreErrorRef.current
    ) {
      return;
    }

    const token = filtersTokenRef.current;
    const activos = filtersRef.current;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreErrorMessage(null);

    apiGet<SignalFeedResponse>('/signals/feed', {
      query: {
        cursor: nextCursorRef.current ?? undefined,
        limit: FEED_LIMIT_DEFAULT,
        signalType: activos.signalType,
        severity: activos.severity,
        status: activos.status,
        q: activos.q,
      },
    })
      .then((page) => {
        // Si mientras la petición viajaba cambiaron los filtros (o se reinició), su
        // resultado ya no corresponde: lo descartamos sin tocar el estado.
        if (token !== filtersTokenRef.current) {
          return;
        }
        appendPage(page);
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      })
      .catch((error: unknown) => {
        if (token !== filtersTokenRef.current) {
          return;
        }
        // Error en una página POSTERIOR: conservamos lo ya cargado y mostramos el
        // mensaje con botón de reintento. El cursor NO se mueve, así el reintento
        // vuelve a pedir exactamente la misma página.
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
        setLoadMoreErrorMessage(describeError(error));
      });
  }, [appendPage]);

  // RESET TOTAL + carga de la primera página. Se dispara al cambiar los filtros o al
  // pedir retryInitial: incrementamos el token (invalidando cualquier request en
  // vuelo), vaciamos items, descartamos cursor y limpiamos el Set.
  useEffect(() => {
    const token = filtersTokenRef.current + 1;
    filtersTokenRef.current = token;

    seenIdsRef.current = new Set();
    nextCursorRef.current = null;
    isLoadingMoreRef.current = false;

    setItems([]);
    setHasMore(false);
    setTotalEstimate(0);
    setIsLoadingMore(false);
    setLoadMoreErrorMessage(null);
    setInitialErrorMessage(null);
    setInitialStatus('loading');

    const controller = new AbortController();
    const activos = filtersRef.current;

    apiGet<SignalFeedResponse>('/signals/feed', {
      query: {
        limit: FEED_LIMIT_DEFAULT,
        signalType: activos.signalType,
        severity: activos.severity,
        status: activos.status,
        q: activos.q,
      },
      signal: controller.signal,
    })
      .then((page) => {
        // Mismo guardia por token que en las páginas posteriores: si el grupo de
        // filtros cambió, este resultado quedó obsoleto.
        if (token !== filtersTokenRef.current) {
          return;
        }
        for (const item of page.items) {
          seenIdsRef.current.add(item.id);
        }
        setItems(page.items);
        nextCursorRef.current = page.nextCursor;
        setHasMore(page.hasMore);
        setTotalEstimate(page.totalEstimate);
        setInitialStatus('ready');
      })
      .catch((error: unknown) => {
        // Un abort no es un error real: significa que cambiaron los filtros y este
        // effect se reemplazó por otro. No tocamos el estado.
        if (controller.signal.aborted || token !== filtersTokenRef.current) {
          return;
        }
        setInitialErrorMessage(describeError(error));
        setInitialStatus('error');
      });

    return () => {
      // Abortamos la request inicial en vuelo al cambiar de filtros para no pintar
      // resultados viejos; el token igual la descartaría, pero abortar ahorra red.
      controller.abort();
    };
    // filtersKey resume la combinación de filtros; reloadInitialToken lo dispara el
    // reintento de la primera página. Leemos los valores de filtros vía filtersRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, reloadInitialToken]);

  // Reintento de loadMore: limpiamos el error y reejecutamos fetchNextPage con el
  // MISMO cursor. Vía effect (en vez de llamar directo) para que el guardia que mira
  // loadMoreErrorRef vea el error ya limpio en el siguiente render.
  useEffect(() => {
    if (loadMoreRetryToken === 0) {
      return;
    }
    setLoadMoreErrorMessage(null);
    fetchNextPage();
    // Solo reaccionamos al token de reintento; fetchNextPage es estable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMoreRetryToken]);

  const loadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const retryInitial = useCallback(() => {
    setReloadInitialToken((token) => token + 1);
  }, []);

  const retryLoadMore = useCallback(() => {
    setLoadMoreRetryToken((token) => token + 1);
  }, []);

  // Actualiza in situ el estado de una señal ya pintada, sin recargar. Lo llama el
  // detalle tras un PATCH exitoso a través del contexto del Outlet, para que al
  // cerrar el panel la tarjeta muestre el estado nuevo.
  const actualizarEstadoEnFeed = useCallback(
    (id: string, nuevoEstado: SignalStatus) => {
      setItems((previos) =>
        previos.map((item) =>
          item.id === id ? { ...item, status: nuevoEstado } : item,
        ),
      );
    },
    [],
  );

  return {
    items,
    initialStatus,
    initialErrorMessage,
    isLoadingMore,
    loadMoreErrorMessage,
    hasMore,
    totalEstimate,
    loadMore,
    retryInitial,
    retryLoadMore,
    actualizarEstadoEnFeed,
  };
}
