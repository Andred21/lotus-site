import { defineConfig, devices } from '@playwright/test'

// Porta própria do E2E: 5173 é a do `pnpm dev` e pode estar ocupada por
// outro projeto. `--strictPort` faz a colisão falhar alto em vez de o
// Playwright reaproveitar silenciosamente um servidor alheio. E2E_PORT é a
// saída quando a porta padrão já está tomada na máquina.
const PORT = Number(process.env.E2E_PORT ?? 5183)
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    // Chave falsa: o E2E precisa do adapter Web3Forms montado para poder
    // interceptar a rota. Nenhum envio real sai — todo teste que submete
    // intercepta `api.web3forms.com` (D6 da spec: não há conta nesta rodada).
    env: { VITE_WEB3FORMS_ACCESS_KEY: 'e2e-fake-access-key' },
  },
})
