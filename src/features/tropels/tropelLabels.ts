import type { Species, VitalState } from '../../types/api';

// Mapas ESTÁTICOS de etiquetas y clases de color para especies y estados vitales.
// Son estáticos a propósito: Tailwind purga del bundle cualquier clase construida
// de forma dinámica (`bg-${color}-500/10`), así que escribimos las clases completas
// a mano y las indexamos por el valor del enum.

export const SPECIES_LABELS: Record<Species, string> = {
  BLOBITO: 'Blobito',
  CHISPA: 'Chispa',
  GRUNON: 'Gruñón',
  DORMILON: 'Dormilón',
  GLITCHY: 'Glitchy',
};

// Clases de badge por especie. Mantenemos buen contraste sobre el slate oscuro.
export const SPECIES_BADGE_CLASS: Record<Species, string> = {
  BLOBITO: 'bg-sky-500/10 text-sky-300 ring-1 ring-inset ring-sky-500/20',
  CHISPA: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/20',
  GRUNON: 'bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-500/20',
  DORMILON: 'bg-indigo-500/10 text-indigo-300 ring-1 ring-inset ring-indigo-500/20',
  GLITCHY: 'bg-fuchsia-500/10 text-fuchsia-300 ring-1 ring-inset ring-fuchsia-500/20',
};

export const VITAL_STATE_LABELS: Record<VitalState, string> = {
  ESTABLE: 'Estable',
  HAMBRIENTO: 'Hambriento',
  AGITADO: 'Agitado',
  MUTANDO: 'Mutando',
  CRITICO: 'Crítico',
};

// El color del estado vital comunica gravedad: verde estable, ámbar/naranja a
// medida que sube el riesgo, rojo para crítico.
export const VITAL_STATE_BADGE_CLASS: Record<VitalState, string> = {
  ESTABLE: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20',
  HAMBRIENTO: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/20',
  AGITADO: 'bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-500/20',
  MUTANDO: 'bg-fuchsia-500/10 text-fuchsia-300 ring-1 ring-inset ring-fuchsia-500/20',
  CRITICO: 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/20',
};
