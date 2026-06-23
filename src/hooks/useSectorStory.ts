import { useCallback, useEffect, useState } from 'react';
import { apiGet, ApiRequestError } from '../lib/apiClient';
import type { SectorStoryResponse } from '../types/api';

// Estado de la carga de la historia de un sector. Lo modelamos como una unión
// discriminada para que la página renderice exactamente un estado a la vez
// (loading, error o data) sin combinaciones imposibles.
type StoryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: SectorStoryResponse };

// Encapsula el fetch de /sectors/:id/story con su ciclo de vida: cancela la
// petición en vuelo si el id cambia o el componente se desmonta, para que una
// respuesta vieja nunca pise a una nueva. Expone `reload` para el botón de
// reintento del estado de error.
export function useSectorStory(sectorId: string | undefined) {
  const [state, setState] = useState<StoryState>({ status: 'loading' });
  // Un contador que incrementamos para forzar un refetch desde `reload` sin
  // depender de cambiar el id.
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!sectorId) {
      setState({
        status: 'error',
        message: 'No se indicó qué sector mostrar.',
      });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    apiGet<SectorStoryResponse>(`/sectors/${sectorId}/story`)
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof ApiRequestError
            ? error.payload.message
            : 'No pudimos cargar la historia de este sector.';
        setState({ status: 'error', message });
      });

    return () => {
      cancelled = true;
    };
  }, [sectorId, reloadToken]);

  return { state, reload };
}
