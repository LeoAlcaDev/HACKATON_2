import { Outlet } from 'react-router-dom';

// Sub-layout de /signals. Mantenemos el feed y el detalle bajo este Outlet a
// propósito: los próximos checkpoints dependen de este montaje para no perder la
// posición de scroll del feed al abrir y cerrar un detalle.
export default function SignalsLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Señales</h1>
        <p className="text-sm text-slate-400">
          Feed de señales del workspace e inspección de cada señal.
        </p>
      </div>
      <Outlet />
    </div>
  );
}
