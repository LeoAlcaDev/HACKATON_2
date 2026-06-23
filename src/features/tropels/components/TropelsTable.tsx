import type { Tropel } from '../../../types/api';
import {
  SPECIES_BADGE_CLASS,
  SPECIES_LABELS,
  VITAL_STATE_BADGE_CLASS,
  VITAL_STATE_LABELS,
} from '../tropelLabels';

interface TropelsTableProps {
  tropels: readonly Tropel[];
}

// Cabeceras de la tabla en un único lugar para mantener consistencia entre el
// encabezado real y el esqueleto de carga (que reusa el mismo ancho de columnas).
const COLUMNS = [
  'Nombre',
  'Especie',
  'Estado vital',
  'Energía',
  'Caos',
  'Mutación',
  'Guardián',
  'Sector',
];

// Badge reutilizable: recibe ya la clase estática de color resuelta desde el mapa,
// así Tailwind conserva las clases en el bundle.
function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function TropelRow({ tropel }: { tropel: Tropel }) {
  return (
    <tr className="border-t border-slate-800 transition hover:bg-slate-800/40">
      <td className="px-4 py-3 font-medium text-slate-100">{tropel.name}</td>
      <td className="px-4 py-3">
        <Badge
          label={SPECIES_LABELS[tropel.species]}
          className={SPECIES_BADGE_CLASS[tropel.species]}
        />
      </td>
      <td className="px-4 py-3">
        <Badge
          label={VITAL_STATE_LABELS[tropel.vitalState]}
          className={VITAL_STATE_BADGE_CLASS[tropel.vitalState]}
        />
      </td>
      <td className="px-4 py-3 tabular-nums text-slate-300">
        {tropel.energyLevel}
      </td>
      <td className="px-4 py-3 tabular-nums text-slate-300">
        {tropel.chaosIndex}
      </td>
      <td className="px-4 py-3 tabular-nums text-slate-300">
        {tropel.mutationStage}
      </td>
      <td className="px-4 py-3 text-slate-300">{tropel.guardianName}</td>
      <td className="px-4 py-3 text-slate-300">{tropel.sector.name}</td>
    </tr>
  );
}

export function TropelsTable({ tropels }: TropelsTableProps) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="text-xs uppercase tracking-wide text-slate-500">
          {COLUMNS.map((column) => (
            <th key={column} className="px-4 py-2 font-medium">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tropels.map((tropel) => (
          <TropelRow key={tropel.id} tropel={tropel} />
        ))}
      </tbody>
    </table>
  );
}

// Esqueleto de filas para el estado de carga. Reservamos exactamente `rows` filas
// con celdas grises animadas para que el alto del área no salte entre cargar y
// mostrar datos: el layout no se mueve. Reusamos la misma cantidad de columnas.
export function TropelsTableSkeleton({ rows }: { rows: number }) {
  // Generamos un arreglo de índices [0, 1, 2, …] para pintar tantas filas como el
  // size pedido, sin un parámetro descartado en el map.
  const rowIndexes = Array.from({ length: rows }, (_unused, index) => index);

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="text-xs uppercase tracking-wide text-slate-500">
          {COLUMNS.map((column) => (
            <th key={column} className="px-4 py-2 font-medium">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rowIndexes.map((rowIndex) => (
          <tr key={rowIndex} className="border-t border-slate-800">
            {COLUMNS.map((column) => (
              <td key={column} className="px-4 py-3">
                <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
