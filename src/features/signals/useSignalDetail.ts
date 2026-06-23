import { useCallback, useEffect, useState } from 'react';
import { apiGet, ApiRequestError } from '../../lib/apiClient';
import type { Signal } from '../../types/api';

// Traducimos el error a un mensaje legible una sola vez aquí. Si es un error tipado
// del backend usamos su `message`; cualquier otra cosa cae a un genérico.
function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.payload.message;
  }
  return 'No pudimos cargar el detalle de la señal. Revisa tu conexión e inténtalo de nuevo.';
}

// Estado discriminado del detalle, con su PROPIO loading/error (independientes del
// feed). Modelarlo como unión sobre `status` evita cruzar flags que se contradigan.
export type SignalDetailState =
  | { status: 'loading'; data: null; errorMessage: null }
  | { status: 'error'; data: null; errorMessage: string }
  | { status: 'success'; data: Signal; errorMessage: null };

export interface UseSignalDetail {
  status: SignalDetailState['status'];
  data: Signal | null;
  errorMessage: string | null;
  // Permite que la página refleje el Signal devuelto por el PATCH sin volver a pedir
  // el GET: actualizamos el detalle ya cargado con el estado nuevo.
  setSignal: (signal: Signal) => void;
  refetch: () => void;
}

const LOADING_STATE: SignalDetailState = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

// Encapsula GET /signals/:id. Usa un AbortController que cancelamos en el cleanup
// para no setear estado tras desmontar o tras cambiar de :id (deep-link entre
// señales). El reintento incrementa reloadToken para reejecutar el effect.
export function useSignalDetail(id: string | undefined): UseSignalDetail {
  const [state, setState] = useState<SignalDetailState>(LOADING_STATE);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  // Refleja el Signal del PATCH en el detalle ya cargado. Solo aplica si estamos en
  // success; si no hay datos aún, no hay nada que mezclar.
  const setSignal = useCallback((signal: Signal) => {
    setState({ status: 'success', data: signal, errorMessage: null });
  }, []);

  useEffect(() => {
    // Sin id no hay nada que pedir. No debería pasar bajo la ruta :id, pero el tipo
    // de useParams es opcional y lo manejamos para no romper el contrato.
    if (!id) {
      return;
    }

    const controller = new AbortController();

    // Cada ejecución arranca en loading para que el reintento (o el cambio de :id)
    // muestre la carga de nuevo en vez de quedarse con el error o el dato anterior.
    setState(LOADING_STATE);

    apiGet<Signal>(`/signals/${id}`, { signal: controller.signal })
      .then((signal) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({ status: 'success', data: signal, errorMessage: null });
      })
      .catch((error: unknown) => {
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
  }, [id, reloadToken]);

  return {
    status: state.status,
    data: state.data,
    errorMessage: state.errorMessage,
    setSignal,
    refetch,
  };
}
