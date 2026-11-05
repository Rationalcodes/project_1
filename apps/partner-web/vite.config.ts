import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'GOOGLE_'],
  server: {
    port: 5174,
    strictPort: true,
    host: true,
  },
});
