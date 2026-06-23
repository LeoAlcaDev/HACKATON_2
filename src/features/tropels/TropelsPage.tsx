import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  Species,
  TropelSize,
  TropelSort,
  VitalState,
} from '../../types/api';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useTropels } from './useTropels';
import { useSectors } from './useSectors';
import {
  DEFAULT_SORT,
  MAX_QUERY_LENGTH,
  parseTropelsSearchParams,
} from './tropelsQuery';
import type { TropelsUrlState } from './tropelsQuery';
import { TropelsFilters } from './components/TropelsFilters';
import {
  TropelsTable,
  TropelsTableSkeleton,
} from './components/TropelsTable';
import { TropelsPagination } from './components/TropelsPagination';

// Construye el objeto plano de searchParams a partir del estado canónico. Omitimos
// los campos opcionales ausentes y, además, no escribimos los valores por defecto
// (page 0, size 20, sort updatedAt,desc) para mantener la URL limpia: el parser
// los repone igual al leer. Así una vista "sin filtros" tiene una URL minimalista.
function stateToSearchParams(state: TropelsUrlState): Record<string, string> {
  const params: Record<string, string> = {};

  if (state.page > 0) {
    params.page = String(state.page);
  }
  if (state.size !== 20) {
    params.size = String(state.size);
  }
  if (state.species) {
    params.species = state.species;
  }
  if (state.vitalState) {
    params.vitalState = state.vitalState;
  }
  if (state.sectorId) {
    params.sectorId = state.sectorId;
  }
  if (state.q) {
    params.q = state.q;
  }
  if (state.sort !== DEFAULT_SORT) {
    params.sort = state.sort;
  }

  return params;
}

export default function TropelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // La URL es la ÚNICA fuente de verdad. La parseamos a un estado canónico ya
  // validado en cada render; recargar o abrir la URL en otra pestaña restaura
  // exactamente este mismo estado.
  const urlState = parseTropelsSearchParams(searchParams);

  // Helper para escribir un parche del estado a la URL. Cualquier cambio de filtro
  // (excepto la paginación) resetea page a 0, porque al cambiar los criterios la
  // página anterior deja de tener sentido. `replace` evita llenar el historial con
  // cada tecleo o ajuste de filtro.
  const updateUrl = useCallback(
    (patch: Partial<TropelsUrlState>, resetPage: boolean) => {
      const next: TropelsUrlState = {
        ...parseTropelsSearchParams(searchParams),
        ...patch,
      };
      if (resetPage) {
        next.page = 0;
      }
      setSearchParams(stateToSearchParams(next), { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // El input de búsqueda es estado LOCAL para que se sienta inmediato al teclear.
  // Lo inicializamos con lo que haya en la URL para que al recargar el cuadro de
  // texto muestre la búsqueda activa.
  const [searchInput, setSearchInput] = useState<string>(urlState.q ?? '');

  // El valor debounced (~350 ms) es el que sincronizamos a la URL. El flujo es:
  // input local -> useDebouncedValue -> effect que escribe a la URL -> useTropels
  // lee la URL. Así no le pegamos al backend en cada tecla, pero el filtro de
  // búsqueda sigue viviendo en la URL como el resto.
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  useEffect(() => {
    // Normalizamos a undefined cuando el campo queda vacío, para que el parámetro
    // q desaparezca de la URL en lugar de quedar como ?q=.
    const normalized = debouncedSearch.trim() === '' ? undefined : debouncedSearch;

    // Solo tocamos la URL si el valor debounced difiere de lo que ya hay en ella.
    // Sin este guardia, el effect reescribiría la URL en cada render del padre y
    // podría pelearse con la navegación del usuario (p. ej. botón atrás).
    if (normalized !== urlState.q) {
      updateUrl({ q: normalized }, true);
    }
    // Dependemos solo del valor debounced y del q actual de la URL; updateUrl ya
    // captura searchParams/setSearchParams de forma estable por render.
  }, [debouncedSearch, urlState.q, updateUrl]);

  const { sectors, status: sectorsStatus } = useSectors();
  const { status, data, errorMessage, refetch } = useTropels(urlState);

  function handleSpeciesChange(value: Species | undefined): void {
    updateUrl({ species: value }, true);
  }

  function handleVitalStateChange(value: VitalState | undefined): void {
    updateUrl({ vitalState: value }, true);
  }

  function handleSectorChange(value: string | undefined): void {
    updateUrl({ sectorId: value }, true);
  }

  function handleSortChange(value: TropelSort): void {
    updateUrl({ sort: value }, true);
  }

  function handleSizeChange(value: TropelSize): void {
    updateUrl({ size: value }, true);
  }

  // La paginación es el único cambio que NO resetea la página: ajusta page directo.
  function goToPage(page: number): void {
    updateUrl({ page }, false);
  }

  // Limpiar filtros vuelve a la URL base y vacía también el input local de búsqueda
  // (que no vive en la URL hasta que pasa el debounce).
  function clearFilters(): void {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  }

  const isLoading = status === 'loading';
  const isError = status === 'error';
  const hasResults = data !== null && data.content.length > 0;
  const isEmpty = status === 'success' && data !== null && data.content.length === 0;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">
          Atlas de Tropeles
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Lista paginada del servidor con filtros combinables, búsqueda y orden.
          El estado vive en la URL: puedes compartirla o recargar sin perderlo.
        </p>
      </header>

      <TropelsFilters
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        maxQueryLength={MAX_QUERY_LENGTH}
        species={urlState.species}
        onSpeciesChange={handleSpeciesChange}
        vitalState={urlState.vitalState}
        onVitalStateChange={handleVitalStateChange}
        sectorId={urlState.sectorId}
        onSectorChange={handleSectorChange}
        sectors={sectors}
        sectorsLoading={sectorsStatus === 'loading'}
        sort={urlState.sort}
        onSortChange={handleSortChange}
        size={urlState.size}
        onSizeChange={handleSizeChange}
      />

      {/* Reservamos el alto del área de la tabla con min-height para que el layout
          no salte entre los estados de cargar, error, vacío y con datos. El
          esqueleto usa tantas filas como el size elegido para aproximar el alto
          real de una página llena. */}
      <div className="min-h-[28rem] overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/40">
        {isError ? (
          <div className="p-6">
            <ErrorState message={errorMessage ?? undefined} onRetry={refetch} />
          </div>
        ) : isLoading ? (
          <TropelsTableSkeleton rows={urlState.size} />
        ) : isEmpty ? (
          <div className="p-6">
            <EmptyState
              title="Sin tropeles"
              message="Ningún tropel coincide con los filtros actuales."
              action={
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-1 rounded-md border border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  Limpiar filtros
                </button>
              }
            />
          </div>
        ) : hasResults ? (
          <TropelsTable tropels={data.content} />
        ) : null}
      </div>

      {/* La paginación solo tiene sentido cuando hay datos cargados; usamos los
          contadores de la respuesta (no del estado local) como fuente de verdad. */}
      {data !== null ? (
        <TropelsPagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onPrev={() => goToPage(data.currentPage - 1)}
          onNext={() => goToPage(data.currentPage + 1)}
        />
      ) : null}
    </section>
  );
}
