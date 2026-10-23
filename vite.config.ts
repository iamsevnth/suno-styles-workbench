import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  // Relative asset URLs work under the GitHub Pages project path and inside the offline file.
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
  },
  server: {
    // AI Studio sets DISABLE_HMR while an agent edits files, to stop the preview flickering.
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
