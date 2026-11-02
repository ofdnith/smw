import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120000,
  retries: 0,
  use: { viewport: { width: 640, height: 360 } },
  webServer: { command: 'npx vite --port 5195 --strictPort', port: 5195, reuseExistingServer: true, timeout: 60000 },
});
