import type { Severity, SignalStatus, SignalType } from '../../types/api';

// Igual que en el Atlas de tropeles, la fuente de verdad de los FILTROS del feed
// es la URL. Este módulo concentra el parseo y la validación de los searchParams a
// tipos seguros para que ni el hook del feed ni la página tengan que adivinar si un
// valor que llegó por la barra de direcciones es válido. Importante: el CURSOR NO
// vive en la URL (es estado interno del feed), aquí solo viven los filtros, porque
// el backend rechaza un cursor combinado con filtros distintos a los que lo
// generaron.

// El tope de caracteres del texto de búsqueda. Lo aplicamos tanto en el input como
// al leer la URL, que es la fuente de verdad.
export const MAX_QUERY_LENGTH = 80;

// Listas de valores válidos derivadas del contrato. No hay enums en runtime en este
// proyecto, así que las mantenemos a mano y las reusamos para validar y para poblar
// los selectores de filtros.
export const SIGNAL_TYPE_OPTIONS: readonly SignalType[] = [
  'HAMBRE',
  'ABANDONO',
  'MUTACION',
  'FUGA',
  'CONFLICTO',
  'REPRODUCCION_MASIVA',
  'SENAL_CORRUPTA',
];

export const SEVERITY_OPTIONS: readonly Severity[] = [
  'LEVE',
  'MODERADO',
  'GRAVE',
  'CRITICO',
];

export const STATUS_OPTIONS: readonly SignalStatus[] = [
  'RECIBIDA',
  'PROCESANDO',
  'ATENDIDA',
];

// Etiquetas legibles. signalType no tiene badge propio, así que su mapa de etiquetas
// se usa tanto en el selector de filtros como en la tarjeta y el detalle.
export const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  HAMBRE: 'Hambre',
  ABANDONO: 'Abandono',
  MUTACION: 'Mutación',
  FUGA: 'Fuga',
  CONFLICTO: 'Conflicto',
  REPRODUCCION_MASIVA: 'Reproducción masiva',
  SENAL_CORRUPTA: 'Señal corrupta',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  LEVE: 'Leve',
  MODERADO: 'Moderado',
  GRAVE: 'Grave',
  CRITICO: 'Crítico',
};

export const STATUS_LABELS: Record<SignalStatus, string> = {
  RECIBIDA: 'Recibida',
  PROCESANDO: 'Procesando',
  ATENDIDA: 'Atendida',
};

// El estado canónico de los filtros del feed, ya validado. Un campo opcional ausente
// significa "filtro sin aplicar". Es lo que consume el hook del feed.
export interface SignalsFilters {
  signalType?: SignalType;
  severity?: Severity;
  status?: SignalStatus;
  q?: string;
}

// Guardias de tipo sobre `string`: solo aceptan valores que pertenezcan a la unión
// del contrato. Si el valor que llegó por la URL no calza (alguien la editó a mano),
// devolvemos undefined y el filtro se trata como no aplicado.
function parseSignalType(value: string | null): SignalType | undefined {
  if (value && SIGNAL_TYPE_OPTIONS.includes(value as SignalType)) {
    return value as SignalType;
  }
  return undefined;
}

function parseSeverity(value: string | null): Severity | undefined {
  if (value && SEVERITY_OPTIONS.includes(value as Severity)) {
    return value as Severity;
  }
  return undefined;
}

function parseStatus(value: string | null): SignalStatus | undefined {
  if (value && STATUS_OPTIONS.includes(value as SignalStatus)) {
    return value as SignalStatus;
  }
  return undefined;
}

function parseQuery(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  // Recortamos al tope por si pegaron un texto largo en la URL; el input ya limita
  // por maxLength, pero la URL es la fuente de verdad y también debe respetarlo.
  const trimmed = value.slice(0, MAX_QUERY_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

// Convierte los searchParams crudos en los filtros canónicos ya validados. Es la
// única función que la página y el hook deben usar para leer los filtros de la URL.
export function parseSignalsFilters(params: URLSearchParams): SignalsFilters {
  return {
    signalType: parseSignalType(params.get('signalType')),
    severity: parseSeverity(params.get('severity')),
    status: parseStatus(params.get('status')),
    q: parseQuery(params.get('q')),
  };
}

// Clave estable que representa la combinación de filtros activa. La usamos como
// dependencia del effect del feed: cuando cambia, el feed hace RESET TOTAL (vacía
// items, descarta cursor y limpia el Set de ids vistos). Serializar a string evita
// que un objeto nuevo con los mismos valores dispare un reset espurio en cada render.
export function buildFiltersKey(filters: SignalsFilters): string {
  return [
    filters.signalType ?? '',
    filters.severity ?? '',
    filters.status ?? '',
    filters.q ?? '',
  ].join('|');
}
