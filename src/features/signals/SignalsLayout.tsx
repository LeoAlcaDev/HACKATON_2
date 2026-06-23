import { Outlet, useSearchParams } from 'react-router-dom';
import SignalsFeedPage from './SignalsFeedPage';
import { parseSignalsFilters } from './signalsQuery';
import type { SignalsOutletContext } from './signalsContext';
import { useSignalsFeed } from './useSignalsFeed';

// Layout de /signals y DUEÑO del estado del feed. La clave de toda la arquitectura
// está aquí: el estado del feed (items, cursor, Set de ids, scroll) vive en este
// componente, que NO se desmonta al abrir un detalle. Por eso montamos el feed
// SIEMPRE y de forma DIRECTA (no a través del Outlet), y dejamos el Outlet solo para
// el detalle, que se pinta como overlay encima. Así, al abrir y cerrar una señal, el
// feed conserva su posición y sus items sin recargar.
//
// El router (lo cabea el orquestador) debe declarar la ruta hija index como
//   <Route index element={null} />
// para que en /signals el Outlet quede vacío y solo se vea el feed que monta este
// layout; el detalle vive en <Route path=":id" />.
export default function SignalsLayout() {
  // Los FILTROS son la única fuente de verdad en la URL (el cursor no). Los leemos y
  // validamos aquí y se los pasamos al hook del feed; cuando cambian, el hook hace su
  // reset total. Vivir en el layout es lo que permite que el feed sobreviva al detalle.
  const [searchParams] = useSearchParams();
  const filters = parseSignalsFilters(searchParams);

  const feed = useSignalsFeed(filters);

  // Compartimos con el detalle (vía contexto del Outlet) solo la función que necesita:
  // reflejar en el feed el nuevo estado tras un PATCH exitoso. El resto del estado del
  // feed lo consume la página directamente por props.
  const outletContext: SignalsOutletContext = {
    actualizarEstadoEnFeed: feed.actualizarEstadoEnFeed,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Señales</h1>
        <p className="text-sm text-slate-400">
          Feed de señales del workspace e inspección de cada señal.
        </p>
      </div>

      {/* El feed se monta directo y recibe TODO su estado por props. */}
      <SignalsFeedPage feed={feed} />

      {/* El detalle (ruta hija :id) se pinta aquí como overlay. En /signals el index
          es null y el Outlet queda vacío: solo se ve el feed. */}
      <Outlet context={outletContext} />
    </div>
  );
}
