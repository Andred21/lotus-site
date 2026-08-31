// Ferramenta de QA: roda em Node, nunca entra no bundle da aplicação.
/// <reference lib="dom" />

/** @typedef {{ nome: string, referencia: string, clone: string }} No */

/**
 * Pares de seletor, um por nó medido. A lista é congelada na Task 5, depois
 * de conferir na referência que cada seletor casa com exatamente um nó.
 *
 * Por que par explícito e não heurística: `extract-styles.mjs:68` usa
 * `section.querySelector(selector)` e alcança o nó-eco que o Divi duplica
 * (`D-16`). Aqui o seletor é nomeado, e `medirNo` reprova ambiguidade.
 * @type {No[]}
 */
export const NOS = [
  { nome: 'hero.secao', referencia: '#Intrucción', clone: '#Intrucción' },
  {
    nome: 'hero.kicker',
    referencia: '#Intrucción .et_pb_text_0 .et_pb_text_inner p',
    clone: '#Intrucción > div > p:first-of-type',
  },
  {
    nome: 'hero.titulo',
    referencia: '#Intrucción .et_pb_text_1 h1',
    clone: '#hero-heading',
  },
  {
    nome: 'hero.subtitulo',
    referencia: '#Intrucción .et_pb_text_1 h3',
    clone: '#hero-heading + p',
  },
  {
    nome: 'hero.corpo',
    referencia: '#Intrucción .et_pb_text_2 .et_pb_text_inner p',
    clone: '.pr-hero-inset + p',
  },
  {
    nome: 'hero.cta',
    referencia: '#Intrucción .et_pb_button_0',
    clone: '#Intrucción a',
  },
  { nome: 'institucional.secao', referencia: '#Somos', clone: '#Somos' },
  {
    nome: 'institucional.corpo',
    // A referência guarda o texto institucional num único <p> (precedido de
    // dois <p>&nbsp;</p> decorativos vazios): a premissa de D4 — texto
    // repartido em vários <p> — não se confirmou. Ver Step 3 da Task 5 em
    // docs/qa/paridade/2026-08-30/espacamento.md.
    referencia: '#Somos .et_pb_text_3 .et_pb_text_inner p:last-of-type',
    clone: '#Somos p.text-lead',
  },
  {
    nome: 'destaque.primeiro.card',
    referencia: '#Somos .et_pb_blurb_0',
    clone: '#Somos .text-center:nth-of-type(1)',
  },
  {
    nome: 'destaque.primeiro.titulo',
    referencia: '#Somos .et_pb_blurb_0 h4',
    clone: '#Somos .text-center:nth-of-type(1) h2',
  },
  {
    nome: 'destaque.primeiro.corpo',
    referencia: '#Somos .et_pb_blurb_0 .et_pb_blurb_description p',
    clone: '#Somos .text-center:nth-of-type(1) p',
  },
  { nome: 'cursos.secao', referencia: '#Cursos', clone: '#Cursos' },
  {
    nome: 'cursos.linha',
    referencia: '#Cursos .et_pb_row_4',
    clone: '#Cursos .grid',
  },
  {
    nome: 'cursos.primeiro.card',
    referencia: '#Cursos .et_pb_column_8',
    clone: '#Cursos article:first-of-type',
  },
  { nome: 'contacto.secao', referencia: '#Contacto', clone: '#Contacto' },
  {
    nome: 'contacto.linha',
    referencia: '#Contacto .et_pb_row_6',
    clone: '#Contacto > div:first-of-type',
  },
  {
    nome: 'rodape.copyright',
    referencia: '#footer-info',
    clone: 'footer > div',
  },
]

/** Prefixo da falha que derruba a medição inteira, ver `medirNo`. */
export const AMBIGUO = 'seletor ambíguo'

/** @typedef {Record<string, number>} Medida */

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} seletor
 * @returns {Promise<Medida>}
 */
export async function medirNo(page, seletor) {
  return await page.evaluate((alvo) => {
    const nos = document.querySelectorAll(alvo)
    // Duas falhas diferentes: seletor que casa com mais de um nó é deriva de
    // seletor e derruba a medição inteira (D6 da spec — o script falha alto
    // em vez de escolher o primeiro); seletor que não casa com nada vira
    // linha `ausente na …` no markdown, sem inventar zero.
    if (nos.length > 1) {
      throw new Error(`seletor ambíguo (${nos.length} nós): ${alvo}`)
    }
    if (nos.length === 0) {
      throw new Error(`seletor ausente: ${alvo}`)
    }
    // `nos.length === 1` já garantido acima; o cast só satisfaz
    // `noUncheckedIndexedAccess`, que não enxerga essa checagem.
    const no = /** @type {Element} */ (nos[0])
    const caixa = no.getBoundingClientRect()
    const estilo = getComputedStyle(no)
    /** @type {(valor: string) => number} */
    const px = (valor) => Number.parseFloat(valor) || 0
    return {
      height: caixa.height,
      top: caixa.top + window.scrollY,
      bottom: caixa.bottom + window.scrollY,
      paddingTop: px(estilo.paddingTop),
      paddingBottom: px(estilo.paddingBottom),
      marginTop: px(estilo.marginTop),
      marginBottom: px(estilo.marginBottom),
      rowGap: px(estilo.rowGap),
      fontSize: px(estilo.fontSize),
      lineHeight: px(estilo.lineHeight),
      fontWeight: px(estilo.fontWeight),
    }
  }, seletor)
}

/**
 * @param {Array<{ nome: string, largura: number, referencia: Medida | null, clone: Medida | null }>} medidas
 * @returns {string}
 */
export function linhasMarkdown(medidas) {
  const cabecalho =
    '| nó | largura | propriedade | referência | clone | delta |\n' +
    '| --- | --- | --- | --- | --- | --- |'
  const linhas = []
  for (const { nome, largura, referencia, clone } of medidas) {
    if (!referencia || !clone) {
      const lado = referencia ? 'clone' : 'referência'
      linhas.push(
        `| \`${nome}\` | ${largura} | — | — | — | ausente na ${lado} |`,
      )
      continue
    }
    for (const propriedade of Object.keys(referencia)) {
      const a = referencia[propriedade] ?? 0
      const b = clone[propriedade] ?? 0
      if (a === b) continue
      const delta = Math.round((b - a) * 100) / 100
      linhas.push(
        `| \`${nome}\` | ${largura} | ${propriedade} | ${a} | ${b} | ${delta > 0 ? '+' : ''}${delta} |`,
      )
    }
  }
  return [cabecalho, ...linhas].join('\n')
}
