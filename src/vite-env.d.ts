/// <reference types="vite/client" />

// Tipamos las variables VITE_* que usa la app para no acceder sin tipos a
// import.meta.env. Solo VITE_API_BASE_URL es obligatoria; las otras dos son
// comodidades de desarrollo para prellenar el formulario de login.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TEAM_CODE?: string;
  readonly VITE_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
