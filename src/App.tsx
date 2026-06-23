// Andamiaje inicial: por ahora App solo confirma que el tooling (Vite, React,
// Tailwind y TypeScript estricto) está montado y funcionando. El árbol de rutas
// real se cablea más adelante, cuando ya existan el cliente HTTP, el backbone de
// auth, los primitivos de UI y el layout.
export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">TropelCare Control Room</h1>
        <p className="mt-2 text-slate-400">Andamiaje en construcción…</p>
      </div>
    </main>
  );
}
