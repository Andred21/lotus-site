import { expect, test } from '@playwright/test'
import { fingirTurnstile } from './contato-falso'

declare global {
  interface Window {
    semRecarga?: boolean
  }
}

// A home carrega o widget do Turnstile perto de #Contacto; o script falso
// impede a requisição real.
test.beforeEach(async ({ page }) => {
  await fingirTurnstile(page)
})

const ANCORAS = [
  ['Quienes Somos', 'Somos'],
  ['Cursos', 'Cursos'],
  ['Contacto', 'Contacto'],
] as const

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('do /validar, cada âncora leva à seção certa da home', async ({
    page,
  }) => {
    for (const [nome, id] of ANCORAS) {
      await page.goto('/validar')
      await page
        .getByRole('navigation', { name: 'Principal' })
        .getByRole('link', { name: nome })
        .click()
      await expect(page).toHaveURL(new RegExp(`/#${id}$`))
      await expect(page.locator(`#${id}`)).toBeInViewport()
    }
  })

  test('na home a âncora rola sem recarregar', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      window.semRecarga = true
    })
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Cursos' })
      .click()
    await expect(page.locator('#Cursos')).toBeInViewport()
    expect(await page.evaluate(() => window.semRecarga)).toBe(true)
  })

  test('aria-current só em /validar', async ({ page }) => {
    await page.goto('/validar')
    await expect(
      page.getByRole('link', { name: 'Validar Certificado' }),
    ).toHaveAttribute('aria-current', 'page')

    await page.goto('/')
    await expect(page.locator('[aria-current]')).toHaveCount(0)
  })

  test('o menu cabe numa linha em 1000 px', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 })
    await page.goto('/')

    const nav = page.getByRole('navigation', { name: 'Principal' })
    const links = nav.getByRole('link')
    await expect(links).toHaveCount(5)
    // Com a fonte ainda em troca, a linha de base muda 1-2 px entre links
    // medidos em instantes diferentes; mede só depois de a fonte assentar.
    await page.evaluate(() => document.fonts.ready)

    const caixas = []
    for (let i = 0; i < 5; i++) {
      const caixa = await links.nth(i).boundingBox()
      if (!caixa) throw new Error(`link ${i} sem caixa`)
      caixas.push(caixa)
    }
    const logo = await page.getByAltText('LOTUS', { exact: true }).boundingBox()
    if (!logo) throw new Error('logo sem caixa')

    const primeiro = caixas[0]!
    for (const caixa of caixas) {
      expect(Math.abs(caixa.y - primeiro.y)).toBeLessThanOrEqual(1)
    }
    const folga = primeiro.x - (logo.x + logo.width)
    expect(folga).toBeGreaterThan(0)
  })
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('do /validar o menu leva a Contacto na home', async ({ page }) => {
    await page.goto('/validar')
    await page.getByRole('button', { name: 'Abrir menú' }).click()
    await page
      .getByRole('navigation', { name: 'Mobile' })
      .getByRole('link', { name: 'Contacto' })
      .click()
    await expect(page.locator('#Contacto')).toBeInViewport()
  })
})
