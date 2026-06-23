import { useCallback, useEffect, useState } from 'react';
import { apiGet, ApiRequestError } from '../../lib/apiClient';
import type { DashboardSummary } from '../../types/api';

// Estado discriminado del resumen del dashboard. Lo modelamos con una unión sobre
// `status` para que la página renderice cada caso sin tener que cruzar flags
// booleanos (isLoading + error + data) que pueden contradecirse entre sí.
export type DashboardSummaryState =
  | { status: 'loading'; data: null; errorMessage: null }
  | { status: 'error'; data: null; errorMessage: string }
  | { status: 'success'; data: DashboardSummary; errorMessage: null };

export interface UseDashboardSummary {
  status: DashboardSummaryState['status'];
  data: DashboardSummary | null;
  errorMessage: string | null;
  refetch: () => void;
}

const LOADING_STATE: DashboardSummaryState = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

// Traducimos el error a un mensaje legible una sola vez aquí, para que la página
// no tenga que conocer la forma de ApiRequestError. Si es un error tipado del
// backend usamos su `message`; si fue cualquier otra cosa (red caída, parseo)
// damos un genérico en español.
function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.payload.message;
  }
  return 'No pudimos cargar el resumen del workspace. Revisa tu conexión e inténtalo de nuevo.';
}

// Encapsula el fetch de GET /dashboard/summary. Usamos un AbortController y lo
// cancelamos en el cleanup del effect para no intentar setear estado después de
// desmontar (o tras disparar un refetch que reemplaza la petición en vuelo). El
// contador `reloadToken` es el disparador del refetch: al incrementarlo volvemos
// a ejecutar el effect desde cero.
export function useDashboardSummary(): UseDashboardSummary {
  const [state, setState] = useState<DashboardSummaryState>(LOADING_STATE);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    // Cada ejecución del effect arranca en loading para que el reintento muestre
    // el skeleton de nuevo en vez de quedarse con el error anterior en pantalla.
    setState(LOADING_STATE);

    apiGet<DashboardSummary>('/dashboard/summary', {
      signal: controller.signal,
    })
      .then((summary) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({ status: 'success', data: summary, errorMessage: null });
      })
      .catch((error: unknown) => {
        // Un abort no es un error real para la UI: significa que desmontamos o
        // que ya hay otra petición en curso, así que no tocamos el estado.
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: 'error',
          data: null,
          errorMessage: describeError(error),
        });
      });

    return () => {
      controller.abort();
    };
  }, [reloadToken]);

  return {
    status: state.status,
    data: state.data,
    errorMessage: state.errorMessage,
    refetch,
  };
}
