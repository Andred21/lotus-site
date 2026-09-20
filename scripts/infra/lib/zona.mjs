// O que a zona de lotusotec.cl precisa conter, e como ler isso de volta de
// `infra/lotus-dns.yaml` sem parser YAML.
//
// Medido em 2026-09-20: nem `yaml` nem `js-yaml` resolvem na árvore, e
// instalar um só para esta catraca é dependência sem necessidade do work item
// (Lei 7). O template é escrito por nós, num formato estável, então a leitura
// aqui é textual e assumida frágil: ela quebra ruidosamente se o formato
// mudar, nunca em silêncio. A validação estrutural do YAML fica com
// `aws cloudformation validate-template`, no runbook.

/**
 * @typedef {{ nome: string, tipo: string, valores: string[] }} RegistroEsperado
 * @typedef {{ nome: string, tipo: string, ttl: number, valores: string[] }} RegistroLido
 */

/**
 * Inventário medido em 2026-09-09 por DNS-over-HTTPS contra `dns.google` e
 * registrado em `docs/infra/zona-dns-lotusotec.md`. Nomes com ponto final,
 * como o Route 53 os guarda.
 * @type {readonly RegistroEsperado[]}
 */
export const INVENTARIO = Object.freeze([
  { nome: 'lotusotec.cl.', tipo: 'A', valores: ['185.146.167.195'] },
  { nome: 'lotusotec.cl.', tipo: 'AAAA', valores: ['2a07:7800::195'] },
  {
    nome: 'lotusotec.cl.',
    tipo: 'MX',
    valores: [
      '1 ASPMX.L.GOOGLE.COM.',
      '5 ALT1.ASPMX.L.GOOGLE.COM.',
      '5 ALT2.ASPMX.L.GOOGLE.COM.',
      '10 ALT3.ASPMX.L.GOOGLE.COM.',
      '10 ALT4.ASPMX.L.GOOGLE.COM.',
    ],
  },
  {
    nome: 'lotusotec.cl.',
    tipo: 'TXT',
    valores: [
      '"v=spf1 include:_spf.google.com include:spf.stackmail.com -all"',
    ],
  },
  { nome: 'www.lotusotec.cl.', tipo: 'A', valores: ['185.146.167.195'] },
  { nome: 'sistema.lotusotec.cl.', tipo: 'A', valores: ['185.146.167.195'] },
  {
    nome: 'mail.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['ghs.googlehosted.com.'],
  },
  {
    nome: 'smtp.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['smtp.stackmail.com.'],
  },
  {
    nome: 'imap.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['imap.stackmail.com.'],
  },
  {
    nome: 'autodiscover.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['autodiscover.stackmail.com.'],
  },
  {
    nome: 'ftp.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['ftp.us.stackcp.com.'],
  },
])

/**
 * Nomes que só respondem hoje porque o wildcard existe (`D-45`, medido em
 * 2026-09-09). A zona nova não os declara, então os dois lados divergirem
 * neles é a prova de que o wildcard não atravessou — e é a única divergência
 * esperada da conferência.
 * @type {readonly string[]}
 */
export const NOMES_INVENTADOS = Object.freeze([
  'zzz-nao-existe-19283.lotusotec.cl.',
  'outro-teste-aleatorio-77.lotusotec.cl.',
])

const ASPAS_EXTERNAS = /^(['"])([\s\S]*)\1$/

/** @param {string} bruto */
function semAspas(bruto) {
  const cru = bruto.trim()
  return cru.match(ASPAS_EXTERNAS)?.[2] ?? cru
}

/**
 * @param {Map<string, string>} parametros
 * @param {string} nome
 */
function exigirParametro(parametros, nome) {
  const valor = parametros.get(nome)
  if (valor === undefined) {
    throw new Error(
      `template usa o parâmetro ${nome}, que não tem Default declarado`,
    )
  }
  return valor
}

/**
 * Recorta o trecho entre duas chaves de topo do template.
 * @param {string} texto
 * @param {string} inicio
 * @param {string} fim
 */
function recortar(texto, inicio, fim) {
  const de = texto.indexOf(`\n${inicio}`)
  const ate = texto.indexOf(`\n${fim}`)
  if (de === -1) throw new Error(`template sem a secção ${inicio}`)
  if (ate === -1 || ate < de)
    throw new Error(`template sem ${fim} depois de ${inicio}`)
  return texto.slice(de, ate)
}

/**
 * Lê o `Default` de cada parâmetro declarado.
 * @param {string} texto
 * @returns {Map<string, string>}
 */
export function lerParametros(texto) {
  /** @type {Map<string, string>} */
  const parametros = new Map()
  let atual = ''
  for (const linha of recortar(texto, 'Parameters:', 'Resources:').split(
    '\n',
  )) {
    const nome = linha.match(/^ {2}(\w+):\s*$/)
    if (nome) {
      atual = nome[1] ?? ''
      continue
    }
    const padrao = linha.match(/^ {4}Default:\s*(.+)$/)
    if (padrao && atual) parametros.set(atual, semAspas(padrao[1] ?? ''))
  }
  return parametros
}

/**
 * Resolve `!Ref X` e `!Sub '...${X}...'` contra os defaults dos parâmetros.
 * Valor sem tag volta apenas sem as aspas do YAML.
 * @param {string} bruto
 * @param {Map<string, string>} parametros
 */
export function resolver(bruto, parametros) {
  const cru = bruto.trim()
  const referencia = cru.match(/^!Ref\s+(\w+)$/)
  if (referencia) return exigirParametro(parametros, referencia[1] ?? '')
  const substituicao = cru.match(/^!Sub\s+([\s\S]+)$/)
  const texto = semAspas(substituicao?.[1] ?? cru)
  return texto.replace(/\$\{(\w+)\}/g, (_todo, nome) =>
    exigirParametro(parametros, String(nome)),
  )
}

/**
 * Lê os `RecordSet` do template, com `!Ref` e `!Sub` já resolvidos.
 * @param {string} texto
 * @returns {RegistroLido[]}
 */
export function lerRegistros(texto) {
  const parametros = lerParametros(texto)
  const de = texto.indexOf('RecordSets:')
  if (de === -1) throw new Error('template sem RecordSets:')
  /** @type {RegistroLido[]} */
  const registros = []
  /** @type {RegistroLido | undefined} */
  let atual
  for (const linha of texto.slice(de).split('\n').slice(1)) {
    // Chave de topo na coluna zero: a lista acabou.
    if (/^\S/.test(linha)) break
    const abertura = linha.match(/^\s*- Name:\s*(.+)$/)
    if (abertura) {
      atual = {
        nome: resolver(abertura[1] ?? '', parametros),
        tipo: '',
        ttl: 0,
        valores: [],
      }
      registros.push(atual)
      continue
    }
    if (!atual) continue
    const tipo = linha.match(/^\s*Type:\s*(.+)$/)
    if (tipo) {
      atual.tipo = resolver(tipo[1] ?? '', parametros)
      continue
    }
    const ttl = linha.match(/^\s*TTL:\s*(.+)$/)
    if (ttl) {
      atual.ttl = Number(resolver(ttl[1] ?? '', parametros))
      continue
    }
    const valor = linha.match(/^\s*- (.+)$/)
    if (valor) atual.valores.push(resolver(valor[1] ?? '', parametros))
  }
  return registros
}

/**
 * As duas políticas do recurso da zona. Apagar a zona e recriá-la dá
 * nameservers novos, e são eles que o registrador aponta.
 * @param {string} texto
 */
export function lerPoliticasDaZona(texto) {
  const de = texto.indexOf('\n  Zona:')
  if (de === -1) throw new Error('template sem o recurso Zona')
  const politicas = { deletionPolicy: '', updateReplacePolicy: '' }
  // `slice(2)`: o corte comeca no `\n` que antecede `  Zona:`, entao a
  // primeira fatia e vazia e a segunda e o proprio cabecalho do recurso --
  // que o `break` abaixo tomaria pelo recurso seguinte.
  for (const linha of texto.slice(de).split('\n').slice(2)) {
    // Próximo recurso de topo dentro de Resources:.
    if (/^ {2}\w/.test(linha)) break
    const apagar = linha.match(/^ {4}DeletionPolicy:\s*(\S+)/)
    if (apagar) politicas.deletionPolicy = apagar[1] ?? ''
    const substituir = linha.match(/^ {4}UpdateReplacePolicy:\s*(\S+)/)
    if (substituir) politicas.updateReplacePolicy = substituir[1] ?? ''
  }
  return politicas
}

/**
 * TXT chega com aspas de um lado e sem do outro; MX e CNAME chegam com caixa
 * variável. Normalizar aqui é o que evita falso positivo na comparação.
 * @param {string} valor
 */
export function normalizar(valor) {
  return semAspas(valor).trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * @param {string[]} a
 * @param {string[]} b
 */
export function mesmoConjunto(a, b) {
  /** @param {string[]} lista */
  const chaves = (lista) => [...new Set(lista.map(normalizar))].sort()
  const esquerda = chaves(a)
  const direita = chaves(b)
  return (
    esquerda.length === direita.length &&
    esquerda.every((valor, i) => valor === direita[i])
  )
}
