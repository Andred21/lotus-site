import { expect, test } from '@playwright/test'

// Guarda de pixel do build de produção. Roda no projeto `producao`
// (`vite preview` na 5184), não no dev server: a mudança que ele guarda — o
// `<link rel="preload">` injetado por `scripts/vite/preload-critical.mjs` —
// só existe no bundle. Rodar no `chromium` provava que o dev server não
// mudou, o que era verdadeiro e insuficiente (`D-25`).
// Não é diff contra o WordPress: as divergências intencionais aprovadas na
// matriz produziriam diferença alta e legítima (D9 do bloco 6.1.1-6.3.1).
const VIEWPORTS = [
  { nome: '375', width: 375, height: 812 },
  { nome: '1440', width: 1440, height: 900 },
] as const

for (const viewport of VIEWPORTS) {
  test(`a home não muda um pixel em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })
    await page.goto('/')
    await expect(page).toHaveScreenshot(`home-${viewport.nome}.png`, {
      fullPage: true,
      animations: 'disabled',
    })
  })
}
