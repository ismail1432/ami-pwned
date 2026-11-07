import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Content scripts are injected as classic scripts (not ES modules): build a single self-contained IIFE.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/main.ts'),
      formats: ['iife'],
      name: 'amIPwnedContent',
      fileName: () => 'content.js',
    },
  },
});
