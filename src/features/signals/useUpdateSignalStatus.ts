import { useCallback, useState } from 'react';
import { apiPatch, ApiRequestError } from '../../lib/apiClient';
import type {
  Signal,
  SignalStatusUpdate,
  UpdateSignalStatusRequest,
} from '../../types/api';

// Traducimos el error a un mensaje legible y accionable. Para el PATCH preferimos el
// `message` del backend (suele explicar por qué se rechazó la transición de estado);
// si no es un error tipado, damos un genérico en español.
function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.payload.message;
  }
  return 'No pudimos actualizar el estado de la señal. Revisa tu conexión e inténtalo de nuevo.';
}

// Estado de la actualización, modelado como unión sobre `status` para no cruzar
// flags. `success` lleva el Signal devuelto; `error` lleva el mensaje y el estado
// que se intentó aplicar, para poder reintentar el mismo.
type UpdateStatus = 'idle' | 'updating' | 'success' | 'error';

export interface UseUpdateSignalStatus {
  status: UpdateStatus;
  errorMessage: string | null;
  isUpdating: boolean;
  // Dispara el PATCH PESIMISTA. Devuelve el Signal actualizado en éxito (para que la
  // página actualice detalle y feed) o null en error (la página conserva el estado
  // anterior, no lo cambiamos hasta confirmar).
  updateStatus: (
    id: string,
    nuevoEstado: SignalStatusUpdate,
  ) => Promise<Signal | null>;
  reset: () => void;
}

// Hook del PATCH /signals/:id/status. Es PESIMISTA a propósito: no cambiamos el
// estado mostrado hasta que el backend confirma. Mientras la request viaja exponemos
// `updating` para que la UI deshabilite las acciones y muestre "Actualizando…".
export function useUpdateSignalStatus(): UseUpdateSignalStatus {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const updateStatus = useCallback(
    async (
      id: string,
      nuevoEstado: SignalStatusUpdate,
    ): Promise<Signal | null> => {
      setStatus('updating');
      setErrorMessage(null);

      // Tipamos el body con el DTO del contrato: el PATCH solo acepta PROCESANDO o
      // ATENDIDA, nunca RECIBIDA, y el tipo lo garantiza en compilación.
      const body: UpdateSignalStatusRequest = { status: nuevoEstado };

      try {
        const updated = await apiPatch<Signal>(
          `/signals/${id}/status`,
          body,
        );
        setStatus('success');
        return updated;
      } catch (error: unknown) {
        // Al fallar dejamos el estado anterior intacto (lo gestiona la página) y solo
        // exponemos el mensaje accionable para que el usuario pueda reintentar.
        setStatus('error');
        setErrorMessage(describeError(error));
        return null;
      }
    },
    [],
  );

  return {
    status,
    errorMessage,
    isUpdating: status === 'updating',
    updateStatus,
    reset,
  };
}
