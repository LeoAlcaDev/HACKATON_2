import { Link, useParams } from 'react-router-dom';
import { Placeholder } from '../components/Placeholder';

export default function SectorStoryPage() {
  // Leemos el :id de la URL para confirmar que el deep-linking a la historia de un
  // sector concreto funciona desde ya, aunque el motor de scrollytelling no exista.
  const { id } = useParams<{ id: string }>();

  return (
    <Placeholder
      title="Sector Story Engine"
      description="Checkpoint 5 (reto principal): experiencia de scrollytelling desde /sectors/:id/story, con animaciones scroll-driven, View Transitions y soporte de reduced-motion. Pendiente de implementación."
    >
      <p className="mt-4 text-sm text-slate-400">
        Sector solicitado:{' '}
        <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">
          {id}
        </code>
      </p>
      <Link
        to="/sectors"
        className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300"
      >
        ← Volver a sectores
      </Link>
    </Placeholder>
  );
}
