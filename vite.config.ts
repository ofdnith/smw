import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'es2022', outDir: 'dist', assetsInlineLimit: 0 },
  server: { port: 5173, strictPort: true },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
