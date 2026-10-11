// Leitor do subconjunto de YAML que os templates de `infra/` e o `ci.yml`
// usam, sem parser de terceiro (Lei 7: `yaml` e `js-yaml` não resolvem na
// árvore, medido em 2026-09-20 por `zona.mjs`). Os leitores de `zona.mjs`,
// `cabecalhos.mjs` e `distribuicao.mjs` recortam um recurso cada um, por
// coluna; o stack de observabilidade (`B6`) tem catorze recursos de formas
// diferentes, e o `ci.yml` tem blocos de shell, então aqui a leitura é
// genérica e devolve a árvore inteira.
//
// O subconjunto: mapa e lista em bloco; escalar simples, entre aspas simples
// ou duplas; lista em fluxo de uma linha (`[a, b]`); tag curta guardada como
// texto cru (`!Ref Topico`, `!Sub '...'`); bloco literal ou dobrado (`|`,
// `|-`, `>`, `>-`). Escalar não é convertido: `true`, `30` e `0.5` chegam
// como texto, como nas outras catracas. O que fugir disso — âncora, mapa em
// fluxo, comentário no fim da linha, tabulação, chave repetida, recuo fora do
// lugar — lança erro com o número da linha: a leitura é assumida frágil e
// quebra ruidosamente, nunca vira valor lido pela metade. A validação
// estrutural continua com `aws cloudformation validate-template`.

// `Lista` existe só para o TypeScript aceitar a recursão no JSDoc.
/**
 * @typedef {string | Lista | Mapa} Valor
 * @typedef {Valor[]} Lista
 * @typedef {{ [chave: string]: Valor }} Mapa
 * @typedef {{ item: boolean, recuo: number, texto: string, numero: number, bloco?: string }} Token
 */

// Chave sem espaço, que não começa por indicador de YAML; o `?` deixa passar
// `:` no meio, como em `token.actions.githubusercontent.com:aud`.
const CHAVE = /^([^\s'"!&*[\]{}#|>%@`-]\S*?):(?:\s+(.*))?$/
const CABECALHO_DE_BLOCO = /^[|>]-?$/

/**
 * @param {string} bruto
 * @param {number} numero
 * @returns {Valor}
 */
function escalar(bruto, numero) {
  const valor = bruto.trim()
  if (valor.startsWith("'")) {
    if (!/^'(?:[^']|'')*'$/.test(valor)) {
      throw new Error(`linha ${numero}: aspas simples sem fechar: ${valor}`)
    }
    return valor.slice(1, -1).replaceAll("''", "'")
  }
  if (valor.startsWith('"')) {
    if (!/^"(?:[^"\\]|\\.)*"$/.test(valor)) {
      throw new Error(`linha ${numero}: aspas duplas sem fechar: ${valor}`)
    }
    return valor.slice(1, -1).replace(/\\(.)/g, (_todo, letra) => {
      const troca = { n: '\n', t: '\t', '"': '"', '\\': '\\' }[String(letra)]
      if (troca === undefined) {
        throw new Error(`linha ${numero}: escape não lido: \\${letra}`)
      }
      return troca
    })
  }
  if (valor.startsWith('[')) {
    const dentro = valor.match(/^\[(.*)\]$/)?.[1]
    if (dentro === undefined || /[[\]{}]/.test(dentro)) {
      throw new Error(`linha ${numero}: lista em fluxo não lida: ${valor}`)
    }
    return dentro.trim() === ''
      ? []
      : dentro.split(',').map((parte) => escalar(parte, numero))
  }
  if (/^[{&*]/.test(valor)) {
    throw new Error(`linha ${numero}: mapa em fluxo, âncora ou alias: ${valor}`)
  }
  if (/\s#/.test(valor)) {
    throw new Error(`linha ${numero}: comentário no fim da linha: ${valor}`)
  }
  return valor
}

/**
 * Bloco dobrado (`>`): linha seguida de linha vira espaço; linha em branco
 * vira quebra.
 * @param {string[]} corpo
 */
function dobrar(corpo) {
  let texto = ''
  corpo.forEach((linha, k) => {
    if (k === 0) texto = linha
    else if (linha === '') texto += '\n'
    else texto += corpo[k - 1] === '' ? linha : ` ${linha}`
  })
  return texto
}

/**
 * Uma linha de conteúdo vira um token; `- ` vira um token de item e o resto
 * da linha segue, duas colunas à direita. Bloco literal é lido aqui, porque o
 * conteúdo dele não obedece às regras de comentário e recuo.
 * @param {string} texto
 * @returns {Token[]}
 */
function tokenizar(texto) {
  const linhas = texto.split('\n')
  /** @type {Token[]} */
  const tokens = []
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i] ?? ''
    if (/^\s*(#.*)?$/.test(linha)) continue
    if (/^ *\t/.test(linha)) {
      throw new Error(`linha ${i + 1}: tabulação na indentação`)
    }
    let recuo = linha.length - linha.trimStart().length
    let resto = linha.trim()
    let traco = -1
    while (resto === '-' || resto.startsWith('- ')) {
      tokens.push({ item: true, recuo, texto: '-', numero: i + 1 })
      traco = recuo
      const depois = resto.slice(1)
      recuo += 1 + depois.length - depois.trimStart().length
      resto = depois.trimStart()
    }
    if (resto === '') continue
    /** @type {Token} */
    const token = { item: false, recuo, texto: resto, numero: i + 1 }
    tokens.push(token)
    const chave = resto.match(CHAVE)
    const cabecalho = chave ? (chave[2] ?? '') : resto
    if (!/^[|>]/.test(cabecalho)) continue
    if (!CABECALHO_DE_BLOCO.test(cabecalho)) {
      throw new Error(
        `linha ${i + 1}: cabeçalho de bloco não lido: ${cabecalho}`,
      )
    }
    // O conteúdo fica à direita da chave dona; item de lista sem chave
    // (`- |`) mede pela coluna do traço.
    const limite = chave ? recuo : traco
    /** @type {string[]} */
    const corpo = []
    let base = -1
    while (i + 1 < linhas.length) {
      const proxima = linhas[i + 1] ?? ''
      if (proxima.trim() !== '') {
        const r = proxima.length - proxima.trimStart().length
        if (r <= limite) break
        if (base === -1) base = r
        if (r < base) {
          throw new Error(
            `linha ${i + 2}: bloco com recuo menor que o da primeira linha`,
          )
        }
      }
      corpo.push(proxima.trim() === '' ? '' : proxima.slice(base))
      i++
    }
    while (corpo.at(-1) === '') corpo.pop()
    const conteudo = cabecalho.startsWith('>')
      ? dobrar(corpo)
      : corpo.join('\n')
    token.bloco = cabecalho.endsWith('-') ? conteudo : `${conteudo}\n`
  }
  return tokens
}

/**
 * Lê o documento inteiro. A raiz precisa ser um mapa.
 * @param {string} texto
 * @returns {Mapa}
 */
export function lerYaml(texto) {
  const tokens = tokenizar(texto)
  let k = 0

  /**
   * @param {number} recuo
   * @returns {Valor}
   */
  const lerNo = (recuo) => {
    const token = tokens[k]
    if (!token) return ''
    if (token.item) return lerLista(recuo)
    if (CHAVE.test(token.texto)) return lerMapa(recuo)
    k++
    return token.bloco ?? escalar(token.texto, token.numero)
  }

  /**
   * @param {number} recuo
   * @returns {Valor[]}
   */
  const lerLista = (recuo) => {
    /** @type {Valor[]} */
    const lista = []
    for (
      let token = tokens[k];
      token?.item && token.recuo === recuo;
      token = tokens[k]
    ) {
      k++
      const proximo = tokens[k]
      lista.push(proximo && proximo.recuo > recuo ? lerNo(proximo.recuo) : '')
    }
    return lista
  }

  /**
   * @param {number} recuo
   * @returns {Mapa}
   */
  const lerMapa = (recuo) => {
    /** @type {Mapa} */
    const lido = {}
    for (
      let token = tokens[k];
      token && !token.item && token.recuo === recuo;
      token = tokens[k]
    ) {
      const partes = token.texto.match(CHAVE)
      if (!partes) {
        throw new Error(`linha ${token.numero}: esperava chave: ${token.texto}`)
      }
      const chave = partes[1] ?? ''
      if (Object.hasOwn(lido, chave)) {
        throw new Error(`linha ${token.numero}: chave repetida: ${chave}`)
      }
      k++
      const resto = partes[2] ?? ''
      const proximo = tokens[k]
      if (resto === '') {
        lido[chave] =
          proximo && proximo.recuo > recuo ? lerNo(proximo.recuo) : ''
        continue
      }
      // Tag sozinha com bloco embaixo (`Value: !Join` e a lista na linha
      // seguinte) vira `{ '!Join': [...] }`.
      if (/^!\w+$/.test(resto) && proximo && proximo.recuo > recuo) {
        lido[chave] = { [resto]: lerNo(proximo.recuo) }
        continue
      }
      lido[chave] = token.bloco ?? escalar(resto, token.numero)
      if (proximo && proximo.recuo > recuo) {
        throw new Error(
          `linha ${proximo.numero}: recuo inesperado depois de ${chave}`,
        )
      }
    }
    return lido
  }

  const raiz = lerNo(0)
  const sobra = tokens[k]
  if (sobra) {
    throw new Error(`linha ${sobra.numero}: fora da estrutura: ${sobra.texto}`)
  }
  if (typeof raiz !== 'object' || Array.isArray(raiz)) {
    throw new Error('o documento não é um mapa')
  }
  return raiz
}

/**
 * O próprio valor, se for mapa; senão, erro com o caminho de onde veio.
 * @param {Valor | undefined} valor
 * @param {string} caminho
 * @returns {Mapa}
 */
export function mapa(valor, caminho) {
  if (typeof valor !== 'object' || Array.isArray(valor)) {
    throw new Error(`${caminho}: esperava um mapa`)
  }
  return valor
}
