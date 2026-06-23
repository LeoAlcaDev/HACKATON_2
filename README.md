# TropelCare Control Room

Consola operativa (frontend) para la hackathon **TropelCare — Pizza Protocol**
(CS2031, UTEC). React 18 + TypeScript estricto + Vite + React Router + Tailwind.
La data viene del backend cerrado del curso; este repositorio es solo el frontend.

## Deploy

**App en producción:** https://tropelcare-control-room-xi.vercel.app

El deploy abre directo en cualquier ruta (`/dashboard`, `/tropels`, `/signals`,
`/signals/:id`, `/sectors/:id/story`) gracias al rewrite a `index.html` de
`vercel.json`. La `VITE_API_BASE_URL` se hornea en el build, así que la app apunta
al backend real del curso.

Para entrar: equipo `TEAM-013`, usuario `operator@tuckersoft.com` y el password del
equipo (lo entrega el TA; no se versiona). El password no vive en ninguna variable de
entorno: se escribe en el formulario de login.

## Equipo

- Leonardo Alca — código: `<completar>`
- Enrique Zheng — código: `<completar>`

## Requisitos

- Node.js 20+
- pnpm (también funciona con npm; la evaluación corre `npm run typecheck` y `npm run build`)

## Instalación y comandos

```bash
pnpm install
pnpm dev        # servidor de desarrollo en http://localhost:5173
pnpm build      # typecheck (tsc -b) + build de producción
pnpm preview    # sirve el build de producción
pnpm typecheck  # solo chequeo de tipos

# equivalentes con npm
npm install
npm run dev
npm run build
npm run typecheck
```

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores que entrega el TA:

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `VITE_API_BASE_URL` | sí | URL base del backend, incluye `/api/v1`. Sin ella la app no arranca. |
| `VITE_TEAM_CODE` | no | Prellena el `teamCode` en el login (comodidad de dev). |
| `VITE_EMAIL` | no | Prellena el email en el login. |

El password nunca se hornea en el bundle: las variables `VITE_` quedan expuestas en
el bundle público, así que el password solo se escribe en el formulario. En Vercel
estas variables se inyectan como _build env_ del proyecto.

## Checkpoints implementados

Los cinco checkpoints están completos y desplegados.

1. **Encender la consola** — login con las credenciales del equipo, ruta privada,
   restauración de sesión al recargar (vía `/auth/me`), logout y dashboard real
   desde `/dashboard/summary` con sus tres estados.
2. **Atlas de Tropeles** — paginación de servidor, filtros combinables, búsqueda y
   orden, con todo el estado reflejado en la URL.
3. **Feed infinito** — feed de señales por cursor con scroll infinito.
4. **Atender una señal** — detalle de la señal y actualización de su estado.
5. **Sector Story Engine** — scrollytelling de cada sector.

## Decisiones técnicas

- **Cliente HTTP propio sobre `fetch`** (`src/lib/apiClient.ts`): inyecta el Bearer,
  normaliza el formato de error único del backend a un `ApiRequestError` tipado,
  cablea el manejo del `401` (limpia la sesión) y serializa los _query params_
  opcionales descartando los vacíos. No usamos React Query/SWR/TanStack (prohibidos);
  el caché y los estados de carga se resuelven con hooks propios.
- **Contrato tipado a mano** en `src/types/api.ts`, reflejando Swagger. Cero `any`
  para respuestas de la API: todo pasa por los DTOs.
- **Auth** (`src/auth/`): el token se guarda en `localStorage` como fuente única para
  restaurar la sesión al recargar, se espeja en el cliente HTTP y en el estado de
  React; `PrivateRoute` redirige a `/login` sin sesión.
- **CP1 — Dashboard** (`src/features/dashboard/`): un hook `useDashboardSummary` hace
  el fetch (estado discriminado + `AbortController`) y la página solo pinta. Tres
  estados sin salto de layout: skeleton con la misma rejilla, error con reintento, y
  el caso "todo en cero" tratado como estado válido.
- **CP2 — Tropeles** (`src/features/tropels/`): la URL (`useSearchParams`) es la única
  fuente de verdad (`page`, `size`, `species`, `vitalState`, `sectorId`, `q`, `sort`);
  recargar o compartir la URL restaura el estado exacto. Contra respuestas obsoletas
  combinamos `AbortController` con un **guardia de secuencia** (id incremental en un
  `ref`): al resolver, se descarta el resultado si no es el más reciente. La búsqueda
  usa `useDebouncedValue` (~350 ms) que escribe a la URL, desacoplada del fetch.
- **CP3 — Feed de señales** (`src/features/signals/`): scroll infinito por cursor con
  `IntersectionObserver` sobre un sentinela (sin botón "cargar más"). Deduplicación
  por id con un `Set`, una sola carga en vuelo con un `ref`, y **reset total por
  filtros** con un token que descarta cargas en vuelo de filtros anteriores (el
  backend rechaza un cursor con filtros distintos). El error de una página posterior
  es un estado aparte que conserva lo cargado y reintenta el mismo cursor. El feed se
  monta en `SignalsLayout` (no en el `Outlet`) para no perder scroll ni estado al
  abrir el detalle.
- **CP4 — Detalle y estado** (`src/features/signals/`): el detalle se abre como
  overlay dentro del `Outlet` (deep-linkable). El `PATCH` de estado es **pesimista**:
  deshabilita las acciones mientras viaja, confirma al éxito y, si falla, conserva el
  estado anterior y ofrece reintentar; al confirmarse refleja el nuevo estado en el
  feed vía el contexto del `Outlet`.
- **CP5 — Sector Story Engine** (`src/pages/SectorStoryPage.tsx`, `src/components/story/`,
  `src/hooks/useActiveStage.ts`, `src/hooks/useSectorStory.ts`): scrollytelling con
  narrativa por etapas activadas por scroll, visual persistente, CSS scroll-driven
  animations con fallback, View Transition API con fallback, soporte de
  `prefers-reduced-motion` y navegación por teclado.

## Estructura

```text
src/
  auth/         contexto de auth, ruta privada y restauración de sesión
  components/   primitivos compartidos (LoadingState, ErrorState, EmptyState, badges)
  components/story/  piezas del Sector Story Engine (CP5)
  features/
    dashboard/  CP1
    tropels/    CP2
    signals/    CP3 + CP4 (feed montado en el layout, detalle como overlay)
  hooks/        useDebouncedValue y los hooks del story engine
  lib/          apiClient (fetch tipado) y lectura de variables de entorno
  pages/        login, 404, sectores y story
  types/api.ts  contrato del backend tipado a mano (sin any)
```
