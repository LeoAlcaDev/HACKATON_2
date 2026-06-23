import type {
  Species,
  TropelSize,
  TropelSort,
  VitalState,
} from '../../types/api';

// Toda la pantalla del Atlas tiene una única fuente de verdad: la URL. Este
// módulo concentra el parseo y la validación de los searchParams a tipos seguros,
// para que ni el hook de fetch ni la página tengan que adivinar si un valor que
// llegó por la barra de direcciones es válido. Si alguien abre la URL a mano con
// basura (?size=999&sort=hack), la saneamos hacia los defaults en lugar de
// confiar en ella, y nunca usamos `any`.

// El estado canónico de la pantalla, ya validado. Es lo que consumen los hooks y
// los componentes; los campos opcionales ausentes significan "filtro sin aplicar".
export interface TropelsUrlState {
  page: number;
  size: TropelSize;
  species?: Species;
  vitalState?: VitalState;
  sectorId?: string;
  q?: string;
  sort: TropelSort;
}

// Defaults del checkpoint: primera página, 20 por página y orden por actualización
// descendente. Los exponemos para que la página pueda comparar contra ellos (por
// ejemplo, para saber si hay filtros activos y ofrecer "Limpiar filtros").
export const DEFAULT_SIZE: TropelSize = 20;
export const DEFAULT_SORT: TropelSort = 'updatedAt,desc';
export const MAX_QUERY_LENGTH = 80;

// Listas de valores válidos derivadas del contrato. Las mantenemos a mano (no hay
// enums en runtime en este proyecto) y las usamos tanto para validar como para
// poblar los selectores de filtros.
export const SPECIES_OPTIONS: readonly Species[] = [
  'BLOBITO',
  'CHISPA',
  'GRUNON',
  'DORMILON',
  'GLITCHY',
];

export const VITAL_STATE_OPTIONS: readonly VitalState[] = [
  'ESTABLE',
  'HAMBRIENTO',
  'AGITADO',
  'MUTANDO',
  'CRITICO',
];

export const SIZE_OPTIONS: readonly TropelSize[] = [10, 20, 50];

export const SORT_OPTIONS: readonly TropelSort[] = [
  'name,asc',
  'updatedAt,desc',
  'chaosIndex,desc',
];

// Etiquetas legibles para el selector de orden; las especies y estados se muestran
// con su propio mapa en los componentes de fila, así que aquí solo necesitamos el
// orden.
export const SORT_LABELS: Record<TropelSort, string> = {
  'name,asc': 'Nombre (A-Z)',
  'updatedAt,desc': 'Actualización (reciente)',
  'chaosIndex,desc': 'Caos (mayor)',
};

// Guardias de tipo sobre `string`: solo aceptan valores que pertenezcan a la unión
// del contrato. Si el valor no calza, devolvemos undefined y quien llama decide el
// fallback. Comparamos contra la lista de opciones para no repetir las uniones.
function parseSpecies(value: string | null): Species | undefined {
  if (value && SPECIES_OPTIONS.includes(value as Species)) {
    return value as Species;
  }
  return undefined;
}

function parseVitalState(value: string | null): VitalState | undefined {
  if (value && VITAL_STATE_OPTIONS.includes(value as VitalState)) {
    return value as VitalState;
  }
  return undefined;
}

function parseSize(value: string | null): TropelSize {
  // El size solo puede ser 10, 20 o 50. Cualquier otra cosa (texto, 999, vacío)
  // cae al default en vez de mandarle un size inválido al backend.
  const parsed = Number(value);
  if (SIZE_OPTIONS.includes(parsed as TropelSize)) {
    return parsed as TropelSize;
  }
  return DEFAULT_SIZE;
}

function parseSort(value: string | null): TropelSort {
  if (value && SORT_OPTIONS.includes(value as TropelSort)) {
    return value as TropelSort;
  }
  return DEFAULT_SORT;
}

function parsePage(value: string | null): number {
  // La paginación es 0-based. Saneamos a un entero no negativo: negativos,
  // decimales o texto vuelven a la página 0.
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }
  return 0;
}

function parseQuery(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  // Recortamos al máximo permitido por si alguien pega un texto largo en la URL;
  // el input ya limita por maxLength, pero la URL es la fuente de verdad y también
  // tiene que respetar el tope.
  const trimmed = value.slice(0, MAX_QUERY_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

// Convierte los searchParams crudos en el estado canónico ya validado. Es la única
// función que la página y los hooks deben usar para leer la URL.
export function parseTropelsSearchParams(
  params: URLSearchParams,
): TropelsUrlState {
  return {
    page: parsePage(params.get('page')),
    size: parseSize(params.get('size')),
    species: parseSpecies(params.get('species')),
    vitalState: parseVitalState(params.get('vitalState')),
    // El sectorId es un id opaco del backend: no podemos validar su formato sin
    // la lista de sectores, así que solo descartamos el vacío. El selector solo
    // ofrece ids reales, y si llega uno inexistente el backend devolverá vacío.
    sectorId: params.get('sectorId') || undefined,
    q: parseQuery(params.get('q')),
    sort: parseSort(params.get('sort')),
  };
}
