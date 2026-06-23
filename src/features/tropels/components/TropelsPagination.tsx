interface TropelsPaginationProps {
  // currentPage y totalPages vienen de la respuesta del backend. currentPage es
  // 0-based, así que para el indicador humano sumamos 1.
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onPrev: () => void;
  onNext: () => void;
}

const BUTTON_CLASS =
  'rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';

export function TropelsPagination({
  currentPage,
  totalPages,
  totalElements,
  onPrev,
  onNext,
}: TropelsPaginationProps) {
  // Deshabilitamos prev en la primera página y next cuando ya estamos en la última.
  // Con totalPages 0 (sin resultados) ambos quedan deshabilitados.
  const isFirstPage = currentPage <= 0;
  const isLastPage = currentPage >= totalPages - 1;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-slate-500">
        {totalElements} tropeles en total
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirstPage}
          className={BUTTON_CLASS}
        >
          Anterior
        </button>

        <span className="text-sm tabular-nums text-slate-400">
          Página {currentPage + 1} de {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={isLastPage}
          className={BUTTON_CLASS}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
