import { expect, test } from '@playwright/test'

test('home responde 200, declara o idioma e mostra o título real', async ({
  page,
}) => {
  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-CL')
  await expect(
    page.getByRole('heading', { level: 1, name: 'LOTUS OTEC' }),
  ).toBeVisible()
})

test('os três links de âncora levam à seção certa, com o cabeçalho compensado', async ({
  page,
}) => {
  // Viewport explícito: o menu desktop só existe acima de --breakpoint-desktop,
  // e o default do projeto Chromium (1280px) pode ficar abaixo dele.
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  for (const [label, id] of [
    ['Quienes Somos', 'Somos'],
    ['Cursos', 'Cursos'],
    ['Contacto', 'Contacto'],
  ] as const) {
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: label })
      .click()
    await expect(page).toHaveURL(new RegExp(`#${id}$`))

    // `scroll-behavior: smooth` anima: a medição espera o scroll assentar.
    // A seção para abaixo do cabeçalho de 94px, não atrás dele.
    const top = () =>
      page
        .locator(`#${id}`)
        .evaluate((element) => element.getBoundingClientRect().top)

    await expect.poll(top).toBeLessThan(120)
    expect(await top()).toBeGreaterThanOrEqual(0)
  }
})
