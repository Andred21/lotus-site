// Mede o fundo do cabeçalho e a geometria das imagens dos cards de curso em
// referência e clone, nas quatro larguras do inventário, e grava a evidência
// que autoriza as correções do bloco `paridade-header-cursos`.
//
// Uso: `node scripts/qa/medir-header-cursos.mjs`. O clone precisa estar servido
// em http://localhost:5184 (`pnpm build && pnpm preview --port 5184`).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { format, resolveConfig } from 'prettier'
import { SITE_URL, VIEWPORTS } from '../inventario/lib/site.mjs'
import {
  AMBIGUO,
  CABECALHO,
  CARDS,
  divergencias,
  linhasCabecalho,
  linhasCards,
  medirCabecalho,
  medirCard,
} from './lib/header-cursos.mjs'

const CLONE_URL = process.env.CLONE_URL ?? 'http://localhost:5184/'
const OUT_DIR = 'docs/qa/paridade/2026-09-02'

if (CARDS.length === 0) {
  throw new Error(
    'CARDS está vazia: congele a lista de seletores antes de medir',
  )
}

mkdirSync(OUT_DIR, { recursive: true })

/**
 * @template T
 * @typedef {{ nome: string, largura: number, referencia: T | null, clone: T | null }} LinhaMedida
 */

/**
 * Acumula a medição de um lado sem sobrescrever a do outro: cada nome/largura
 * é visitado duas vezes, uma por alvo.
 * @template T
 * @param {Array<LinhaMedida<T>>} linhas
 * @param {'referencia' | 'clone'} alvo
 * @param {string} nome
 * @param {number} largura
 * @param {T | null} medida
 * @returns {void}
 */
function acumula(linhas, alvo, nome, largura, medida) {
  const existente = linhas.find(
    (linha) => linha.nome === nome && linha.largura === largura,
  )
  if (existente) {
    existente[alvo] = medida
    return
  }
  linhas.push({
    nome,
    largura,
    referencia: alvo === 'referencia' ? medida : null,
    clone: alvo === 'clone' ? medida : null,
  })
}

/**
 * Seletor ambíguo derruba a medição inteira; ausência vira `null` e aparece no
 * relatório. Medir com seletor ambíguo sairia com exit 0 e autorizaria
 * correção sobre o nó errado — foi assim que `D-16` nasceu.
 * @template T
 * @param {Promise<T>} promessa
 * @param {string} contexto
 * @returns {Promise<T | null>}
 */
function tolerandoAusencia(promessa, contexto) {
  return promessa.catch((erro) => {
    if (String(erro.message).startsWith(AMBIGUO)) throw erro
    console.error(`${contexto}: ${erro.message}`)
    return null
  })
}

const browser = await chromium.launch()
/** @type {Array<LinhaMedida<import('./lib/header-cursos.mjs').MedidaCabecalho>>} */
const medidasCabecalho = []
/** @type {Array<LinhaMedida<import('./lib/header-cursos.mjs').MedidaCard>>} */
const medidasCards = []

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
      // Fonte carregada antes de medir: `font-display: swap` mede o fallback se
      // a medição chegar primeiro, e o vão até o nome do curso ficaria errado.
      await page.evaluate(() => document.fonts.ready)
      // Imagem ainda decodificando devolve `naturalWidth: 0`, que a tabela
      // registraria como divergência inventada.
      await page.evaluate(() =>
        Promise.all(
          Array.from(document.images)
            .filter((imagem) => !imagem.complete)
            .map((imagem) => imagem.decode().catch(() => undefined)),
        ),
      )

      const seletorCabecalho =
        alvo === 'referencia' ? CABECALHO.referencia : CABECALHO.clone
      acumula(
        medidasCabecalho,
        alvo,
        CABECALHO.nome,
        viewport.width,
        await tolerandoAusencia(
          medirCabecalho(page, seletorCabecalho),
          `${alvo} ${viewport.name} ${CABECALHO.nome}`,
        ),
      )

      for (const card of CARDS) {
        const seletores = alvo === 'referencia' ? card.referencia : card.clone
        acumula(
          medidasCards,
          alvo,
          card.nome,
          viewport.width,
          await tolerandoAusencia(
            medirCard(page, seletores),
            `${alvo} ${viewport.name} ${card.nome}`,
          ),
        )
      }
      await page.close()
    }
  }
} finally {
  await browser.close()
}

const fora = [...divergencias(medidasCabecalho), ...divergencias(medidasCards)]

writeFileSync(
  join(OUT_DIR, 'header-cursos.json'),
  `${JSON.stringify(
    {
      capturadoEm: new Date().toISOString(),
      cabecalho: medidasCabecalho,
      cards: medidasCards,
      divergencias: fora,
    },
    null,
    2,
  )}\n`,
)

const resumo =
  fora.length === 0
    ? 'Nenhuma divergência: clone e referência batem nas quatro larguras.'
    : `${fora.length} divergência(s):\n\n${fora.map((linha) => `- ${linha}`).join('\n')}`

const relatorio = [
  `# Cabeçalho e cards de curso — ${SITE_URL} × clone`,
  '',
  '## Resumo',
  '',
  resumo,
  '',
  '## Cabeçalho',
  '',
  linhasCabecalho(medidasCabecalho),
  '',
  '## Cards de curso',
  '',
  linhasCards(medidasCards),
  '',
].join('\n')

// O relatório sai formatado pelo Prettier porque `pnpm check` roda
// `format:check` sobre o repositório inteiro: gerar tabela crua deixaria o gate
// vermelho toda vez que a medição fosse refeita.
const caminhoRelatorio = join(OUT_DIR, 'header-cursos.md')
writeFileSync(
  caminhoRelatorio,
  await format(relatorio, {
    ...(await resolveConfig(caminhoRelatorio)),
    filepath: caminhoRelatorio,
  }),
)
console.log(caminhoRelatorio)
if (fora.length > 0) console.error(resumo)
