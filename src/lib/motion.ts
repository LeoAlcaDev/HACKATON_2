// Pequeños helpers de detección de capacidades del navegador para el motor de
// historia. Los aislamos aquí para no repetir `window.matchMedia` ni `CSS.supports`
// con sus comprobaciones de existencia por toda la UI.

// Consultamos `prefers-reduced-motion` de forma puntual (no reactiva). Para el
// scrollytelling nos basta leerlo en el momento de animar; quien necesite
// reaccionar a cambios en vivo puede suscribirse al MediaQueryList aparte.
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// El navegador soporta animaciones dirigidas por scroll si entiende
// `animation-timeline: scroll()`. Cuando es así dejamos que el CSS maneje la
// barra de progreso; si no, caemos a calcularla en JS.
export function supportsScrollTimeline(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('animation-timeline: scroll()')
  );
}
