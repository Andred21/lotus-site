import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 } })

test('menu mobile abre, fecha e não prende o scroll', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByRole('button', { name: 'Abrir menú' })
  await toggle.click()

  const nav = page.getByRole('navigation', { name: 'Mobile' })
  await expect(nav).toBeVisible()
  await expect(nav.getByRole('link')).toHaveCount(4)

  const overflow = await page.evaluate(
    () => getComputedStyle(document.body).overflow,
  )
  expect(overflow).not.toBe('hidden')

  await page.keyboard.press('Escape')
  await expect(nav).toBeHidden()
  await expect(toggle).toBeFocused()
})

test('menu mobile é operável só pelo teclado', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Abrir menú' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Inicio' })).toBeFocused()
})
