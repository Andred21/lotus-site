import { defineConfig, devices } from '@playwright/test'

// Smoke de produção (`7.2.4`, spec D9): roda contra um endereço real, fora de
// `pnpm check` e de `pnpm e2e`, porque depende de rede e de produção. Sem
// webServer. Um worker e sem paralelismo: a ordem dos nove itens é a do
// relatório, e o Chromium é lançado uma vez com a resolução forçada.
// SMOKE_URL, SMOKE_VIA e SMOKE_SHA são lidos em e2e/smoke/alvo.ts.
export default defineConfig({
  testDir: './e2e/smoke',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.SMOKE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'smoke' }],
})
