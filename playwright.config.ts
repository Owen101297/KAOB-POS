import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvE2e() {
  const file = path.join(__dirname, '.env.e2e');
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  }
}
loadEnvE2e();

const BASE_URL = process.env.KAOB_E2E_BASE_URL || 'https://localhost:3100';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    httpCredentials: {
      username: process.env.KAOB_E2E_AUTH_USER || '',
      password: process.env.KAOB_E2E_AUTH_PASSWORD || '',
    },
    viewport: { width: 1366, height: 850 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
        launchOptions: { args: ['--ignore-certificate-errors'] },
      },
    },
  ],
});
