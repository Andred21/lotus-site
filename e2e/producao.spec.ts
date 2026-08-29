import { expect, test } from '@playwright/test'

// A EAP cita erro de hydration. A aplicação monta com `createRoot` em
// `src/main.tsx` e não tem SSR: não existe hydration a quebrar nesta
// arquitetura (D8 da spec). O que se prova aqui é console e network reais,
// sobre o build de produção — não sobre o dev server.
test('a jornada principal não produz erro de console nem request quebrada', async ({
  page,
}) => {
  const errosDeConsole: string[] = []
  const requestsQuebradas: string[] = []

  page.on('console', (mensagem) => {
    if (mensagem.type() === 'error') errosDeConsole.push(mensagem.text())
  })
  page.on('pageerror', (erro) => errosDeConsole.push(erro.message))
  page.on('response', (resposta) => {
    if (resposta.status() >= 400) {
      requestsQuebradas.push(`${resposta.status()} ${resposta.url()}`)
    }
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'LOTUS OTEC' }),
  ).toBeVisible()

  for (const label of ['Quienes Somos', 'Cursos', 'Contacto'] as const) {
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: label })
      .click()
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1000)

  expect(errosDeConsole).toEqual([])
  expect(requestsQuebradas).toEqual([])
})
