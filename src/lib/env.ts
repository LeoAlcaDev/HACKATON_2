// Leemos y validamos las variables VITE_* al cargar el módulo para fallar rápido
// y con un mensaje claro si falta lo imprescindible, en vez de reventar más tarde
// con un fetch a "undefined/...". Solo VITE_API_BASE_URL es obligatoria; las otras
// dos son comodidades de desarrollo para prellenar el formulario de login.

function readRequired(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia .env.example a .env y ` +
        `complétala con la URL del backend que entrega el TA (incluye /api/v1).`,
    );
  }
  return value;
}

export const env = {
  apiBaseUrl: readRequired('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  defaultTeamCode: import.meta.env.VITE_TEAM_CODE ?? '',
  defaultEmail: import.meta.env.VITE_EMAIL ?? '',
} as const;
