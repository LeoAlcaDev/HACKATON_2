interface ErrorStateProps {
  title?: string;
  message?: string;
  // Acción de reintento opcional: si el caller la pasa, mostramos el botón.
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Algo salió mal',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-6 py-10 text-center"
    >
      <h2 className="text-base font-semibold text-red-300">{title}</h2>
      {message ? <p className="max-w-md text-sm text-slate-400">{message}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-md border border-red-500/40 px-4 py-1.5 text-sm font-medium text-red-200 transition hover:bg-red-500/10"
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
