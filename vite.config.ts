import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@kumbhakaran/ui': path.resolve(import.meta.dirname, 'packages/ui/src'),
      '@kumbhakaran/shared-types': path.resolve(import.meta.dirname, 'packages/shared-types/src'),
      '@kumbhakaran/api-client': path.resolve(import.meta.dirname, 'packages/api-client/src'),
    },
  },
});
