import { ALVO, expect, test } from './alvo'

// Console limpo fora do frame do Turnstile (exceção de B3, ratificada em
// docs/infra/evidencia-cabecalhos-2026-09-28.md) e nenhuma resposta ≥ 400
// vinda do próprio site — o frame da Cloudflare responde pelo que é dele.
test('4 · home: 200, H1, âncoras do menu, console limpo, nenhuma resposta ≥ 400 do site', async ({
  page,
}) => {
  const erros: string[] = []
  const quebradas: string[] = []
  page.on('console', (mensagem) => {
    const origem = mensagem.location().url
    if (
      mensagem.type() === 'error' &&
      !origem.startsWith('https://challenges.cloudflare.com')
    ) {
      erros.push(`${origem}: ${mensagem.text()}`)
    }
  })
  page.on('pageerror', (erro) => erros.push(erro.message))
  page.on('response', (resposta) => {
    if (
      resposta.status() >= 400 &&
      new URL(resposta.url()).hostname === ALVO.hostname
    ) {
      quebradas.push(`${resposta.status()} ${resposta.url()}`)
    }
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  const resposta = await page.goto('/')
  expect(resposta?.status()).toBe(200)
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-CL')
  await expect(
    page.getByRole('heading', { level: 1, name: 'LOTUS OTEC' }),
  ).toBeVisible()

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
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(2_000)
  expect(erros).toEqual([])
  expect(quebradas).toEqual([])
})
