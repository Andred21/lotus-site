import { expect, test, type Page } from '@playwright/test'

const ENDPOINT = 'https://api.web3forms.com/**'

const SUCCESS =
  'Gracias. Recibimos su mensaje y le contactaremos a la brevedad.'
const INVALID = 'Revise los campos marcados y vuelva a enviar.'
const FAILURE =
  'No pudimos enviar su mensaje. Intente nuevamente o escríbanos al correo indicado más arriba.'

async function fillContact(page: Page) {
  await page.getByLabel('Nombre Completo').fill('Ana Pérez')
  await page.getByLabel('Correo Electrónico').fill('ana@lotusotec.cl')
  await page.getByLabel('Empresa').fill('Lotus')
  await page
    .getByLabel('Mensaje')
    .fill('Necesito información sobre el curso de alta tensión.')
}

test('entrada inválida não vira requisição e mostra o erro do campo', async ({
  page,
}) => {
  const requests: string[] = []
  await page.route(ENDPOINT, async (route) => {
    requests.push(route.request().url())
    await route.abort()
  })

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
  expect(requests).toEqual([])
})

test('envio válido chega ao provedor com a chave e o payload da mensagem', async ({
  page,
}) => {
  const accessKeys: string[] = []
  const names: string[] = []
  const messages: string[] = []

  await page.route(ENDPOINT, async (route) => {
    const payload: { access_key?: string; name?: string; message?: string } =
      route.request().postDataJSON()
    accessKeys.push(payload.access_key ?? '')
    names.push(payload.name ?? '')
    messages.push(payload.message ?? '')

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Email sent' }),
    })
  })

  await page.goto('/')
  await fillContact(page)
  await page.getByRole('button', { name: 'Enviar' }).click()

  await expect(page.getByRole('status')).toHaveText(SUCCESS)
  expect(accessKeys).toEqual(['e2e-fake-access-key'])
  expect(names).toEqual(['Ana Pérez'])
  expect(messages).toEqual([
    'Necesito información sobre el curso de alta tensión.',
  ])
  await expect(page.getByLabel('Nombre Completo')).toHaveValue('')
})

test('falha do provedor vira erro visível, sem vazar detalhe e sem perder o texto', async ({
  page,
}) => {
  await page.route(ENDPOINT, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Invalid access key' }),
    })
  })

  await page.goto('/')
  await fillContact(page)
  await page.getByRole('button', { name: 'Enviar' }).click()

  await expect(page.getByRole('status')).toHaveText(FAILURE)
  await expect(page.getByText('Invalid access key')).toHaveCount(0)
  await expect(page.getByLabel('Mensaje')).toHaveValue(
    'Necesito información sobre el curso de alta tensión.',
  )
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
