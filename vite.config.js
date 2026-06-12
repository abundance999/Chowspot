import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use @/ as shorthand for src/ — Copilot will auto-complete these
      '@': path.resolve(__dirname, './src'),
    },
  },
});
