import { useEffect, useState } from 'react';
import { apiGet, ApiRequestError } from '../../lib/apiClient';
import type { SectorListItem, SectorsResponse } from '../../types/api';

// Estado discriminado de la carga de sectores. Lo modelamos con una unión sobre
// `status` para que el selector no tenga que cruzar flags booleanos que podrían
// contradecirse (cargando + con datos + con error a la vez).
export type SectorsState =
  | { status: 'loading'; sectors: readonly SectorListItem[]; errorMessage: null }
  | { status: 'error'; sectors: readonly SectorListItem[]; errorMessage: string }
  | { status: 'success'; sectors: readonly SectorListItem[]; errorMessage: null };

export interface UseSectors {
  status: SectorsState['status'];
  sectors: readonly SectorListItem[];
  errorMessage: string | null;
}

function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.payload.message;
  }
  return 'No pudimos cargar la lista de sectores para el filtro.';
}

// Carga GET /sectors UNA sola vez (effect con dependencias vacías) para poblar el
// selector de sector del Atlas. La lista de sectores es estable durante la sesión,
// así que no la re-pedimos en cada cambio de filtro: la traemos al montar y la
// reutilizamos. Si falla, devolvemos la lista vacía y un mensaje; el selector
// simplemente se queda sin opciones de sector, sin romper el resto de filtros.
export function useSectors(): UseSectors {
  const [state, setState] = useState<SectorsState>({
    status: 'loading',
    sectors: [],
    errorMessage: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    apiGet<SectorsResponse>('/sectors', { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: 'success',
          sectors: response.items,
          errorMessage: null,
        });
      })
      .catch((error: unknown) => {
        // Un abort ocurre si el componente se desmonta antes de resolver: no es un
        // error real para la UI, así que dejamos el estado como está.
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: 'error',
          sectors: [],
          errorMessage: describeError(error),
        });
      });

    return () => {
      controller.abort();
    };
  }, []);

  return {
    status: state.status,
    sectors: state.sectors,
    errorMessage: state.errorMessage,
  };
}
