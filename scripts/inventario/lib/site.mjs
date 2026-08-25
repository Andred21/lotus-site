// Ferramenta de inventário: roda em Node, nunca entra no bundle da aplicação.
/// <reference lib="dom" />
import { chromium } from '@playwright/test'

export const SITE_URL = 'https://lotusotec.cl/'
export const OUT_DIR = 'docs/inventario'

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
  const base = decodeURIComponent(segments[segments.length - 1] ?? 'asset')
  return parsed.hostname.includes('stackstaging') ? `staging-${base}` : base
}

/**
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim()
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
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  })
  // 'networkidle' nunca resolve: wp-admin/admin-ajax.php?action=rest-nonce
  // fica pendente indefinidamente no site atual. 'load' + scroll cobre o
  // lazy-load do Divi sem depender dessa requisição travada.
  await page.goto(SITE_URL, { waitUntil: 'load', timeout: 60_000 })
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
