import { expect, test } from '@playwright/test'

// Guarda de `6.2.2`: compara o clone com ele mesmo, antes e depois da
// otimização. Não é diff contra o WordPress — as divergências intencionais
// aprovadas na matriz produziriam diferença alta e legítima (D9 da spec).
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
