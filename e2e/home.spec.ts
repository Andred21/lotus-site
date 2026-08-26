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
