# TropelCare Control Room

Consola operativa (frontend) para la hackathon **TropelCare — Pizza Protocol**
(CS2031, UTEC). React 18 + TypeScript estricto + Vite + React Router + Tailwind.
La data viene del backend cerrado del curso; este repositorio es solo el frontend.

## Equipo

- Leonardo Alca
- Enrique Zheng

## Requisitos

- Node.js 20+
- pnpm

## Instalación y comandos

```bash
pnpm install
pnpm dev        # servidor de desarrollo en http://localhost:5173
pnpm build      # typecheck (tsc -b) + build de producción
pnpm preview    # sirve el build de producción
pnpm typecheck  # solo chequeo de tipos
```

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores que entrega el TA:

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `VITE_API_BASE_URL` | sí | URL base del backend, incluye `/api/v1`. |
| `VITE_TEAM_CODE` | no | Prellena el `teamCode` en el login (comodidad de dev). |
| `VITE_EMAIL` | no | Prellena el email en el login. |

El password nunca se hornea en el bundle: se escribe en el formulario.

## Estado actual

Andamiaje del proyecto. El backbone de autenticación es funcional (login,
restauración de sesión vía `/auth/me`, logout y ruta privada). Las páginas de
cada checkpoint quedan como placeholders a la espera de implementación.

## Deploy

Pendiente (Vercel). `vercel.json` ya incluye el rewrite a `index.html` para
soportar deep-linking en cualquier ruta del deploy.
