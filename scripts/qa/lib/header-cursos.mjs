// Ferramenta de QA: roda em Node, nunca entra no bundle da aplicação.
/// <reference lib="dom" />

/**
 * Pares de seletor do cabeçalho. A referência troca de cor entre viewports, e
 * é essa troca — não um valor único — que o clone precisa reproduzir.
 * @type {{ nome: string, referencia: string, clone: string }}
 */
export const CABECALHO = {
  nome: 'cabecalho',
  referencia: '#main-header',
  clone: 'header',
}

/** @typedef {{ container: string, imagem: string, legenda: string }} SeletoresCard */

/**
 * Um trio de seletores por card de curso: a coluna, a imagem e o nome do
 * curso. O deslocamento da imagem é medido dentro da coluna, então os três
 * andam juntos.
 *
 * Par explícito e não heurística, pela mesma razão de `espacamento.mjs`:
 * `extract-styles.mjs:68` alcança o nó-eco que o Divi duplica (`D-16`), e
 * aqui cada seletor é nomeado e a ambiguidade reprova a medição.
 * @type {Array<{ nome: string, referencia: SeletoresCard, clone: SeletoresCard }>}
 */
export const CARDS = [
  {
    nome: 'curso.1.media-tension',
    referencia: {
      container: '#Cursos .et_pb_column_8',
      imagem: '#Cursos .et_pb_image_1 img',
      legenda: '#Cursos .et_pb_text_6',
    },
    clone: {
      container: '#Cursos article:nth-of-type(1)',
      imagem: '#Cursos article:nth-of-type(1) img',
      legenda: '#Cursos article:nth-of-type(1) p',
    },
  },
  {
    nome: 'curso.2.alta-tension',
    referencia: {
      container: '#Cursos .et_pb_column_9',
      imagem: '#Cursos .et_pb_image_2 img',
      legenda: '#Cursos .et_pb_text_7',
    },
    clone: {
      container: '#Cursos article:nth-of-type(2)',
      imagem: '#Cursos article:nth-of-type(2) img',
      legenda: '#Cursos article:nth-of-type(2) p',
    },
  },
  {
    nome: 'curso.3.supervisor',
    referencia: {
      container: '#Cursos .et_pb_column_10',
      imagem: '#Cursos .et_pb_image_3 img',
      legenda: '#Cursos .et_pb_text_8',
    },
    clone: {
      container: '#Cursos article:nth-of-type(3)',
      imagem: '#Cursos article:nth-of-type(3) img',
      legenda: '#Cursos article:nth-of-type(3) p',
    },
  },
]

/** Prefixo da falha que derruba a medição inteira, ver `medirCabecalho`. */
export const AMBIGUO = 'seletor ambíguo'

/** @typedef {{ backgroundColor: string, height: number, boxShadow: string }} MedidaCabecalho */
/** @typedef {{ larguraColuna: number, larguraIntrinseca: number, alturaIntrinseca: number, larguraRenderizada: number, alturaRenderizada: number, offsetEsquerdo: number, offsetDireito: number, ateLegenda: number }} MedidaCard */

/**
 * Cor de fundo, altura e sombra do cabeçalho no viewport atual.
 *
 * A cor sai de `getComputedStyle` e não de amostragem de pixel de screenshot:
 * `capture-baseline.mjs` captura com `fullPage: true`, e nesse modo o mesmo
 * cabeçalho rasteriza `#f8f8f8` onde o screenshot de viewport rasteriza
 * `#000000`. Foi esse artefato que produziu a paleta errada do inventário.
 * @param {import('@playwright/test').Page} page
 * @param {string} seletor
 * @returns {Promise<MedidaCabecalho>}
 */
export async function medirCabecalho(page, seletor) {
  return await page.evaluate((alvo) => {
    const nos = document.querySelectorAll(alvo)
    if (nos.length > 1) {
      throw new Error(`seletor ambíguo (${nos.length} nós): ${alvo}`)
    }
    if (nos.length === 0) {
      throw new Error(`seletor ausente: ${alvo}`)
    }
    const no = /** @type {Element} */ (nos[0])
    const estilo = getComputedStyle(no)
    return {
      backgroundColor: estilo.backgroundColor,
      height: Math.round(no.getBoundingClientRect().height * 100) / 100,
      boxShadow: estilo.boxShadow,
    }
  }, seletor)
}

/**
 * Geometria da imagem de um card: tamanho intrínseco do arquivo, tamanho
 * renderizado, folga de cada lado dentro da coluna e distância até o nome do
 * curso.
 *
 * `ateLegenda` mede o vão real (topo da legenda menos base da imagem) em vez
 * do `margin-bottom` do módulo, porque referência e clone chegam ao mesmo vão
 * por propriedades diferentes — a referência com margem no módulo da imagem, o
 * clone com margem no parágrafo.
 * @param {import('@playwright/test').Page} page
 * @param {SeletoresCard} seletores
 * @returns {Promise<MedidaCard>}
 */
export async function medirCard(page, seletores) {
  return await page.evaluate((alvo) => {
    /** @type {(seletor: string) => Element} */
    const unico = (seletor) => {
      const nos = document.querySelectorAll(seletor)
      if (nos.length > 1) {
        throw new Error(`seletor ambíguo (${nos.length} nós): ${seletor}`)
      }
      if (nos.length === 0) {
        throw new Error(`seletor ausente: ${seletor}`)
      }
      return /** @type {Element} */ (nos[0])
    }
    const coluna = unico(alvo.container)
    const imagem = /** @type {HTMLImageElement} */ (unico(alvo.imagem))
    const legenda = unico(alvo.legenda)
    const caixaColuna = coluna.getBoundingClientRect()
    const caixaImagem = imagem.getBoundingClientRect()
    const caixaLegenda = legenda.getBoundingClientRect()
    /** @type {(valor: number) => number} */
    const arredonda = (valor) => Math.round(valor * 100) / 100
    return {
      larguraColuna: arredonda(caixaColuna.width),
      larguraIntrinseca: imagem.naturalWidth,
      alturaIntrinseca: imagem.naturalHeight,
      larguraRenderizada: arredonda(caixaImagem.width),
      alturaRenderizada: arredonda(caixaImagem.height),
      offsetEsquerdo: arredonda(caixaImagem.left - caixaColuna.left),
      offsetDireito: arredonda(caixaColuna.right - caixaImagem.right),
      ateLegenda: arredonda(caixaLegenda.top - caixaImagem.bottom),
    }
  }, seletores)
}

/**
 * Folga de subpixel. A referência mede `320,39px` de coluna onde o clone mede
 * `320,41px`, e `29,69px` de vão onde a mesma declaração de `30px` rende `30`
 * em outra largura: é arredondamento do layout, não diferença de estilo.
 */
export const TOLERANCIA = 0.5

/**
 * Propriedades medidas para explicar o resultado, nunca para reprovar. O
 * tamanho intrínseco depende do `srcset` do WordPress — a referência baixa uma
 * variante `374×281` em `375` onde o clone serve o arquivo único `400×300` — e
 * os dois chegam ao mesmo tamanho renderizado, que é o que a paridade exige.
 */
const DIAGNOSTICO = new Set(['larguraIntrinseca', 'alturaIntrinseca'])

/**
 * Sombra sem as camadas totalmente transparentes. Tailwind expande
 * `shadow-header` na cadeia de cinco camadas de `--tw-shadow`, quatro delas em
 * `rgba(0, 0, 0, 0)`; a tela pinta a mesma sombra que a referência declara
 * sozinha, e comparar o texto cru acusaria divergência que não existe.
 * @param {string} valor
 * @returns {string}
 */
function normalizaSombra(valor) {
  return valor
    .split(/,(?![^(]*\))/)
    .map((camada) => camada.trim())
    .filter((camada) => !camada.startsWith('rgba(0, 0, 0, 0)'))
    .join(', ')
}

/**
 * Compara uma propriedade dos dois lados sob as regras acima.
 * @param {string} propriedade
 * @param {string | number} a
 * @param {string | number} b
 * @returns {'sim' | 'nao' | 'diagnostico'}
 */
function compara(propriedade, a, b) {
  if (DIAGNOSTICO.has(propriedade)) return 'diagnostico'
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= TOLERANCIA ? 'sim' : 'nao'
  }
  if (propriedade === 'boxShadow') {
    return normalizaSombra(String(a)) === normalizaSombra(String(b))
      ? 'sim'
      : 'nao'
  }
  return a === b ? 'sim' : 'nao'
}

/** @type {Record<'sim' | 'nao' | 'diagnostico', string>} */
const VEREDITO = {
  sim: 'sim',
  nao: '**não**',
  diagnostico: 'diagnóstico',
}

/**
 * @template {Record<string, string | number>} T
 * @param {Array<{ nome: string, largura: number, referencia: T | null, clone: T | null }>} medidas
 * @param {string} titulo
 * @returns {string}
 */
function tabela(medidas, titulo) {
  const cabecalho =
    `| ${titulo} | largura | propriedade | referência | clone | bate |\n` +
    '| --- | --- | --- | --- | --- | --- |'
  /** @type {string[]} */
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
      const a = referencia[propriedade]
      const b = clone[propriedade]
      if (a === undefined || b === undefined) continue
      linhas.push(
        `| \`${nome}\` | ${largura} | ${propriedade} | ${a} | ${b} | ${VEREDITO[compara(propriedade, a, b)]} |`,
      )
    }
  }
  return [cabecalho, ...linhas].join('\n')
}

/**
 * @param {Array<{ nome: string, largura: number, referencia: MedidaCabecalho | null, clone: MedidaCabecalho | null }>} medidas
 * @returns {string}
 */
export function linhasCabecalho(medidas) {
  return tabela(medidas, 'nó')
}

/**
 * @param {Array<{ nome: string, largura: number, referencia: MedidaCard | null, clone: MedidaCard | null }>} medidas
 * @returns {string}
 */
export function linhasCards(medidas) {
  return tabela(medidas, 'card')
}

/**
 * Propriedades que ainda divergem, para o resumo no topo do relatório. Uma
 * linha por divergência; lista vazia é o aceite do bloco.
 * @param {Array<{ nome: string, largura: number, referencia: Record<string, string | number> | null, clone: Record<string, string | number> | null }>} medidas
 * @returns {string[]}
 */
export function divergencias(medidas) {
  /** @type {string[]} */
  const fora = []
  for (const { nome, largura, referencia, clone } of medidas) {
    if (!referencia || !clone) {
      fora.push(`${nome} @ ${largura}: ausente em um dos lados`)
      continue
    }
    for (const propriedade of Object.keys(referencia)) {
      const a = referencia[propriedade]
      const b = clone[propriedade]
      if (a === undefined || b === undefined) continue
      if (compara(propriedade, a, b) === 'nao') {
        fora.push(`${nome} @ ${largura}: ${propriedade} ${a} != ${b}`)
      }
    }
  }
  return fora
}
