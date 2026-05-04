import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// dev → '/', prod build → '/movie-diary/'.
// BrowserRouter reads import.meta.env.BASE_URL to keep routes in sync.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/movie-diary/' : '/',
}));
