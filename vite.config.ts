import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Fijamos el puerto en 5173 de forma explícita porque el allowlist de CORS
    // del backend del curso valida hostname + puerto, y http://localhost:5173 es
    // uno de los orígenes permitidos. strictPort evita que Vite salte a otro
    // puerto si el 5173 está ocupado y nos deje fuera del allowlist sin avisar.
    port: 5173,
    strictPort: true,
  },
});
