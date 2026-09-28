import { expect, type Page } from '@playwright/test'

export const TURNSTILE_SCRIPT =
  'https://challenges.cloudflare.com/turnstile/v0/**'
export const API_CONTACTO = '**/api/contacto'
export const TOKEN_FALSO = 'token-falso-do-e2e'

// `window.turnstile` falso com a superfície que o controlador usa. `render`
// insere o input oculto com o token, como o widget real; `reset` conta as
// chamadas em `data-resets`, para o teste provar que o formulário descartou
// o token. Nenhum byte sai para a Cloudflare.
const SCRIPT_FALSO = `
window.turnstile = {
  render(container, options) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = options['response-field-name']
    input.value = '${TOKEN_FALSO}'
    input.dataset.resets = '0'
    container.append(input)
    return 'widget-falso'
  },
  reset() {
    const input = document.querySelector('input[name="cf-turnstile-response"]')
    if (input) input.dataset.resets = String(Number(input.dataset.resets) + 1)
  },
}
`

/** Serve o script do Turnstile falso. Toda spec que navega para `/` chama isto. */
export async function fingirTurnstile(page: Page) {
  await page.route(TURNSTILE_SCRIPT, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: SCRIPT_FALSO,
    }),
  )
}

export type Capturada = { method: string; hash: string; body: string }

/** Intercepta `/api/contacto`, responde o que o teste mandar e guarda o que chegou. */
export async function fingirApiContacto(
  page: Page,
  resposta: { status: number; ok: boolean },
  capturadas: Capturada[] = [],
) {
  await page.route(API_CONTACTO, (route) => {
    const request = route.request()
    capturadas.push({
      method: request.method(),
      hash: request.headers()['x-amz-content-sha256'] ?? '',
      body: request.postData() ?? '',
    })
    return route.fulfill({
      status: resposta.status,
      contentType: 'application/json',
      body: JSON.stringify({ ok: resposta.ok }),
    })
  })
}

/**
 * Preenche os quatro campos e espera o token: preencher rola o formulário
 * para a viewport, o observer dispara, o script falso carrega e `render`
 * escreve o input. Sem a espera, o clique em Enviar pode vir antes.
 *
 * Desvio do brief: `scrollIntoViewIfNeeded` explícito no container do
 * captcha antes de preencher. O WebKit do Playwright, ao contrário do
 * Chromium e do Firefox, não rola a página ao focar um campo fora da
 * viewport durante `fill()` — só o Chromium/Firefox fazem esse scroll
 * nativo por conta própria. Sem o scroll explícito, o container nunca
 * cruza os 400px do `rootMargin` no WebKit e o widget nunca monta,
 * embora `crypto.subtle` exista e o contexto seja seguro nesse motor
 * (verificado por sonda manual: `isSecureContext` e `crypto.subtle` são
 * ambos verdadeiros em WebKit e mobile-webkit nesta versão do Playwright
 * — a premissa do brief sobre motor sem contexto seguro não se confirmou).
 */
export async function preencherContato(page: Page) {
  await page.locator('[data-captcha]').scrollIntoViewIfNeeded()
  await page.getByLabel('Nombre Completo').fill('Ana Pérez')
  await page.getByLabel('Correo Electrónico').fill('ana@lotusotec.cl')
  await page.getByLabel('Empresa').fill('Lotus')
  await page
    .getByLabel('Mensaje')
    .fill('Necesito información sobre el curso de alta tensión.')
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(
    TOKEN_FALSO,
  )
}
