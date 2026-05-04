import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages base. Local dev uses '/' automatically? No — Vite always uses `base` for both.
// Phase-1 plan locks `base: '/movie-diary/'`. The dev server will serve from /movie-diary/ as well.
export default defineConfig({
  plugins: [react()],
  base: '/movie-diary/',
});
