import { expect, test } from '@playwright/test'

test('home responde 200 e declara o idioma do clone', async ({ page }) => {
  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-CL')
})
