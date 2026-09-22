// Confere a zona nova do Route 53 contra a zona que a StackDNS ainda serve,
// registro a registro, e grava a evidencia.
//
// Perguntar "ao DNS" nao basta: enquanto a delegacao de lotusotec.cl apontar
// para ns1..ns4.stackdns.com, qualquer consulta normal devolve o lado antigo
// -- esteja a zona nova certa ou errada. Este script pergunta DIRETO aos
// nameservers da zona nova e compara com o lado servido, lido por
// DNS-over-HTTPS porque nao ha `dig` nesta maquina.
//
// Depois da troca a premissa muda, e e por isso que existe `--pos-delegacao`:
// os dois lados passam a ser a MESMA zona lida por caminhos diferentes, entao
// as colunas baterem prova convergencia, nao paridade. A consulta direta
// continua valendo nos dois modos, porque ela e a unica que ignora cache.
//
// Uso: `pnpm infra:conferir-zona`
//   --nameservers ns-1.awsdns-01.org,ns-2.awsdns-02.com  pula a leitura do stack
//   --saida docs/infra/conferencia-zona-2026-09-21.md    muda o destino
//   --pos-delegacao                                      inverte os vereditos
//
// Sai com codigo 1 quando ha divergencia fora das esperadas.
import { execFileSync } from 'node:child_process'
import { Resolver, resolve4 } from 'node:dns/promises'
import { writeFileSync } from 'node:fs'
import { format, resolveConfig } from 'prettier'
import {
  INVENTARIO,
  NOMES_INVENTADOS,
  delegacaoEsperada,
  mesmoConjunto,
  wildcardAusente,
} from './lib/zona.mjs'

const STACK = 'lotus-dns'
const REGIAO = 'us-east-1'
const HOJE = new Date().toISOString().slice(0, 10)
const CODIGO_DOH = { A: 1, AAAA: 28, CNAME: 5, MX: 15, TXT: 16, NS: 2 }

/**
 * @typedef {{
 *   nome: string,
 *   tipo: string,
 *   inventario: string[],
 *   aws: string[],
 *   atual: string[],
 *   igual: boolean,
 *   esperado: boolean,
 *   nota: string,
 * }} Linha
 */

/** @param {string} nome */
function argumento(nome) {
  const posicao = process.argv.indexOf(`--${nome}`)
  return posicao === -1 ? undefined : process.argv[posicao + 1]
}

// Flag sem valor: `argumento()` leria o proximo argv como se fosse o dela.
const posDelegacao = process.argv.includes('--pos-delegacao')

/** @param {string[]} args */
function aws(args) {
  return execFileSync('aws', args, { encoding: 'utf8' }).trim()
}

/** @param {string} chave */
function saidaDoStack(chave) {
  return aws([
    'cloudformation',
    'describe-stacks',
    '--region',
    REGIAO,
    '--stack-name',
    STACK,
    '--query',
    `Stacks[0].Outputs[?OutputKey=='${chave}'].OutputValue`,
    '--output',
    'text',
  ])
}

/**
 * `setServers` exige IP; o stack devolve hostname.
 * @param {string[]} hostnames
 */
async function enderecos(hostnames) {
  /** @type {{ hostname: string, ip: string }[]} */
  const lista = []
  for (const hostname of hostnames) {
    const [ip] = await resolve4(hostname)
    if (!ip) throw new Error(`${hostname} nao resolveu para nenhum IPv4`)
    lista.push({ hostname, ip })
  }
  return lista
}

// Falha de transporte: a pergunta nao chegou nem voltou. So ela justifica
// trocar o lado AWS inteiro pela leitura da API.
const FALHAS_DE_REDE = new Set([
  'ETIMEOUT',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'EAI_AGAIN',
])

/**
 * NXDOMAIN, "o nome existe mas nao tem esse tipo" e REFUSED/SERVFAIL sao
 * resposta, nao falha: viram lista vazia, e a comparacao reprova sozinha. Um
 * nameserver que recusa a zona precisa aparecer como coluna AWS vazia contra
 * uma coluna StackDNS cheia -- foi assim que o caso "apontei para a zona
 * errada" foi provado. Erro de rede continua subindo, porque ele muda a
 * natureza do relatorio.
 * @param {() => Promise<string[]>} consulta
 */
async function tolerandoAusencia(consulta) {
  try {
    return await consulta()
  } catch (erro) {
    const codigo = /** @type {NodeJS.ErrnoException} */ (erro).code
    if (codigo !== undefined && FALHAS_DE_REDE.has(codigo)) throw erro
    return []
  }
}

/**
 * @param {Resolver} resolvedor
 * @param {string} nome
 * @param {string} tipo
 * @returns {Promise<string[]>}
 */
async function perguntarDireto(resolvedor, nome, tipo) {
  const alvo = nome.replace(/\.$/, '')
  if (tipo === 'A') return resolvedor.resolve4(alvo)
  if (tipo === 'AAAA') return resolvedor.resolve6(alvo)
  if (tipo === 'CNAME')
    return (await resolvedor.resolveCname(alvo)).map((v) => `${v}.`)
  if (tipo === 'NS')
    return (await resolvedor.resolveNs(alvo)).map((v) => `${v}.`)
  if (tipo === 'MX') {
    return (await resolvedor.resolveMx(alvo)).map(
      (v) => `${v.priority} ${v.exchange}.`,
    )
  }
  if (tipo === 'TXT')
    return (await resolvedor.resolveTxt(alvo)).map((p) => p.join(''))
  throw new Error(`tipo nao suportado: ${tipo}`)
}

/**
 * @param {string} nome
 * @param {string} tipo
 * @returns {Promise<string[]>}
 */
async function perguntarDoh(nome, tipo) {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(nome)}&type=${tipo}`
  const resposta = await fetch(url, {
    headers: { accept: 'application/dns-json' },
  })
  if (!resposta.ok) {
    throw new Error(
      `dns.google respondeu ${resposta.status} para ${tipo} ${nome}`,
    )
  }
  /** @type {{ Answer?: { type: number, data: string }[] }} */
  const corpo = await resposta.json()
  const codigo = CODIGO_DOH[/** @type {keyof typeof CODIGO_DOH} */ (tipo)]
  return (corpo.Answer ?? [])
    .filter((registro) => registro.type === codigo)
    .map((registro) => registro.data)
}

/**
 * Caminho degradado: le a CONFIGURACAO da zona, nao a resposta servida. Sao
 * afirmacoes diferentes, e o relatorio diz qual delas ele carrega.
 * @returns {Map<string, string[]>}
 */
function zonaPelaApi() {
  const bruto = aws([
    'route53',
    'list-resource-record-sets',
    '--hosted-zone-id',
    saidaDoStack('IdDaZona'),
    '--output',
    'json',
  ])
  /** @type {{ ResourceRecordSets: { Name: string, Type: string, ResourceRecords?: { Value: string }[] }[] }} */
  const corpo = JSON.parse(bruto)
  /** @type {Map<string, string[]>} */
  const mapa = new Map()
  for (const conjunto of corpo.ResourceRecordSets) {
    mapa.set(
      `${conjunto.Name}|${conjunto.Type}`,
      (conjunto.ResourceRecords ?? []).map((registro) => registro.Value),
    )
  }
  return mapa
}

/** @param {string[]} valores */
function celula(valores) {
  return valores.length === 0
    ? '—'
    : valores.map((v) => `\`${v}\``).join('<br>')
}

const nomesDeServidor = (
  argumento('nameservers') ?? saidaDoStack('NameServers')
)
  .split(',')
  .map((valor) => valor.trim())
  .filter(Boolean)

if (nomesDeServidor.length === 0) {
  throw new Error(
    'nenhum nameserver: passe --nameservers ou implante o stack lotus-dns',
  )
}

const servidores = await enderecos(nomesDeServidor)
const primeiro = servidores[0]
if (!primeiro) throw new Error('nenhum nameserver resolveu para IPv4')

// Sonda unica: se UDP/53 nao sai desta maquina, o lado AWS inteiro passa a
// ser lido pela API, e o relatorio declara a troca. So falha de TRANSPORTE
// dispara a troca: um REFUSED e resposta do servidor, e tomar REFUSED por
// rede bloqueada faria o script ler a configuracao certa pela API e dar verde
// enquanto apontado para um nameserver que nao serve esta zona.
/** @type {Map<string, string[]> | undefined} */
let porApi
try {
  const sonda = new Resolver()
  sonda.setServers([primeiro.ip])
  await tolerandoAusencia(() => perguntarDireto(sonda, 'lotusotec.cl.', 'A'))
} catch (erro) {
  console.error(
    `UDP/53 indisponivel (${String(erro)}); lendo o lado AWS pela API`,
  )
  porApi = zonaPelaApi()
}

/**
 * @param {string} nome
 * @param {string} tipo
 * @returns {Promise<string[]>}
 */
async function ladoAws(nome, tipo) {
  if (porApi) return porApi.get(`${nome}|${tipo}`) ?? []
  /** @type {string[][]} */
  const respostas = []
  for (const servidor of servidores) {
    const resolvedor = new Resolver()
    resolvedor.setServers([servidor.ip])
    respostas.push(
      await tolerandoAusencia(() => perguntarDireto(resolvedor, nome, tipo)),
    )
  }
  const primeira = respostas[0] ?? []
  if (!respostas.every((resposta) => mesmoConjunto(resposta, primeira))) {
    throw new Error(
      `os nameservers da AWS discordam entre si em ${tipo} ${nome}`,
    )
  }
  return primeira
}

/** @type {Linha[]} */
const linhas = []

for (const registro of INVENTARIO) {
  const naAws = await ladoAws(registro.nome, registro.tipo)
  const naStack = await perguntarDoh(registro.nome, registro.tipo)
  linhas.push({
    nome: registro.nome,
    tipo: registro.tipo,
    inventario: [...registro.valores],
    aws: naAws,
    atual: naStack,
    igual:
      mesmoConjunto(naAws, naStack) &&
      mesmoConjunto(naAws, [...registro.valores]),
    esperado: false,
    nota: '',
  })
}

for (const inventado of NOMES_INVENTADOS) {
  const naAws = await ladoAws(inventado, 'A')
  const naStack = await perguntarDoh(inventado, 'A')
  linhas.push({
    nome: inventado,
    tipo: 'A',
    inventario: [],
    aws: naAws,
    atual: naStack,
    // Nunca `igual`: para nome inventado nao existe lado certo a bater.
    igual: false,
    esperado: wildcardAusente(naAws, naStack, posDelegacao),
    nota: posDelegacao
      ? 'wildcard removido; os dois lados ja leem a zona nova'
      : 'wildcard removido de proposito',
  })
}

const delegacao = await perguntarDoh('lotusotec.cl.', 'NS')
const esperadaNs = delegacaoEsperada(nomesDeServidor, posDelegacao)
linhas.push({
  nome: 'lotusotec.cl.',
  tipo: 'NS',
  inventario: esperadaNs,
  aws: [],
  atual: delegacao,
  // A coluna AWS fica vazia porque nada foi perguntado a ela: o que esta
  // linha afirma e sobre a delegacao, nao sobre a zona nova. Por isso ela
  // nunca e `igual`.
  igual: false,
  esperado: mesmoConjunto(delegacao, esperadaNs),
  nota: posDelegacao
    ? 'a linha afirma que a delegacao ja e a da AWS; AWS nao consultada'
    : 'a linha afirma a delegacao, nao a zona nova; AWS nao consultada',
})

const problemas = linhas.filter((linha) => !linha.igual && !linha.esperado)

const relatorio = [
  `# Conferência da zona de \`lotusotec.cl\` — ${HOJE}`,
  '',
  '> Gerado por `pnpm infra:conferir-zona`. Não editar à mão.',
  '>',
  porApi
    ? '> **Degradado.** UDP/53 não saiu desta máquina, então o lado AWS foi lido da' +
      ' **configuração** (`aws route53 list-resource-record-sets`), e não da resposta servida.' +
      ' São afirmações diferentes: esta prova que a zona está escrita assim, não que ela' +
      ' responde assim.'
    : posDelegacao
      ? '> Lado AWS lido da **resposta servida**, perguntando direto aos quatro nameservers da' +
        ' zona nova. A delegação já aponta para eles, então a coluna StackDNS deixou de ser um' +
        ' segundo lado: é a mesma zona, lida pelo caminho comum. As duas colunas baterem prova' +
        ' **convergência**, não paridade — e uma delas ainda pode carregar cache de antes da' +
        ' troca.'
      : '> Lado AWS lido da **resposta servida**, perguntando direto aos quatro nameservers da' +
        ' zona nova — a delegação ainda aponta para a StackDNS, então nenhuma consulta comum' +
        ' enxergaria esta zona.',
  '>',
  '> Lado atual lido por DNS-over-HTTPS contra `dns.google`, mesmo método do inventário de' +
    ' 2026-09-09.',
  '',
  `Nameservers da zona nova: ${servidores
    .map((servidor) => `\`${servidor.hostname}\` (${servidor.ip})`)
    .join(', ')}`,
  '',
  '| Nome | Tipo | Inventário | AWS | StackDNS | Confere? |',
  '| ---- | ---- | ---------- | --- | -------- | -------- |',
  ...linhas.map((linha) => {
    const veredito = linha.igual
      ? 'sim'
      : linha.esperado
        ? `divergência esperada — ${linha.nota}`
        : '**NÃO**'
    return `| \`${linha.nome}\` | \`${linha.tipo}\` | ${celula(linha.inventario)} | ${celula(
      linha.aws,
    )} | ${celula(linha.atual)} | ${veredito} |`
  }),
  '',
  problemas.length === 0
    ? 'Nenhuma divergência fora das esperadas.'
    : `**${problemas.length} divergência(s) não esperada(s).** A troca de nameservers não pode` +
      ' acontecer enquanto elas existirem.',
  '',
  posDelegacao
    ? 'Resolução correta não prova entrega de e-mail. A prova do MX é mensagem recebida, e ela fica' +
      ' em `docs/infra/delegacao-<data>.md`.'
    : 'Resolução correta não prova entrega de e-mail. A prova do MX é mensagem recebida, e ela só é' +
      ' possível depois da delegação.',
  '',
].join('\n')

const saida = argumento('saida') ?? `docs/infra/conferencia-zona-${HOJE}.md`
// O relatorio e versionado e `pnpm check` roda `prettier --check .`: quem
// formata a tabela e o gerador, senao cada corrida deixaria o gate vermelho e
// alguem editaria a evidencia a mao para consertar.
const formatado = await format(relatorio, {
  ...(await resolveConfig(saida)),
  filepath: saida,
})
writeFileSync(saida, formatado)
console.log(relatorio)
console.error(`relatório em ${saida}`)

if (problemas.length > 0) process.exit(1)
