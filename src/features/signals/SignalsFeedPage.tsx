import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { SeverityBadge } from '../../components/SeverityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { Signal } from '../../types/api';
import type { UseSignalsFeed } from './useSignalsFeed';
import { useInfiniteScroll } from './useInfiniteScroll';
import {
  MAX_QUERY_LENGTH,
  SEVERITY_LABELS,
  SEVERITY_OPTIONS,
  SIGNAL_TYPE_LABELS,
  SIGNAL_TYPE_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  parseSignalsFilters,
} from './signalsQuery';

// El feed recibe TODO su estado del layout por props: así el estado (items, cursor,
// Set de ids) vive en el layout y sobrevive a abrir/cerrar el detalle. La página solo
// pinta y traduce las interacciones (filtros, scroll) a llamadas del hook.
interface SignalsFeedPageProps {
  feed: UseSignalsFeed;
}

// Formatea una fecha ISO a algo legible en español. Si el valor no parsea, lo
// devolvemos crudo en vez de romper el render.
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Tarjeta de una señal en el feed. Es un Link a /signals/:id; al navegar, el layout
// monta el detalle como overlay sin desmontar este feed. Mostramos el tipo (con
// etiqueta legible, no tiene badge), severidad y estado con sus badges, y un extracto
// del contenido crudo.
function SignalCard({ signal }: { signal: Signal }) {
  return (
    <Link
      to={signal.id}
      className="block rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 transition hover:border-emerald-500/40 hover:bg-slate-900/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">
            {SIGNAL_TYPE_LABELS[signal.signalType]}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {signal.tropel.name}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SeverityBadge severity={signal.severity} />
          <StatusBadge status={signal.status} />
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-300">
        {signal.rawContent}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {formatDate(signal.createdAt)}
      </p>
    </Link>
  );
}

// Esqueleto de tarjeta con el mismo alto aproximado que una real, para reservar el
// layout durante la carga inicial y evitar saltos cuando llegan los datos.
function SignalCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-700/60 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="w-1/2 space-y-2">
          <div className="h-4 rounded bg-slate-700/60" />
          <div className="h-3 w-2/3 rounded bg-slate-800" />
        </div>
        <div className="h-5 w-20 rounded-full bg-slate-800" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 rounded bg-slate-800" />
        <div className="h-3 w-4/5 rounded bg-slate-800" />
      </div>
    </div>
  );
}

export default function SignalsFeedPage({ feed }: SignalsFeedPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseSignalsFilters(searchParams);

  // El input de búsqueda se siente inmediato; su valor "estable" (debounced) es el
  // que escribimos a la URL para no pegarle al backend en cada tecla. Inicializamos
  // el input desde la URL (la fuente de verdad) para soportar deep-link con ?q=.
  const [searchInput, setSearchInput] = useState(filters.q ?? '');
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  // Propagamos el valor debounced a la URL solo cuando difiere de lo que ya hay, para
  // no provocar navegaciones redundantes. El cursor NO se toca aquí (no vive en la
  // URL); cambiar `q` dispara el reset del feed vía su filtersKey.
  useEffect(() => {
    const actual = searchParams.get('q') ?? '';
    if (debouncedSearch === actual) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      next.set('q', debouncedSearch);
    } else {
      next.delete('q');
    }
    setSearchParams(next, { replace: true });
    // Solo nos interesa reaccionar al cambio del valor debounced.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Helper para escribir un filtro de selector en la URL. El string vacío significa
  // "sin filtro": borramos la clave para no mandar parámetros vacíos al backend.
  function setSelectFilter(key: 'signalType' | 'severity' | 'status', value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  }

  const {
    items,
    initialStatus,
    initialErrorMessage,
    isLoadingMore,
    loadMoreErrorMessage,
    hasMore,
    loadMore,
    retryInitial,
    retryLoadMore,
  } = feed;

  // El sentinela solo se auto-observa cuando tiene sentido pedir más: feed listo, hay
  // más páginas, no hay una carga en vuelo y no hay un error de loadMore pendiente.
  // Mientras hay error de loadMore dejamos de observar para no spamear: el usuario lo
  // reintenta a mano con el botón.
  const sentinelEnabled =
    initialStatus === 'ready' &&
    hasMore &&
    !isLoadingMore &&
    !loadMoreErrorMessage;

  const sentinelRef = useInfiniteScroll({
    onIntersect: loadMore,
    enabled: sentinelEnabled,
  });

  const hayFiltrosActivos = Boolean(
    filters.signalType || filters.severity || filters.status || filters.q,
  );

  function limpiarFiltros() {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          <span>Buscar</span>
          <input
            type="search"
            value={searchInput}
            maxLength={MAX_QUERY_LENGTH}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Contenido de la señal…"
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500/60"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-400">
          <span>Tipo</span>
          <select
            value={filters.signalType ?? ''}
            onChange={(event) => setSelectFilter('signalType', event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500/60"
          >
            <option value="">Todos</option>
            {SIGNAL_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SIGNAL_TYPE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-400">
          <span>Severidad</span>
          <select
            value={filters.severity ?? ''}
            onChange={(event) => setSelectFilter('severity', event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500/60"
          >
            <option value="">Todas</option>
            {SEVERITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SEVERITY_LABELS[option]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-400">
          <span>Estado</span>
          <select
            value={filters.status ?? ''}
            onChange={(event) => setSelectFilter('status', event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500/60"
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hayFiltrosActivos ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={limpiarFiltros}
            className="text-xs font-medium text-slate-400 underline-offset-2 transition hover:text-emerald-300 hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : null}

      {/* Carga inicial: reservamos el layout con esqueletos para no mover el contenido
          cuando lleguen los datos. */}
      {initialStatus === 'loading' ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <SignalCardSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {initialStatus === 'error' ? (
        <ErrorState
          title="No pudimos cargar el feed"
          message={initialErrorMessage ?? undefined}
          onRetry={retryInitial}
        />
      ) : null}

      {initialStatus === 'ready' && items.length === 0 ? (
        <EmptyState
          title="Sin señales"
          message={
            hayFiltrosActivos
              ? 'No hay señales que coincidan con los filtros activos.'
              : 'Todavía no hay señales en el feed.'
          }
          action={
            hayFiltrosActivos ? (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-1 rounded-md border border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Limpiar filtros
              </button>
            ) : null
          }
        />
      ) : null}

      {initialStatus === 'ready' && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((signal) => (
            <li key={signal.id}>
              <SignalCard signal={signal} />
            </li>
          ))}
        </ul>
      ) : null}

      {/* Zona del sentinela + indicadores de paginado. Solo aplica con el feed listo y
          al menos un item. El sentinela en sí es un div invisible que el observer
          vigila; cuando entra al viewport, dispara loadMore. */}
      {initialStatus === 'ready' && items.length > 0 ? (
        <div className="py-2">
          {isLoadingMore ? (
            <p className="text-center text-sm text-slate-400">
              Cargando más señales…
            </p>
          ) : null}

          {loadMoreErrorMessage ? (
            <div className="flex flex-col items-center gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-center">
              <p className="text-sm text-red-300">{loadMoreErrorMessage}</p>
              <button
                type="button"
                onClick={retryLoadMore}
                className="rounded-md border border-red-500/40 px-3 py-1 text-xs font-medium text-red-200 transition hover:bg-red-500/10"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {!hasMore && !loadMoreErrorMessage ? (
            <p className="text-center text-xs text-slate-500">Fin del feed</p>
          ) : null}

          {/* El sentinela solo se monta mientras hay más por cargar y sin error; así
              el observer deja de vigilar al llegar al final o ante un error. */}
          {hasMore && !loadMoreErrorMessage ? (
            <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
