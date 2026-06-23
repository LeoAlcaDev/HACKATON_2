import type { ChangeEvent } from 'react';
import type {
  Species,
  SectorListItem,
  TropelSize,
  TropelSort,
  VitalState,
} from '../../../types/api';
import {
  SIZE_OPTIONS,
  SORT_LABELS,
  SORT_OPTIONS,
  SPECIES_OPTIONS,
  VITAL_STATE_OPTIONS,
} from '../tropelsQuery';
import { SPECIES_LABELS, VITAL_STATE_LABELS } from '../tropelLabels';

// Clases compartidas de los <select> para no repetirlas en cada control. Quedan en
// una constante local porque son idénticas y así el JSX se lee de un vistazo.
const SELECT_CLASS =
  'w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

const LABEL_CLASS = 'mb-1 block text-xs font-medium text-slate-400';

interface TropelsFiltersProps {
  // El texto del buscador es estado LOCAL de la página (input inmediato); aquí solo
  // lo mostramos y notificamos los cambios hacia arriba.
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  maxQueryLength: number;

  // Los demás filtros viven en la URL; recibimos el valor actual ya validado y un
  // callback por cada uno. Pasamos undefined cuando el usuario elige "Todas".
  species: Species | undefined;
  onSpeciesChange: (value: Species | undefined) => void;

  vitalState: VitalState | undefined;
  onVitalStateChange: (value: VitalState | undefined) => void;

  sectorId: string | undefined;
  onSectorChange: (value: string | undefined) => void;
  sectors: readonly SectorListItem[];
  sectorsLoading: boolean;

  sort: TropelSort;
  onSortChange: (value: TropelSort) => void;

  size: TropelSize;
  onSizeChange: (value: TropelSize) => void;
}

// El valor centinela para la opción "Todas" en los selectores opcionales. Un value
// vacío en un <option> nos deja distinguir "sin filtro" de un valor real del enum.
const ALL_VALUE = '';

export function TropelsFilters({
  searchInput,
  onSearchInputChange,
  maxQueryLength,
  species,
  onSpeciesChange,
  vitalState,
  onVitalStateChange,
  sectorId,
  onSectorChange,
  sectors,
  sectorsLoading,
  sort,
  onSortChange,
  size,
  onSizeChange,
}: TropelsFiltersProps) {
  // Traducimos el evento del <select> a un valor del enum o a undefined ("Todas").
  // Como las opciones solo ofrecen valores válidos del contrato, el cast es seguro.
  function handleSpecies(event: ChangeEvent<HTMLSelectElement>): void {
    const value = event.target.value;
    onSpeciesChange(value === ALL_VALUE ? undefined : (value as Species));
  }

  function handleVitalState(event: ChangeEvent<HTMLSelectElement>): void {
    const value = event.target.value;
    onVitalStateChange(value === ALL_VALUE ? undefined : (value as VitalState));
  }

  function handleSector(event: ChangeEvent<HTMLSelectElement>): void {
    const value = event.target.value;
    onSectorChange(value === ALL_VALUE ? undefined : value);
  }

  function handleSort(event: ChangeEvent<HTMLSelectElement>): void {
    onSortChange(event.target.value as TropelSort);
  }

  function handleSize(event: ChangeEvent<HTMLSelectElement>): void {
    // El value del <select> es string; lo volvemos a number antes de propagarlo. La
    // lista solo ofrece 10/20/50, así que el cast a TropelSize es seguro.
    onSizeChange(Number(event.target.value) as TropelSize);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <div className="xl:col-span-2">
        <label htmlFor="tropels-search" className={LABEL_CLASS}>
          Buscar
        </label>
        <input
          id="tropels-search"
          type="search"
          value={searchInput}
          maxLength={maxQueryLength}
          onChange={(event) => onSearchInputChange(event.target.value)}
          placeholder="Nombre o guardián…"
          className={SELECT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="tropels-species" className={LABEL_CLASS}>
          Especie
        </label>
        <select
          id="tropels-species"
          value={species ?? ALL_VALUE}
          onChange={handleSpecies}
          className={SELECT_CLASS}
        >
          <option value={ALL_VALUE}>Todas</option>
          {SPECIES_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SPECIES_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tropels-vital-state" className={LABEL_CLASS}>
          Estado vital
        </label>
        <select
          id="tropels-vital-state"
          value={vitalState ?? ALL_VALUE}
          onChange={handleVitalState}
          className={SELECT_CLASS}
        >
          <option value={ALL_VALUE}>Todos</option>
          {VITAL_STATE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {VITAL_STATE_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tropels-sector" className={LABEL_CLASS}>
          Sector
        </label>
        <select
          id="tropels-sector"
          value={sectorId ?? ALL_VALUE}
          onChange={handleSector}
          disabled={sectorsLoading}
          className={SELECT_CLASS}
        >
          <option value={ALL_VALUE}>
            {sectorsLoading ? 'Cargando sectores…' : 'Todos'}
          </option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tropels-sort" className={LABEL_CLASS}>
          Orden
        </label>
        <select
          id="tropels-sort"
          value={sort}
          onChange={handleSort}
          className={SELECT_CLASS}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tropels-size" className={LABEL_CLASS}>
          Por página
        </label>
        <select
          id="tropels-size"
          value={size}
          onChange={handleSize}
          className={SELECT_CLASS}
        >
          {SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
