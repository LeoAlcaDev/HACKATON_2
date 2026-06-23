import type { ReactNode } from 'react';

interface PlaceholderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

// Bloque común para las páginas de feature que todavía no están implementadas.
// Existe para que el ruteo, el guard y el deep-linking se puedan demostrar hoy;
// cada página se reemplazará por su contenido real en los checkpoints.
export function Placeholder({ title, description, children }: PlaceholderProps) {
  return (
    <section className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8">
      <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30">
        Pendiente
      </span>
      <h1 className="mt-3 text-xl font-semibold text-slate-100">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p>
      ) : null}
      {children}
    </section>
  );
}
