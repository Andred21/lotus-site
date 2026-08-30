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
export const NOS = []

/** @typedef {Record<string, number>} Medida */

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} seletor
 * @returns {Promise<Medida>}
 */
export async function medirNo(page, seletor) {
  return await page.evaluate((alvo) => {
    const nos = document.querySelectorAll(alvo)
    if (nos.length !== 1) {
      throw new Error(`seletor casa com ${nos.length} nós: ${alvo}`)
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
