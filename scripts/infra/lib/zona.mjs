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
 * Inventário fechado da zona, transcrito do painel do StackCP em 2026-09-20
 * e registrado em `docs/infra/zona-dns-lotusotec.md`. Nomes com ponto final,
 * como o Route 53 os guarda.
 *
 * A fonte deixou de ser a sondagem por DNS de 2026-09-09, que não podia
 * enxergar nome que ninguém adivinhasse: com wildcard na zona, todo palpite
 * responde. Foi essa cegueira que escondeu `pop3` — `pop` foi sondado,
 * devolveu o IP do apex e foi lido como wildcard falando; `pop3` nunca foi
 * perguntado.
 *
 * `www` e `sistema` continuam aqui, e agora por prova em vez de precaução: o
 * painel mostra que nenhum dos dois é registro do outro lado. Eles só
 * resolvem hoje por causa do wildcard, que não atravessa — sem estas linhas,
 * a troca de delegação apagaria os dois. O `AAAA` dos dois existe pelo mesmo
 * motivo: o wildcard do painel tem `A` **e** `AAAA`, então cliente
 * dual-stack perderia IPv6 na troca.
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
  { nome: 'www.lotusotec.cl.', tipo: 'AAAA', valores: ['2a07:7800::195'] },
  { nome: 'sistema.lotusotec.cl.', tipo: 'A', valores: ['185.146.167.195'] },
  {
    nome: 'sistema.lotusotec.cl.',
    tipo: 'AAAA',
    valores: ['2a07:7800::195'],
  },
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
    nome: 'pop3.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['pop3.stackmail.com.'],
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
 * Nomes que só respondiam, antes de 2026-09-26, porque o wildcard existia na
 * StackDNS (`D-45`, medido em 2026-09-09). No modo padrão (antes da troca),
 * os dois lados divergirem neles é a prova de que o wildcard não
 * atravessou — a única divergência esperada da conferência. Desde a troca,
 * no modo `--pos-delegacao`, o esperado é não resolver em lado nenhum
 * (`wildcardAusente`).
 * @type {readonly string[]}
 */
export const NOMES_INVENTADOS = Object.freeze([
  'zzz-nao-existe-19283.lotusotec.cl.',
  'outro-teste-aleatorio-77.lotusotec.cl.',
])

/**
 * A delegação que o registro `.cl` apontava antes de 2026-09-26, medida em
 * 2026-09-09. Conjunto exato, e não substring: `every` sobre lista vazia
 * devolve `true`, e uma resposta DoH sem `Answer` passaria por delegação
 * intacta. Desde a troca, `delegacaoEsperada` só usa esta lista no modo
 * padrão (o "antes"); no modo `--pos-delegacao` o esperado são os
 * nameservers do próprio stack, não esta constante.
 * @type {readonly string[]}
 */
export const NS_DA_STACKDNS = Object.freeze([
  'ns1.stackdns.com.',
  'ns2.stackdns.com.',
  'ns3.stackdns.com.',
  'ns4.stackdns.com.',
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
    // A lista acabou: ou uma chave de topo na coluna zero (`Outputs:`), ou o
    // proximo recurso dentro de `Resources:`, que entra com dois espacos. Os
    // itens de RecordSets vivem a partir da coluna oito, entao qualquer
    // conteudo em indentacao menor ja esta fora da lista.
    if (/^ {0,6}\S/.test(linha)) break
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

/**
 * Veredito da linha de nome inventado, que a delegação inverte.
 *
 * Antes da troca os dois lados são zonas diferentes, e a prova de que o
 * wildcard não atravessou é a assimetria: vazio na AWS, IP na StackDNS.
 * Depois da troca os dois lados são a MESMA zona lida por caminhos
 * diferentes, e essa assimetria deixa de ser possível — o único desfecho
 * correto passa a ser vazio dos dois lados. Manter a regra antiga daria
 * vermelho justamente quando tudo estivesse certo.
 *
 * Resolver na AWS reprova nos dois casos: é o wildcard tendo atravessado.
 * @param {string[]} naAws
 * @param {string[]} naStack
 * @param {boolean} posDelegacao
 */
export function wildcardAusente(naAws, naStack, posDelegacao) {
  if (naAws.length > 0) return false
  return posDelegacao ? naStack.length === 0 : naStack.length > 0
}

/**
 * Qual delegação o relatório espera encontrar. Depois da troca ela é a do
 * próprio stack, e não uma lista fixa: uma hosted zone recriada ganha
 * nameservers novos, e uma constante aqui viraria mentira silenciosa na
 * primeira vez que isso acontecesse.
 * @param {string[]} nomesDeServidor
 * @param {boolean} posDelegacao
 * @returns {string[]}
 */
export function delegacaoEsperada(nomesDeServidor, posDelegacao) {
  if (!posDelegacao) return [...NS_DA_STACKDNS]
  return nomesDeServidor.map((nome) => `${nome.replace(/\.$/, '')}.`)
}
