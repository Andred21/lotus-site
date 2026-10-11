// Ferramenta de inventário: roda em Node, nunca entra no bundle da aplicação.
/// <reference lib="dom" />
import { chromium } from '@playwright/test'

export const SITE_URL = 'https://lotusotec.cl/'
export const OUT_DIR = 'docs/inventario'

/**
 * Endereço do WordPress de referência. Desde o corte (B5, 2026-10-05) o DNS de
 * lotusotec.cl aponta para a CloudFront e `SITE_URL` entrega o clone; o
 * WordPress só responde neste IP, o mesmo do registro A de
 * `infra/rollback-corte.json`.
 */
export const WORDPRESS_IP = '185.146.167.195'

/**
 * Chromium que resolve lotusotec.cl e www para o WordPress. URL, Host e SNI
 * continuam lotusotec.cl, então o certificado do WordPress valida sem
 * `ignoreHTTPSErrors`; quando ele vencer, a captura falha por TLS em vez de
 * medir outro alvo. Hosts fora do domínio, como localhost, não mudam.
 * @returns {Promise<import('@playwright/test').Browser>}
 */
export function launchReferencia() {
  return chromium.launch({
    args: [
      `--host-resolver-rules=MAP lotusotec.cl ${WORDPRESS_IP}, MAP www.lotusotec.cl ${WORDPRESS_IP}`,
    ],
  })
}

/**
 * Reprova a resposta da referência quando ela veio da distribuição do clone.
 * @param {Record<string, string>} headers cabeçalhos com nome em minúsculas,
 *   como `Response.headers()` do Playwright devolve
 */
export function exigirWordPress(headers) {
  const origem = `${headers['server'] ?? ''} ${headers['via'] ?? ''}`
  if (/cloudfront/i.test(origem)) {
    throw new Error(
      `a referência não é o WordPress: a resposta veio da CloudFront (server: ${headers['server'] ?? '—'})`,
    )
  }
}

/** @typedef {{ name: string, width: number, height: number }} Viewport */

/** @type {Viewport[]} */
export const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
]

/**
 * Viewport de referência para medições que não variam por largura.
 * @returns {Viewport}
 */
export function desktopViewport() {
  const viewport = VIEWPORTS.find((candidate) => candidate.name === '1440')
  if (!viewport) throw new Error('viewport 1440 ausente em VIEWPORTS')
  return viewport
}

/**
 * Nome local estável para um asset remoto. O host de staging ganha prefixo
 * para que dois hosts com o mesmo basename não colidam no diretório local.
 * @param {string} url
 * @returns {string}
 */
export function assetFileName(url) {
  const parsed = new URL(url)
  const segments = parsed.pathname.split('/')
  // Último segmento vazio (URL terminada em '/') resolveria para nome vazio e
  // faria writeFileSync escrever sobre o próprio diretório: cai no fallback.
  const base = decodeURIComponent(segments[segments.length - 1] || 'asset')
  return parsed.hostname.includes('stackstaging') ? `staging-${base}` : base
}

/**
 * @param {string} value
 * @returns {string}
 */
export function rgbToHex(value) {
  const match = value.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
  )
  if (!match) return value
  const [, r, g, b, a] = match
  if (r === undefined || g === undefined || b === undefined) return value
  if (a !== undefined && Number(a) === 0) return 'transparent'
  const hex = [r, g, b]
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('')
  return `#${hex}`
}

/**
 * Abre a home no viewport pedido, espera a rede parar e rola a página inteira
 * para disparar o lazy-load do Divi antes de qualquer medição ou captura.
 * @param {Viewport} viewport
 * @returns {Promise<{ browser: import('@playwright/test').Browser, page: import('@playwright/test').Page }>}
 */
export async function openPage(viewport) {
  const browser = await launchReferencia()
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  })
  // 'networkidle' nunca resolve: wp-admin/admin-ajax.php?action=rest-nonce
  // fica pendente indefinidamente no site atual. 'load' + scroll cobre o
  // lazy-load do Divi sem depender dessa requisição travada.
  const response = await page.goto(SITE_URL, {
    waitUntil: 'load',
    timeout: 60_000,
  })
  if (!response) throw new Error(`sem resposta de ${SITE_URL}`)
  exigirWordPress(response.headers())
  await page.evaluate(async () => {
    const step = window.innerHeight
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(1000)
  return { browser, page }
}

/**
 * Larguras intermediárias que faltavam ao inventário: os quatro viewports da
 * Sprint 1 só provam que as duas viradas estão entre 768 e 1440.
 * @type {number[]}
 */
export const BREAKPOINT_WIDTHS = [900, 1000, 1100, 1200, 1300, 1400]

/**
 * Cor CSS preservando transparência: `rgbToHex` descarta o alpha, e uma cor
 * translúcida sairia na tabela como se fosse opaca.
 * @param {string} value
 * @returns {string}
 */
export function cssColor(value) {
  const match = value.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
  )
  if (!match) return value
  const [, r, g, b, a] = match
  if (r === undefined || g === undefined || b === undefined) return value
  const alpha = a === undefined ? 1 : Number(a)
  if (alpha === 0) return 'transparent'
  if (alpha < 1) return `rgba(${r}, ${g}, ${b}, ${alpha})`
  const hex = [r, g, b]
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('')
  return `#${hex}`
}
