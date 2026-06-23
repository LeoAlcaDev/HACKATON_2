import { Link, useParams } from 'react-router-dom';
import { Placeholder } from '../../components/Placeholder';

export default function SignalDetailPage() {
  // El detalle se monta en el Outlet de SignalsLayout. Mostramos el :id para
  // confirmar el deep-linking a una señal concreta desde ya.
  const { id } = useParams<{ id: string }>();

  return (
    <Placeholder
      title="Detalle de Señal"
      description="Checkpoint 4: datos reales de la señal y cambio de estado a PROCESANDO o ATENDIDA, con loading, error accionable y reflejo en el feed al volver. Pendiente de implementación."
    >
      <p className="mt-4 text-sm text-slate-400">
        Señal solicitada:{' '}
        <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">
          {id}
        </code>
      </p>
      <Link
        to="/signals"
        className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300"
      >
        ← Volver al feed
      </Link>
    </Placeholder>
  );
}
