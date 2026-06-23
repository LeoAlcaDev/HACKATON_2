import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ErrorState } from '../../components/ErrorState';
import { SeverityBadge } from '../../components/SeverityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import type { SignalStatusUpdate } from '../../types/api';
import type { SignalsOutletContext } from './signalsContext';
import { useSignalDetail } from './useSignalDetail';
import { useUpdateSignalStatus } from './useUpdateSignalStatus';
import { SIGNAL_TYPE_LABELS } from './signalsQuery';

// Formatea una fecha ISO a algo legible en español; si no parsea, la devolvemos cruda.
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Fila etiqueta/valor del panel de detalle. Centraliza el espaciado para no repetirlo.
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="text-sm text-slate-200">{children}</div>
    </div>
  );
}

export default function SignalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // El detalle consume del contexto del Outlet la función para reflejar el nuevo
  // estado en el feed tras un PATCH exitoso, sin recargar la lista. Es el único puente
  // con el estado del feed, que vive en el layout.
  const { actualizarEstadoEnFeed } = useOutletContext<SignalsOutletContext>();

  const detail = useSignalDetail(id);
  const update = useUpdateSignalStatus();

  // Recordamos el estado que el usuario intentó aplicar para que el botón de
  // reintento reenvíe exactamente la misma transición, no una derivada del estado
  // actual (que ante el error no cambió).
  const [ultimoIntento, setUltimoIntento] = useState<SignalStatusUpdate | null>(
    null,
  );

  // Cerrar el panel navega de vuelta a /signals: el feed sigue intacto detrás porque
  // nunca se desmontó (vive en el layout).
  function cerrar() {
    navigate('/signals');
  }

  // El Signal vigente es el que mantiene el hook del detalle: parte del GET y, tras
  // un PATCH exitoso, lo reemplazamos con el Signal devuelto vía detail.setSignal.
  const signal = detail.data;

  async function cambiarEstado(nuevoEstado: SignalStatusUpdate) {
    if (!id) {
      return;
    }
    setUltimoIntento(nuevoEstado);
    // PATCH PESIMISTA: no cambiamos el estado mostrado hasta que el backend confirma.
    // El hook deja `updating` en vuelo (la UI deshabilita los botones) y solo al
    // éxito reflejamos el Signal devuelto (en el detalle y en el feed).
    const updated = await update.updateStatus(id, nuevoEstado);
    if (updated) {
      detail.setSignal(updated);
      actualizarEstadoEnFeed(updated.id, updated.status);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop: clic fuera del panel lo cierra. position fixed para quedar encima
          del feed sin afectar su scroll ni su layout. */}
      <button
        type="button"
        aria-label="Cerrar detalle"
        onClick={cerrar}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      {/* Drawer lateral derecho. relative para quedar sobre el backdrop; el contenido
          scrollea de forma independiente al feed. */}
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-slate-800 bg-slate-900 shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-100">
            Detalle de la señal
          </h2>
          <button
            type="button"
            onClick={cerrar}
            className="rounded-md px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
          >
            Cerrar
          </button>
        </header>

        <div className="flex-1 px-5 py-5">
          {detail.status === 'loading' ? (
            <div className="space-y-4">
              <div className="h-5 w-1/2 animate-pulse rounded bg-slate-800" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-800" />
              <div className="h-24 animate-pulse rounded bg-slate-800" />
            </div>
          ) : null}

          {detail.status === 'error' ? (
            <ErrorState
              title="No pudimos cargar la señal"
              message={detail.errorMessage ?? undefined}
              onRetry={detail.refetch}
            />
          ) : null}

          {detail.status === 'success' && signal ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={signal.severity} />
                <StatusBadge status={signal.status} />
              </div>

              <DetailRow label="Tipo de señal">
                {SIGNAL_TYPE_LABELS[signal.signalType]}
              </DetailRow>

              <DetailRow label="Tropel">
                <span className="text-slate-100">{signal.tropel.name}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {signal.tropel.species}
                </span>
              </DetailRow>

              <DetailRow label="Contenido">
                <p className="whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300">
                  {signal.rawContent}
                </p>
              </DetailRow>

              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Creada">
                  <span className="text-xs text-slate-400">
                    {formatDate(signal.createdAt)}
                  </span>
                </DetailRow>
                <DetailRow label="Actualizada">
                  <span className="text-xs text-slate-400">
                    {formatDate(signal.updatedAt)}
                  </span>
                </DetailRow>
              </div>

              {/* Acciones de estado. Solo PROCESANDO y ATENDIDA: el PATCH no acepta
                  RECIBIDA. Deshabilitamos el botón que coincide con el estado actual y,
                  durante el PATCH pesimista, ambos. */}
              <div className="space-y-3 border-t border-slate-800 pt-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Cambiar estado
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => cambiarEstado('PROCESANDO')}
                    disabled={
                      update.isUpdating || signal.status === 'PROCESANDO'
                    }
                    className="rounded-md border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Marcar como PROCESANDO
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarEstado('ATENDIDA')}
                    disabled={
                      update.isUpdating || signal.status === 'ATENDIDA'
                    }
                    className="rounded-md border border-emerald-500/40 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Marcar como ATENDIDA
                  </button>
                </div>

                {update.status === 'updating' ? (
                  <p className="text-sm text-slate-400">Actualizando…</p>
                ) : null}

                {update.status === 'success' ? (
                  <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-300">
                    Estado actualizado correctamente.
                  </p>
                ) : null}

                {update.status === 'error' ? (
                  <div className="flex flex-col items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2">
                    <p className="text-sm text-red-300">
                      {update.errorMessage}
                    </p>
                    {ultimoIntento ? (
                      <button
                        type="button"
                        onClick={() => cambiarEstado(ultimoIntento)}
                        className="rounded-md border border-red-500/40 px-3 py-1 text-xs font-medium text-red-200 transition hover:bg-red-500/10"
                      >
                        Reintentar
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
