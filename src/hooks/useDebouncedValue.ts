import { useEffect, useState } from 'react';

// Devuelve una copia del valor que solo se actualiza cuando este deja de cambiar
// durante `delayMs`. Lo usamos en las búsquedas: el input se siente inmediato,
// pero el valor "estable" que dispara el fetch (y que escribimos en la URL) espera
// a que el usuario haga una pausa, para no pegarle al backend en cada tecla.
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    // Si el valor cambia antes de que venza el timer, lo cancelamos y reiniciamos
    // la espera: así solo se propaga el último valor tras la pausa.
    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
}
