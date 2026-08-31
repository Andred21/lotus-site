// Mede referência e clone nó a nó, nas quatro larguras do inventário, e grava
// a evidência que autoriza cada correção de espaçamento do bloco.
//
// Uso: `pnpm qa:espacamento`. O clone precisa estar servido em
// http://localhost:5184 (`pnpm build && pnpm preview --port 5184`).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { SITE_URL, VIEWPORTS } from '../inventario/lib/site.mjs'
import { AMBIGUO, NOS, linhasMarkdown, medirNo } from './lib/espacamento.mjs'

const CLONE_URL = process.env.CLONE_URL ?? 'http://localhost:5184/'
const OUT_DIR = 'docs/qa/paridade/2026-08-30'

if (NOS.length === 0) {
  throw new Error('NOS está vazia: congele a lista de seletores antes de medir')
}

mkdirSync(OUT_DIR, { recursive: true })

/** @typedef {{ nome: string, largura: number, referencia: Record<string, number> | null, clone: Record<string, number> | null }} LinhaMedida */

const browser = await chromium.launch()
/** @type {LinhaMedida[]} */
const medidas = []

/** @type {Array<['referencia' | 'clone', string]>} */
const alvos = [
  ['referencia', SITE_URL],
  ['clone', CLONE_URL],
]

try {
  for (const viewport of VIEWPORTS) {
    for (const [alvo, url] of alvos) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      })
      await page.goto(url, { waitUntil: 'load', timeout: 60_000 })
      // Fonte carregada antes de medir: `font-display: swap` mede o fallback
      // se a medição chegar primeiro, e todo delta de linha ficaria errado.
      await page.evaluate(() => document.fonts.ready)
      for (const no of NOS) {
        const seletor = alvo === 'referencia' ? no.referencia : no.clone
        const medida = await medirNo(page, seletor).catch((erro) => {
          // Seletor ambíguo não vira `null`: a evidência sairia incompleta com
          // exit 0 e autorizaria correção sem medição (D6 e aceite da Task 4).
          if (String(erro.message).startsWith(AMBIGUO)) throw erro
          console.error(`${alvo} ${viewport.name} ${no.nome}: ${erro.message}`)
          return null
        })
        const existente = medidas.find(
          (linha) => linha.nome === no.nome && linha.largura === viewport.width,
        )
        if (existente) existente[alvo] = medida
        else
          medidas.push({
            nome: no.nome,
            largura: viewport.width,
            referencia: alvo === 'referencia' ? medida : null,
            clone: alvo === 'clone' ? medida : null,
          })
      }
      await page.close()
    }
  }
} finally {
  await browser.close()
}

writeFileSync(
  join(OUT_DIR, 'espacamento.json'),
  `${JSON.stringify({ capturadoEm: new Date().toISOString(), medidas }, null, 2)}\n`,
)
writeFileSync(
  join(OUT_DIR, 'espacamento.md'),
  `# Medição de espaçamento — ${SITE_URL} × clone\n\n${linhasMarkdown(medidas)}\n`,
)
console.log(join(OUT_DIR, 'espacamento.md'))
