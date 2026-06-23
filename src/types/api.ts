// Contrato público del backend del curso (TropelCare Control API), tipado a mano
// a partir de Swagger y de los .md de especificación. Es la única fuente de
// verdad de tipos para las respuestas de la API: prohibido usar `any` aquí.

// Enums del dominio. Los copiamos exactos de la especificación del backend.
export type Species = 'BLOBITO' | 'CHISPA' | 'GRUNON' | 'DORMILON' | 'GLITCHY';

export type VitalState =
  | 'ESTABLE'
  | 'HAMBRIENTO'
  | 'AGITADO'
  | 'MUTANDO'
  | 'CRITICO';

// signalType tiene SIETE valores; es fácil olvidar los dos últimos.
export type SignalType =
  | 'HAMBRE'
  | 'ABANDONO'
  | 'MUTACION'
  | 'FUGA'
  | 'CONFLICTO'
  | 'REPRODUCCION_MASIVA'
  | 'SENAL_CORRUPTA';

export type Severity = 'LEVE' | 'MODERADO' | 'GRAVE' | 'CRITICO';

// Estado de una señal: la unión completa de los tres estados posibles.
export type SignalStatus = 'RECIBIDA' | 'PROCESANDO' | 'ATENDIDA';

// El PATCH de estado solo acepta un SUBconjunto: nunca se puede volver a
// 'RECIBIDA'. Lo mantenemos como un tipo aparte a propósito.
export type SignalStatusUpdate = 'PROCESANDO' | 'ATENDIDA';

export type Climate =
  | 'PIXEL_FOREST'
  | 'NEON_CAVE'
  | 'CLOUD_AQUARIUM'
  | 'RETRO_ARCADE';

// El contrato solo documenta el rol OPERATOR para los usuarios de equipo.
export type UserRole = 'OPERATOR';

// Autenticación.
export interface LoginRequest {
  teamCode: string;
  email: string;
  password: string;
}

export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  teamCode: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: SessionUser;
}

// Formato de error ÚNICO del backend. Todo error de la API llega con esta forma.
export interface ApiError {
  error: string;
  message: string;
  timestamp: string;
  path: string;
  details: Record<string, unknown>;
}

// Dashboard.
export interface DashboardSummary {
  totalTropels: number;
  criticalTropels: number;
  openSignals: number;
  sectorStabilityAvg: number;
  signalsBySeverity: Record<Severity, number>;
  generatedAt: string;
}

// Tropel. El sector llega anidado y liviano: solo id, name y sectorCode.
export interface TropelSectorRef {
  id: string;
  name: string;
  sectorCode: string;
}

export interface Tropel {
  id: string;
  name: string;
  species: Species;
  vitalState: VitalState;
  energyLevel: number;
  chaosIndex: number;
  mutationStage: number;
  guardianName: string;
  sector: TropelSectorRef;
  createdAt: string;
  updatedAt: string;
}

// La lista de Tropeles viene paginada al estilo clásico (page/size), no como un
// array plano. Estos son los campos exactos del sobre de paginación.
export interface TropelsPage {
  content: Tropel[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

// Señal. El tropel llega anidado con id, name y species.
export interface SignalTropelRef {
  id: string;
  name: string;
  species: Species;
}

export interface Signal {
  id: string;
  signalType: SignalType;
  severity: Severity;
  status: SignalStatus;
  rawContent: string;
  tropel: SignalTropelRef;
  createdAt: string;
  updatedAt: string;
}

// Body del PATCH de estado. Reusa el subconjunto de estados permitidos.
export interface UpdateSignalStatusRequest {
  status: SignalStatusUpdate;
}

// El feed de señales es cursor-based; viene envuelto con la metadata del cursor.
export interface SignalFeedResponse {
  items: Signal[];
  nextCursor: string | null;
  hasMore: boolean;
  totalEstimate: number;
}

// Sectores. La lista es liviana y viene envuelta en { items }.
export interface SectorListItem {
  id: string;
  sectorCode: string;
  name: string;
  climate: Climate;
  capacity: number;
  currentLoad: number;
  stabilityLevel: number;
}

export interface SectorsResponse {
  items: SectorListItem[];
}

// Story de un sector. Cada etapa usa el campo `order` (no `stageOrder`) y trae
// sus métricas como { stability, energy, alerts }.
export interface StoryMetrics {
  stability: number;
  energy: number;
  alerts: number;
}

export interface StoryStage {
  id: string;
  order: number;
  title: string;
  narrative: string;
  dominantEvent: SignalType;
  metrics: StoryMetrics;
  // assetKey y colorToken son identificadores, no URLs: el frontend construye el
  // visual con CSS y assets locales a partir de ellos.
  assetKey: string;
  colorToken: string;
  progress: number;
}

export interface StorySectorRef {
  id: string;
  name: string;
  climate: Climate;
}

export interface SectorStoryResponse {
  sector: StorySectorRef;
  stages: StoryStage[];
}

// Parámetros de query tipados, sin `any`, para los endpoints paginados. Se usan
// recién en los checkpoints, pero los dejamos cableados desde el contrato.
export type TropelSize = 10 | 20 | 50;

export type TropelSort = 'name,asc' | 'updatedAt,desc' | 'chaosIndex,desc';

export interface TropelsQuery {
  page?: number;
  size?: TropelSize;
  species?: Species;
  vitalState?: VitalState;
  sectorId?: string;
  q?: string;
  sort?: TropelSort;
}

// El feed acepta limit con default 15 y máximo 30 (lo dejamos como constantes).
export const FEED_LIMIT_DEFAULT = 15;
export const FEED_LIMIT_MAX = 30;

export interface SignalFeedQuery {
  cursor?: string;
  limit?: number;
  signalType?: SignalType;
  severity?: Severity;
  status?: SignalStatus;
  q?: string;
}
