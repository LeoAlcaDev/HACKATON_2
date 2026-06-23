import type { Climate, SignalType } from '../types/api';

// El backend manda `colorToken` como un identificador (p. ej. "emerald"), no como
// un color ni una URL. Lo traducimos aquí a un color real en hex para construir el
// visual con CSS. Resolverlo a una variable CSS en runtime nos evita depender de
// clases dinámicas de Tailwind (que el purgado eliminaría) y soporta cualquier
// token que llegue, cayendo a un color por defecto si no lo conocemos.
const COLOR_TOKENS: Record<string, string> = {
  slate: '#64748b',
  gray: '#6b7280',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
};

const FALLBACK_COLOR = COLOR_TOKENS.emerald;

export function resolveColorToken(colorToken: string): string {
  return COLOR_TOKENS[colorToken] ?? FALLBACK_COLOR;
}

// Cada clima trae su propia atmósfera: un color de fondo secundario para el
// degradado de la escena y una etiqueta legible en español. El visual mezcla este
// color de ambiente con el color de la etapa activa, así la escena cambia con el
// scroll sin perder la identidad del sector.
interface ClimateTheme {
  label: string;
  ambient: string;
}

const CLIMATE_THEMES: Record<Climate, ClimateTheme> = {
  PIXEL_FOREST: { label: 'Bosque de Píxeles', ambient: '#064e3b' },
  NEON_CAVE: { label: 'Caverna de Neón', ambient: '#3b0764' },
  CLOUD_AQUARIUM: { label: 'Acuario de Nubes', ambient: '#0c4a6e' },
  RETRO_ARCADE: { label: 'Arcade Retro', ambient: '#4a044e' },
};

const FALLBACK_CLIMATE: ClimateTheme = {
  label: 'Sector',
  ambient: '#0f172a',
};

export function resolveClimateTheme(climate: Climate): ClimateTheme {
  return CLIMATE_THEMES[climate] ?? FALLBACK_CLIMATE;
}

// El `dominantEvent` reusa el enum de tipos de señal. Lo mostramos como texto en
// español para que la narrativa sea legible; si llegara un valor nuevo, lo
// devolvemos tal cual en vez de romper.
const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  HAMBRE: 'Hambre',
  ABANDONO: 'Abandono',
  MUTACION: 'Mutación',
  FUGA: 'Fuga',
  CONFLICTO: 'Conflicto',
  REPRODUCCION_MASIVA: 'Reproducción masiva',
  SENAL_CORRUPTA: 'Señal corrupta',
};

export function signalTypeLabel(signalType: SignalType): string {
  return SIGNAL_TYPE_LABELS[signalType] ?? signalType;
}
