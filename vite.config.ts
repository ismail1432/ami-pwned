/// <reference types="vitest" />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    // dist/ is cleaned by `npm run clean`; the content script build writes into the same folder.
    emptyOutDir: false,
    rollupOptions: {
      input: { background: resolve(__dirname, 'src/background/serviceWorker.ts') },
      // manifest.json references background.js by a fixed name.
      output: { entryFileNames: 'background.js' },
    },
  },
  test: {
    environment: 'jsdom',
    restoreMocks: true,
  },
});
