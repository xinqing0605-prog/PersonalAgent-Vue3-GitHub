import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const localPython = fileURLToPath(new URL(process.platform === 'win32'
  ? '../.venv/Scripts/python.exe' : '../.venv/bin/python', import.meta.url))
const python = process.env.AGENT_TEST_PYTHON || (existsSync(localPython) ? localPython : 'python')

export default defineConfig({
  testDir: './e2e',
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || '../work/vue-e2e-results',
  timeout: 60_000,
  workers: 1,
  reporter: 'list',
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: `"${python}" -B e2e/server.py`,
    url: 'http://127.0.0.1:18883/api/ready',
    reuseExistingServer: false,
    timeout: 30_000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:18883',
    viewport: { width: 1440, height: 1000 },
    channel: process.platform === 'win32' ? 'msedge' : 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})
