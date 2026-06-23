import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, ApiRequestError } from '../lib/apiClient';
import type { SectorListItem, SectorsResponse } from '../types/api';
import { resolveClimateTheme } from '../lib/storyVisuals';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

type SectorsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; items: SectorListItem[] };

export default function SectorsPage() {
  const [state, setState] = useState<SectorsState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  // Cargamos la lista liviana de sectores. Cancelamos con un flag para que una
  // respuesta tardía no pise el estado tras desmontar o reintentar.
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    apiGet<SectorsResponse>('/sectors')
      .then((response) => {
        if (cancelled) return;
        setState({ status: 'success', items: response.items });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof ApiRequestError
            ? error.payload.message
            : 'No pudimos cargar los sectores.';
        setState({ status: 'error', message });
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Sectores</h1>
        <p className="text-sm text-slate-400">
          Sectores del workspace. Entra a cada uno para recorrer su historia.
        </p>
      </div>

      {state.status === 'loading' ? (
        <LoadingState label="Cargando sectores…" />
      ) : null}

      {state.status === 'error' ? (
        <ErrorState message={state.message} onRetry={reload} />
      ) : null}

      {state.status === 'success' && state.items.length === 0 ? (
        <EmptyState
          title="Sin sectores"
          message="Este workspace todavía no tiene sectores."
        />
      ) : null}

      {state.status === 'success' && state.items.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.items.map((sector) => (
            <SectorCard key={sector.id} sector={sector} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SectorCard({ sector }: { sector: SectorListItem }) {
  const climateTheme = resolveClimateTheme(sector.climate);

  // Mismo nombre de transición que el título en la página de historia: la View
  // Transition API hace el morph del título de la tarjeta al deep-link cuando hay
  // soporte; sin soporte, React Router navega normal.
  const titleTransitionStyle = {
    viewTransitionName: `sector-title-${sector.id}`,
  } as CSSProperties;

  return (
    <li>
      <Link
        to={`/sectors/${sector.id}/story`}
        viewTransition
        className="flex h-full flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">
            {sector.sectorCode}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {climateTheme.label}
          </span>
        </div>

        <h2
          className="text-lg font-semibold text-slate-100"
          style={titleTransitionStyle}
        >
          {sector.name}
        </h2>

        <dl className="mt-auto grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-slate-800/60 px-2 py-2">
            <dt className="text-slate-500">Carga</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-slate-200">
              {sector.currentLoad}/{sector.capacity}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-800/60 px-2 py-2">
            <dt className="text-slate-500">Estabilidad</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-slate-200">
              {sector.stabilityLevel}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-800/60 px-2 py-2">
            <dt className="text-slate-500">Capacidad</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-slate-200">
              {sector.capacity}
            </dd>
          </div>
        </dl>
      </Link>
    </li>
  );
}
