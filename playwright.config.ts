import { defineConfig, devices } from '@playwright/test'

// Porta própria do E2E: 5173 é a do `pnpm dev` e pode estar ocupada por
// outro projeto. `--strictPort` faz a colisão falhar alto em vez de o
// Playwright reaproveitar silenciosamente um servidor alheio. E2E_PORT é a
// saída quando a porta padrão já está tomada na máquina.
const PORT = Number(process.env.E2E_PORT ?? 5183)
const baseURL = `http://localhost:${PORT}`

// Porta separada da do dev server: `6.2.3` exige o build de produção, não o
// bundle de desenvolvimento com HMR e sourcemaps.
const PREVIEW_PORT = Number(process.env.E2E_PREVIEW_PORT ?? 5184)
const previewURL = `http://localhost:${PREVIEW_PORT}`

// Fluxo principal do site. a11y e seo ficam fora: as exceções nominais de
// `e2e/a11y-exceptions.ts` foram medidas em Chromium (D-21), e replicá-las em
// três motores multiplicaria exceção sem ganho de sinal.
const FLUXO_PRINCIPAL = [
  '**/home.spec.ts',
  '**/menu.spec.ts',
  '**/contacto.spec.ts',
]

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
      testIgnore: ['**/producao.spec.ts', '**/regressao-visual.spec.ts'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: FLUXO_PRINCIPAL,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: FLUXO_PRINCIPAL,
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'] },
      testMatch: FLUXO_PRINCIPAL,
    },
    {
      name: 'producao',
      use: { ...devices['Desktop Chrome'], baseURL: previewURL },
      testMatch: ['**/producao.spec.ts', '**/regressao-visual.spec.ts'],
    },
  ],
  webServer: [
    {
      command: `pnpm dev --port ${PORT} --strictPort`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
      // Site key de TESTE da Cloudflare (`1x00000000000000000000AA`, spec
      // D6), pública por definição: é o que liga o adapter e o widget no E2E.
      // Nenhuma requisição real sai — o script do Turnstile e `/api/contacto`
      // são servidos por `page.route` em `e2e/contato-falso.ts`.
      env: { VITE_TURNSTILE_SITE_KEY: '1x00000000000000000000AA' },
    },
    {
      command: `pnpm build && pnpm preview --port ${PREVIEW_PORT} --strictPort`,
      url: previewURL,
      reuseExistingServer: false,
      timeout: 180_000,
      // A chave entra no build: no Vite a variável é resolvida em tempo de
      // compilação, não em runtime.
      env: { VITE_TURNSTILE_SITE_KEY: '1x00000000000000000000AA' },
    },
  ],
})
