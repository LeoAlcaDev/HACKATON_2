import { env } from './env';
import type { ApiError } from '../types/api';

// Cliente HTTP propio sobre fetch. Mantiene el token actual en una variable de
// módulo (que AuthContext sincroniza) e inyecta el Bearer en cada request. Para
// el 401 expone un handler que AuthContext cablea, así evitamos imports
// circulares entre el cliente y el contexto de autenticación.

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

// Error tipado que viaja por toda la app. Envuelve el formato único del backend y
// conserva el status HTTP para que la UI decida cómo reaccionar.
export class ApiRequestError extends Error {
  readonly status: number;
  readonly payload: ApiError;

  constructor(status: number, payload: ApiError) {
    super(payload.message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.payload = payload;
  }
}

// Narrowing desde `unknown` (nunca `any`) para confirmar que el cuerpo de error
// tiene la forma del contrato antes de tratarlo como ApiError.
function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.error === 'string' && typeof candidate.message === 'string'
  );
}

function buildApiError(status: number, path: string, body: unknown): ApiError {
  if (isApiError(body)) {
    return body;
  }
  // Fallback cuando el backend (o un proxy intermedio) no devuelve el formato
  // esperado: igual entregamos un ApiError coherente para no romper la UI.
  return {
    error: 'UNKNOWN_ERROR',
    message: `La petición a ${path} falló con estado ${status}.`,
    timestamp: new Date().toISOString(),
    path,
    details: {},
  };
}

async function readBodySafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Aceptamos un body como objeto cualquiera y lo serializamos a JSON nosotros, así
// los callers no repiten JSON.stringify ni el Content-Type en cada llamada.
export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const url = `${env.apiBaseUrl}${path}`;

  const finalHeaders = new Headers(headers);
  if (authToken) {
    finalHeaders.set('Authorization', `Bearer ${authToken}`);
  }

  let serializedBody: string | undefined;
  if (body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
    serializedBody = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: serializedBody,
  });

  if (response.status === 401) {
    // Sesión inválida o expirada: avisamos a quien sepa limpiar el estado de auth
    // (lo cablea AuthContext) y dejamos que PrivateRoute redirija a /login.
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    const errorBody = await readBodySafe(response);
    throw new ApiRequestError(
      response.status,
      buildApiError(response.status, path, errorBody),
    );
  }

  // 204 No Content u otras respuestas legítimamente sin cuerpo.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'GET' });
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'POST', body });
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'PATCH', body });
}
