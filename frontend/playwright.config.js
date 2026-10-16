import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { defineConfig, devices } from '@playwright/test'

const frontendDirectory = fileURLToPath(new URL('.', import.meta.url))

const backendCommand = [
  'python ../manage.py migrate --settings=config.settings_e2e --noinput',
  'python ../manage.py seed_e2e --settings=config.settings_e2e',
  'python ../manage.py runserver 127.0.0.1:8002 --settings=config.settings_e2e --noreload',
].join(' && ')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: backendCommand,
      cwd: frontendDirectory,
      url: 'http://127.0.0.1:8002/health/ready/',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DJANGO_SECRET_KEY: 'e2e-bootstrap-only-not-production',
        DJANGO_DEBUG: 'True',
        DATABASE_URL: 'sqlite:///:memory:',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
      cwd: frontendDirectory,
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        VITE_API_BASE_URL: 'http://127.0.0.1:8002',
        VITE_OAUTH_CLIENT_ID: 'vetcrm-e2e-client',
        VITE_OAUTH_REDIRECT_URI: 'http://127.0.0.1:5174/auth/callback',
      },
    },
  ],
})