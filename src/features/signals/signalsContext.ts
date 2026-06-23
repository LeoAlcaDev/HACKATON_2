import type { SignalStatus } from '../../types/api';

// Tipo del contexto que el layout comparte con el detalle a través del Outlet.
// El detalle, tras un PATCH exitoso, necesita avisarle al feed que la señal
// cambió de estado para que al cerrar el panel se vea el estado nuevo sin recargar
// la lista. Como el estado del feed vive en el layout (y no se desmonta al abrir el
// detalle), esta función es el único puente entre ambos.
export interface SignalsOutletContext {
  actualizarEstadoEnFeed: (id: string, nuevoEstado: SignalStatus) => void;
}
