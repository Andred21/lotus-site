import { expect, test, type Page } from '@playwright/test'
import {
  CONSULTA_VIGENTE,
  NOME_DO_PDF,
  POR_VENCER,
  REVOGADO,
  UUID,
  VENCIDO,
  VIGENTE,
  fingirApiCertificados,
  type PedidoCapturado,
} from './certificados-falsos'

// A3 da spec: a página de validação nos quatro motores (D15), com a API
// simulada em `https://app.lotusotec.cl` e os headers CORS de produção.

const FALHA = 'No pudimos validar el certificado ahora. Intente más tarde.'
const CODIGO = 'LOT-2026-144'
const RUT = '12.345.678-5'

function titulo(page: Page, nome: string) {
  return page.getByRole('heading', { level: 2, name: nome })
}

function botaoDoPdf(page: Page) {
  return page.getByRole('button', { name: 'DESCARGAR PDF' })
}

function validar(page: Page) {
  return page.getByRole('button', { name: 'VALIDAR' })
}

async function consultar(page: Page, codigo = CODIGO, rut = RUT) {
  await page.getByLabel('N° de registro').fill(codigo)
  await page.getByLabel('RUT del alumno').fill(rut)
  await validar(page).click()
}

test.describe('pelo QR', () => {
  test('vigente mostra o cartão e baixa o PDF com o nome do Content-Disposition', async ({
    page,
  }) => {
    await fingirApiCertificados(page, {
      uuid: { status: 200, corpo: VIGENTE },
      pdf: { status: 200 },
    })
    await page.goto(`/validar/${UUID}`)

    await expect(titulo(page, 'Certificado válido')).toBeVisible()
    await expect(page.getByText('María Fernanda Rojas')).toBeVisible()
    // P16: o schema descarta `cliente` e `redator`.
    await expect(page.getByText('Empresa Eléctrica del Sur')).toHaveCount(0)

    const download = page.waitForEvent('download')
    await botaoDoPdf(page).click()
    expect((await download).suggestedFilename()).toBe(NOME_DO_PDF)
  })

  test('por vencer avisa abaixo das linhas', async ({ page }) => {
    await fingirApiCertificados(page, {
      uuid: { status: 200, corpo: POR_VENCER },
    })
    await page.goto(`/validar/${UUID}`)

    await expect(titulo(page, 'Certificado válido')).toBeVisible()
    await expect(page.getByText('Próximo a vencer')).toBeVisible()
  })

  test('vencido mostra a data de vencimento e o botão do PDF', async ({
    page,
  }) => {
    await fingirApiCertificados(page, {
      uuid: { status: 200, corpo: VENCIDO },
    })
    await page.goto(`/validar/${UUID}`)

    await expect(titulo(page, 'Certificado vencido')).toBeVisible()
    await expect(page.getByText('Venció el', { exact: true })).toBeVisible()
    await expect(botaoDoPdf(page)).toBeVisible()
  })

  test('revogado mostra a data de Santiago e não oferece o PDF', async ({
    page,
  }) => {
    await fingirApiCertificados(page, {
      uuid: { status: 200, corpo: REVOGADO },
    })
    await page.goto(`/validar/${UUID}`)

    await expect(titulo(page, 'Certificado revocado')).toBeVisible()
    // P10: `revoked_at` com microssegundos, nunca "Invalid Date".
    await expect(page.getByText('5 de octubre de 2026')).toBeVisible()
    await expect(botaoDoPdf(page)).toHaveCount(0)
  })

  test('não encontrado fala do QR', async ({ page }) => {
    await fingirApiCertificados(page, { uuid: { status: 404 } })
    await page.goto(`/validar/${UUID}`)

    await expect(titulo(page, 'No encontramos este certificado')).toBeVisible()
  })

  test('espera tenta de novo sozinha ao chegar a zero', async ({ page }) => {
    // Desvio do brief (`uuid: [429, 200]` e dois pedidos): no dev server o
    // `StrictMode` monta a página duas vezes, e a abertura pelo QR sai em dois
    // `GET`, o primeiro descartado pela limpeza do efeito. Com a lista, o 200
    // caía no segundo pedido da abertura e a espera nunca aparecia. Por isso
    // o 429 vale para toda a abertura e o 200 só entra depois de a espera
    // estar na tela (a rota registrada por último responde primeiro); a
    // prova de P4 é exatamente um pedido a mais, venha a abertura em um
    // pedido (build) ou em dois (dev).
    const capturados: PedidoCapturado[] = []
    const pedidosDoUuid = () =>
      capturados.filter((pedido) => pedido.tipo === 'uuid').length
    await fingirApiCertificados(
      page,
      { uuid: { status: 429, headers: { 'Retry-After': '2' } } },
      capturados,
    )
    await page.goto(`/validar/${UUID}`)

    await expect(
      page.getByText('Intente de nuevo en 2 segundos.'),
    ).toBeVisible()
    const daAbertura = pedidosDoUuid()
    await fingirApiCertificados(
      page,
      { uuid: { status: 200, corpo: VIGENTE } },
      capturados,
    )
    await expect(titulo(page, 'Certificado válido')).toBeVisible({
      timeout: 5_000,
    })
    expect(pedidosDoUuid()).toBe(daAbertura + 1)
  })

  test('PDF 410 vira revogado', async ({ page }) => {
    await fingirApiCertificados(page, {
      uuid: { status: 200, corpo: VIGENTE },
      pdf: { status: 410 },
    })
    await page.goto(`/validar/${UUID}`)
    await expect(titulo(page, 'Certificado válido')).toBeVisible()

    await botaoDoPdf(page).click()

    await expect(titulo(page, 'Certificado revocado')).toBeVisible()
    await expect(botaoDoPdf(page)).toHaveCount(0)
    // P6: o válido não tinha `revoked_at`, então a linha some.
    await expect(page.getByText('Revocado el', { exact: true })).toHaveCount(0)
  })

  test('rede fora vira a frase genérica', async ({ page }) => {
    await fingirApiCertificados(page, {})
    await page.goto(`/validar/${UUID}`)

    await expect(titulo(page, FALHA)).toBeVisible()
  })
})

test.describe('pelo formulário', () => {
  test('200 mostra o cartão abaixo do formulário sem mudar a URL', async ({
    page,
  }) => {
    const capturados: PedidoCapturado[] = []
    await fingirApiCertificados(
      page,
      { consulta: { status: 200, corpo: CONSULTA_VIGENTE } },
      capturados,
    )
    await page.goto('/validar')
    await consultar(page)

    await expect(titulo(page, 'Certificado válido')).toBeVisible()
    await expect(page.getByLabel('N° de registro')).toBeVisible()
    await expect(validar(page)).toBeVisible()
    await expect(page).toHaveURL(/\/validar$/)
    expect(capturados).toHaveLength(1)
    expect(capturados[0]?.method).toBe('POST')
    expect(capturados[0]?.corpo).toBe(
      '{"codigo":"LOT-2026-144","rut":"12.345.678-5"}',
    )
  })

  test('não encontrado fala dos dados digitados', async ({ page }) => {
    await fingirApiCertificados(page, { consulta: { status: 404 } })
    await page.goto('/validar')
    await consultar(page)

    await expect(
      titulo(page, 'No encontramos un certificado con esos datos'),
    ).toBeVisible()
  })

  test('422 do servidor marca o campo', async ({ page }) => {
    await fingirApiCertificados(page, {
      consulta: { status: 422, corpo: { errors: { codigo: ['x'] } } },
    })
    await page.goto('/validar')
    await consultar(page)

    await expect(page.getByText('Formato: LOT-2026-123')).toBeVisible()
    await expect(page.getByText('RUT inválido')).toHaveCount(0)
  })

  test('formato inválido não sai pedido', async ({ page }) => {
    const capturados: PedidoCapturado[] = []
    await fingirApiCertificados(
      page,
      { consulta: { status: 200, corpo: CONSULTA_VIGENTE } },
      capturados,
    )
    await page.goto('/validar')
    await consultar(page, 'LOT-26-1', '12.345.678-4')

    await expect(page.getByText('Formato: LOT-2026-123')).toBeVisible()
    await expect(page.getByText('RUT inválido')).toBeVisible()
    expect(capturados).toEqual([])
  })

  test('espera de até 60 s desativa VALIDAR e conta até voltar', async ({
    page,
  }) => {
    await fingirApiCertificados(page, {
      consulta: { status: 429, headers: { 'Retry-After': '2' } },
    })
    await page.goto('/validar')
    await consultar(page)

    await expect(
      page.getByText('Intente de nuevo en 2 segundos.'),
    ).toBeVisible()
    await expect(validar(page)).toBeDisabled()
    await expect(validar(page)).toBeEnabled({ timeout: 5_000 })
  })

  test('bloqueio acima de 60 s orienta para o QR e não trava o formulário', async ({
    page,
  }) => {
    await fingirApiCertificados(page, {
      consulta: { status: 429, headers: { 'Retry-After': '3120' } },
    })
    await page.goto('/validar')
    await consultar(page)

    await expect(page.getByText('52 minutos')).toBeVisible()
    await expect(
      page.getByText('Mientras tanto, escanee el código QR del certificado'),
    ).toBeVisible()
    await expect(validar(page)).toBeEnabled()
  })

  test('500 vira a frase genérica', async ({ page }) => {
    await fingirApiCertificados(page, { consulta: { status: 500 } })
    await page.goto('/validar')
    await consultar(page)

    await expect(titulo(page, FALHA)).toBeVisible()
  })

  test('rede fora vira a frase genérica', async ({ page }) => {
    await fingirApiCertificados(page, {})
    await page.goto('/validar')
    await consultar(page)

    await expect(titulo(page, FALHA)).toBeVisible()
  })
})

test('o RUT não aparece em URL nenhuma, nenhum pedido leva cookie e nada fica guardado', async ({
  page,
  context,
}) => {
  // Um cookie que um `fetch` com credenciais levaria ao app: o adapter usa
  // `credentials: 'omit'`, então nenhum pedido o carrega.
  await context.addCookies([
    {
      name: 'sessao',
      value: 'x',
      domain: 'app.lotusotec.cl',
      path: '/',
      secure: true,
      sameSite: 'None',
    },
  ])
  const urls: string[] = []
  page.on('request', (pedido) => urls.push(pedido.url()))
  const capturados: PedidoCapturado[] = []
  await fingirApiCertificados(
    page,
    {
      consulta: { status: 200, corpo: CONSULTA_VIGENTE },
      pdf: { status: 200 },
    },
    capturados,
  )

  await page.goto('/validar')
  await consultar(page)
  await expect(titulo(page, 'Certificado válido')).toBeVisible()
  const download = page.waitForEvent('download')
  await botaoDoPdf(page).click()
  await download

  expect(capturados.map((pedido) => pedido.tipo)).toEqual(['consulta', 'pdf'])
  for (const url of [...urls, page.url()]) {
    for (const rut of ['12.345.678', '12345678', '123456785']) {
      expect(url, `${url} contém o RUT`).not.toContain(rut)
    }
  }
  for (const pedido of capturados) {
    expect(pedido.cookie, `${pedido.method} ${pedido.url}`).toBeUndefined()
  }
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
})
