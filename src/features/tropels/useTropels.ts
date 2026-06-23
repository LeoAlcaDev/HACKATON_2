import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, ApiRequestError } from '../../lib/apiClient';
// El DTO de la respuesta paginada se llama `TropelsPage` en el contrato, igual que
// nuestro componente de página. Para evitar la colisión de nombres lo importamos
// con alias `TropelsResponse`.
import type { TropelsPage as TropelsResponse } from '../../types/api';
import type { TropelsUrlState } from './tropelsQuery';

// Estado discriminado de la lista de tropeles. La unión sobre `status` evita que
// la página tenga que combinar flags booleanos que pueden contradecirse entre sí.
export type TropelsListState =
  | { status: 'loading'; data: TropelsResponse | null; errorMessage: null }
  | { status: 'error'; data: TropelsResponse | null; errorMessage: string }
  | { status: 'success'; data: TropelsResponse; errorMessage: null };

export interface UseTropels {
  status: TropelsListState['status'];
  data: TropelsResponse | null;
  errorMessage: string | null;
  refetch: () => void;
}

function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.payload.message;
  }
  return 'No pudimos cargar el listado de tropeles. Revisa tu conexión e inténtalo de nuevo.';
}

// Recibe el estado ya validado de la URL y hace el fetch paginado de /tropels. La
// URL es la única fuente de verdad: cualquier cambio de filtro, orden, página o
// tamaño llega aquí como un nuevo `query` y dispara el effect.
//
// Protección contra respuestas obsoletas (el "race" clásico de búsquedas y
// filtros rápidos): combinamos DOS mecanismos.
//   1. AbortController: el cleanup del effect aborta la request en vuelo cuando el
//      query cambia o el componente se desmonta. Esto evita trabajo de red inútil
//      y, en muchos casos, que la promesa anterior llegue a resolver.
//   2. Guardia de secuencia con un id incremental en un useRef: por sí solo el
//      abort no basta, porque una promesa ya iniciada puede resolver igual antes
//      de que el navegador procese la cancelación. Por eso, en cada disparo
//      incrementamos `requestIdRef` y capturamos ese id en una constante local; al
//      resolver, solo pintamos el resultado si su id sigue siendo el último. Así,
//      si una request lenta y antigua llega DESPUÉS de una más nueva, la
//      descartamos y nunca sobrescribe datos frescos con datos viejos.
export function useTropels(query: TropelsUrlState): UseTropels {
  const [state, setState] = useState<TropelsListState>({
    status: 'loading',
    data: null,
    errorMessage: null,
  });

  // Contador monótono del id de request más reciente. Vive en un ref para que su
  // valor sobreviva entre renders sin provocar re-renders al cambiar.
  const requestIdRef = useRef(0);

  // Token de recarga manual: incrementarlo vuelve a ejecutar el effect aunque la
  // URL no haya cambiado (lo usa el botón "Reintentar" del estado de error).
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  // Desestructuramos los campos del query para que el array de dependencias del
  // effect sea explícito por valor. Si dependiéramos del objeto `query` completo,
  // una nueva referencia con los mismos valores volvería a disparar el fetch sin
  // necesidad.
  const { page, size, species, vitalState, sectorId, q, sort } = query;

  useEffect(() => {
    const controller = new AbortController();

    // Reservamos el siguiente id de secuencia para ESTA request y lo capturamos en
    // una constante local del closure. Es la pieza central del guardia: cada
    // resolución compara su propio id capturado contra el último id global.
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    // Cada disparo arranca en loading para que el reintento y los cambios de filtro
    // muestren el skeleton en vez de quedarse con el error o los datos anteriores.
    setState((previous) => ({
      status: 'loading',
      data: previous.data,
      errorMessage: null,
    }));

    apiGet<TropelsResponse>('/tropels', {
      query: { page, size, species, vitalState, sectorId, q, sort },
      signal: controller.signal,
    })
      .then((response) => {
        // Descartamos la respuesta si ya no es la última en vuelo o si esta misma
        // request fue abortada. Sin esta comparación, una respuesta lenta de un
        // filtro anterior podría pintar datos viejos sobre los nuevos.
        if (requestId !== requestIdRef.current || controller.signal.aborted) {
          return;
        }
        setState({ status: 'success', data: response, errorMessage: null });
      })
      .catch((error: unknown) => {
        // Mismo guardia para el camino de error: un abort no es un error real para
        // la UI, y un error de una request superada tampoco debe pisar el estado.
        if (requestId !== requestIdRef.current || controller.signal.aborted) {
          return;
        }
        setState((previous) => ({
          status: 'error',
          data: previous.data,
          errorMessage: describeError(error),
        }));
      });

    // El cleanup aborta la request en vuelo cuando cambia cualquier dependencia (o
    // al desmontar). Junto con el guardia de secuencia, garantiza que solo el
    // último fetch pinte resultados.
    return () => {
      controller.abort();
    };
  }, [page, size, species, vitalState, sectorId, q, sort, reloadToken]);

  return {
    status: state.status,
    data: state.data,
    errorMessage: state.errorMessage,
    refetch,
  };
}
