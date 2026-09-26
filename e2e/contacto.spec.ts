import { createHash } from 'node:crypto'
import { expect, test } from '@playwright/test'
import {
  TOKEN_FALSO,
  TURNSTILE_SCRIPT,
  fingirApiContacto,
  fingirTurnstile,
  preencherContato,
  type Capturada,
} from './contato-falso'

const SUCCESS =
  'Gracias. Recibimos su mensaje y le contactaremos a la brevedad.'
const INVALID = 'Revise los campos marcados y vuelva a enviar.'
const FAILURE =
  'No pudimos enviar su mensaje. Intente nuevamente o escríbanos al correo indicado más arriba.'

test.beforeEach(async ({ page }) => {
  await fingirTurnstile(page)
})

test('o script do Turnstile só é pedido quando o formulário se aproxima', async ({
  page,
}) => {
  const pedidos: string[] = []
  page.on('request', (request) => {
    if (request.url().startsWith('https://challenges.cloudflare.com/')) {
      pedidos.push(request.url())
    }
  })

  // Viewport baixa de propósito: garante que #Contacto começa a mais de
  // 400px da borda inferior, senão o observer dispararia no carregamento.
  await page.setViewportSize({ width: 1440, height: 600 })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(pedidos).toEqual([])

  await page.locator('#Contacto').scrollIntoViewIfNeeded()
  await expect.poll(() => pedidos.length).toBe(1)
  expect(pedidos[0]).toContain('render=explicit')
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(
    TOKEN_FALSO,
  )
})

test('entrada inválida não vira requisição e mostra o erro do campo', async ({
  page,
}) => {
  const capturadas: Capturada[] = []
  await fingirApiContacto(page, { status: 200, ok: true }, capturadas)

  await page.goto('/')
  await page.getByLabel('Nombre Completo').fill('A')
  await page.getByLabel('Correo Electrónico').fill('no-es-un-correo')
  await page.getByLabel('Mensaje').fill('corto')
  await page.getByRole('button', { name: 'Enviar' }).click()

  await expect(page.getByRole('status')).toHaveText(INVALID)
  await expect(
    page.getByText('Ingrese un correo electrónico válido.'),
  ).toBeVisible()
  await expect(page.getByLabel('Correo Electrónico')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  expect(capturadas).toEqual([])
})

test('sem token do captcha, o envio para no schema, antes da rede', async ({
  page,
}) => {
  // O script não carrega: nenhum input oculto, nenhum token.
  await page.unroute(TURNSTILE_SCRIPT)
  await page.route(TURNSTILE_SCRIPT, (route) => route.abort())
  const capturadas: Capturada[] = []
  await fingirApiContacto(page, { status: 200, ok: true }, capturadas)

  await page.goto('/')
  await page.getByLabel('Nombre Completo').fill('Ana Pérez')
  await page.getByLabel('Correo Electrónico').fill('ana@lotusotec.cl')
  await page
    .getByLabel('Mensaje')
    .fill('Necesito información sobre el curso de alta tensión.')
  await page.getByRole('button', { name: 'Enviar' }).click()

  await expect(page.getByRole('status')).toHaveText(INVALID)
  await expect(page.getByText('Confirme que no es un robot.')).toBeVisible()
  expect(capturadas).toEqual([])
})

test('envio válido chega a /api/contacto com o hash do corpo e o token', async ({
  page,
}) => {
  const capturadas: Capturada[] = []
  await fingirApiContacto(page, { status: 200, ok: true }, capturadas)

  await page.goto('/')
  await preencherContato(page)
  await page.getByRole('button', { name: 'Enviar' }).click()

  await expect(page.getByRole('status')).toHaveText(SUCCESS)
  expect(capturadas).toHaveLength(1)
  const chamada = capturadas[0]
  expect(chamada?.method).toBe('POST')
  // O hash é do corpo EXATO que chegou: é o que o OAC exige (spec D1).
  expect(chamada?.hash).toBe(
    createHash('sha256')
      .update(chamada?.body ?? '', 'utf8')
      .digest('hex'),
  )
  const payload: {
    nombre?: string
    mensaje?: string
    captcha?: string
    botcheck?: string
  } = JSON.parse(chamada?.body ?? '{}')
  expect(payload.nombre).toBe('Ana Pérez')
  expect(payload.mensaje).toBe(
    'Necesito información sobre el curso de alta tensión.',
  )
  expect(payload.captcha).toBe(TOKEN_FALSO)
  expect(payload.botcheck).toBeUndefined()
  await expect(page.getByLabel('Nombre Completo')).toHaveValue('')
})

test('falha da função vira erro visível, sem vazar detalhe, e o token é descartado', async ({
  page,
}) => {
  await fingirApiContacto(page, { status: 502, ok: false })

  await page.goto('/')
  await preencherContato(page)
  await page.getByRole('button', { name: 'Enviar' }).click()

  await expect(page.getByRole('status')).toHaveText(FAILURE)
  await expect(page.getByText('502')).toHaveCount(0)
  await expect(page.getByLabel('Mensaje')).toHaveValue(
    'Necesito información sobre el curso de alta tensión.',
  )
  await expect(
    page.locator('input[name="cf-turnstile-response"]'),
  ).toHaveAttribute('data-resets', '1')
})

test('o bloco de status não desloca o formulário antes da interação', async ({
  page,
}) => {
  await page.goto('/')

  const status = page.getByRole('status')
  const nombre = page.getByLabel('Nombre Completo')
  await expect(status).toHaveText('')
  await expect(status).toHaveCSS('margin-bottom', '0px')

  // Posição absoluta no documento: o foco vai para o status depois do envio e
  // rola a página, então coordenada de viewport compararia coisas diferentes.
  const topoDoDocumento = () =>
    nombre.evaluate((node) => node.getBoundingClientRect().top + window.scrollY)
  const antes = await topoDoDocumento()

  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(status).toHaveText(INVALID)
  await expect(status).toHaveCSS('margin-bottom', '16px')

  expect(await topoDoDocumento()).toBeGreaterThan(antes)
})
