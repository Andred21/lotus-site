import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home produz auditoria axe e reporta violações', async ({
  page,
}, testInfo) => {
  await page.goto('/')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()

  await testInfo.attach('axe-home.json', {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  })

  for (const violation of results.violations) {
    console.warn(
      `[axe] ${violation.id} (${violation.impact}): ${violation.nodes.length} nó(s)`,
    )
  }

  // Este bloco prova que a auditoria executa, não que a página passa. O alvo
  // ainda é a home do scaffold Vite. O gate que reprova violação nasce no
  // Sprint 4 — débito D-11.
  expect(Array.isArray(results.violations)).toBe(true)
})
