// Mede a propagação de um nome da zona (7.2.3, spec §4.4). Pergunta, em
// paralelo, aos quatro nameservers do Route 53 e a 8.8.8.8, 1.1.1.1 e
// 9.9.9.9, a cada 5 s, até cada um responder o esperado, e imprime uma
// tabela Markdown com, por resolvedor: o que havia no início (com o TTL
// restante em cache), o tempo até convergir e a resposta nova com o TTL
// dela. Sem `dig` nesta máquina, a pergunta é feita com `node:dns` direto
// ao IP de cada resolvedor, como conferir-zona.mjs já faz.
//
// Uso:
//   node scripts/infra/medir-propagacao.mjs --nome ensaio-corte.lotusotec.cl \
//     --esperado wordpress|cloudfront|ausente [--aquecer] [--limite 900] \
//     [--nameservers ns-1.awsdns-01.org,ns-2.awsdns-02.com,...]
//
// --aquecer: uma consulta só, sem esperar. É o que enche o cache dos
// resolvedores ANTES de cada troca, para ele existir como existiria no
// corte (spec §4.4). Sem --nameservers, lê o output NameServers do stack
// lotus-dns (us-east-1) com o AWS CLI. Sai 1 quando algum resolvedor não
// convergiu dentro do limite (ou, com --aquecer, não respondeu).
//
// Erro de consulta de um resolvedor (ETIMEOUT, ESERVFAIL, ECONNREFUSED...) não
// derruba a medição: conta como "ainda não convergiu" naquela rodada e entra
// na coluna `erros de consulta` da linha dele. A troca que se mede é humana
// e não se refaz de graça, então perder a tabela inteira por um timeout num
// dos sete resolvedores seria jogar fora a única observação dela.
import { execFileSync } from 'node:child_process'
import { Resolver, resolve4 } from 'node:dns/promises'
import { convergiu } from './lib/zona.mjs'

const PUBLICOS = Object.freeze({
  'google 8.8.8.8': '8.8.8.8',
  'cloudflare 1.1.1.1': '1.1.1.1',
  'quad9 9.9.9.9': '9.9.9.9',
})
const INTERVALO_MS = 5_000

/** @param {string[]} argv */
function lerArgumentos(argv) {
  /** @type {Record<string, string>} */
  const valores = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? ''
    if (!arg.startsWith('--')) throw new Error(`argumento inesperado: ${arg}`)
    const nome = arg.slice(2)
    if (nome === 'aquecer') {
      valores[nome] = 'true'
      continue
    }
    const valor = argv[++i]
    if (valor === undefined) throw new Error(`--${nome} exige valor`)
    valores[nome] = valor
  }
  return valores
}

const args = lerArgumentos(process.argv.slice(2))
const nomeArg = args.nome
if (!nomeArg) throw new Error('--nome é obrigatório')
// Reatribuído a uma constante tipada: o estreitamento do `if` acima não
// atravessa para as declarações de função, que o TypeScript trata como içadas.
/** @type {string} */
const NOME = nomeArg
const ESPERADO = args.esperado
if (
  ESPERADO !== 'wordpress' &&
  ESPERADO !== 'cloudfront' &&
  ESPERADO !== 'ausente'
) {
  throw new Error('--esperado deve ser wordpress, cloudfront ou ausente')
}
const AQUECER = args.aquecer === 'true'
const LIMITE_S = Number(args.limite ?? 900)
if (!Number.isFinite(LIMITE_S) || LIMITE_S <= 0) {
  throw new Error(
    `--limite deve ser um número positivo de segundos, recebi: ${args.limite}`,
  )
}
const LIMITE_MS = LIMITE_S * 1000

function nameserversDoStack() {
  const saida = execFileSync(
    'aws',
    [
      'cloudformation',
      'describe-stacks',
      '--region',
      'us-east-1',
      '--stack-name',
      'lotus-dns',
      '--query',
      "Stacks[0].Outputs[?OutputKey=='NameServers'].OutputValue",
      '--output',
      'text',
    ],
    { encoding: 'utf8' },
  )
  return saida
    .split(',')
    .map((nome) => nome.trim())
    .filter(Boolean)
}

/** @param {string} nome */
async function ipv4De(nome) {
  const [ip] = await resolve4(nome)
  if (!ip) throw new Error(`${nome} não resolve para IPv4`)
  return ip
}

const nameservers = (
  args.nameservers ? args.nameservers.split(',') : nameserversDoStack()
)
  .map((nome) => nome.trim().replace(/\.$/, ''))
  .filter(Boolean)
// Sem autoritativo, a tabela sairia só com os três públicos e poderia dar
// verde sem nunca ter perguntado ao Route 53 (output vazio ou renomeado).
if (nameservers.length === 0) {
  throw new Error(
    'lista de nameservers do Route 53 vazia: output NameServers do stack lotus-dns ausente ou --nameservers sem nomes',
  )
}

/** @type {[string, string][]} */
const resolvedores = [
  ...(await Promise.all(
    nameservers.map(
      async (ns) =>
        /** @type {[string, string]} */ ([`route53 ${ns}`, await ipv4De(ns)]),
    ),
  )),
  ...Object.entries(PUBLICOS),
]

/** @typedef {{ valores: string[], ttl: number | null }} Resposta */

/**
 * @param {Resolver} resolvedor
 * @param {'A' | 'AAAA'} tipo
 * @returns {Promise<Resposta>}
 */
async function consultar(resolvedor, tipo) {
  try {
    const registros =
      tipo === 'A'
        ? await resolvedor.resolve4(NOME, { ttl: true })
        : await resolvedor.resolve6(NOME, { ttl: true })
    return {
      valores: registros.map((registro) => registro.address),
      ttl: Math.min(...registros.map((registro) => registro.ttl)),
    }
  } catch (erro) {
    const codigo = /** @type {{ code?: string }} */ (erro).code
    // NXDOMAIN e NODATA são resposta ("não existe"), não falha de rede.
    if (codigo === 'ENOTFOUND' || codigo === 'ENODATA') {
      return { valores: [], ttl: null }
    }
    throw erro
  }
}

/** @typedef {{ A: Resposta, AAAA: Resposta }} Leitura */

/** @param {string} ip @returns {Promise<Leitura>} */
async function lerAmbos(ip) {
  const resolvedor = new Resolver({ timeout: 4_000, tries: 2 })
  resolvedor.setServers([ip])
  return {
    A: await consultar(resolvedor, 'A'),
    AAAA: await consultar(resolvedor, 'AAAA'),
  }
}

// Códigos de falha do c-ares (ETIMEOUT, ESERVFAIL, ECONNREFUSED...): `E` e
// maiúsculas. `ERR_*` e erro sem código são defeito do script, não do
// resolvedor, e continuam derrubando a execução.
const FALHA_DE_CONSULTA = /^E[A-Z]+$/

/**
 * @param {string} ip
 * @returns {Promise<{ leitura: Leitura } | { codigo: string }>}
 */
async function tentar(ip) {
  try {
    return { leitura: await lerAmbos(ip) }
  } catch (erro) {
    const codigo = /** @type {{ code?: unknown }} */ (erro).code
    if (typeof codigo === 'string' && FALHA_DE_CONSULTA.test(codigo)) {
      return { codigo }
    }
    throw erro
  }
}

/** @param {Leitura | undefined} r */
const mostrar = (r) =>
  r
    ? `${r.A.valores.join(' ') || '—'} / ${r.AAAA.valores.join(' ') || '—'} (TTL ${r.A.ttl ?? '—'}/${r.AAAA.ttl ?? '—'})`
    : 'sem resposta'

/** @param {Leitura} r */
const bateu = (r) =>
  convergiu(ESPERADO, { A: r.A.valores, AAAA: r.AAAA.valores })

const inicio = Date.now()

/** @param {[string, string]} par */
async function medir([rotulo, ip]) {
  let erros = 0
  /** @type {string} */
  let ultimoErro = ''

  /** @returns {Promise<Leitura | undefined>} */
  async function ler() {
    const tentativa = await tentar(ip)
    if ('codigo' in tentativa) {
      erros++
      ultimoErro = tentativa.codigo
      return undefined
    }
    return tentativa.leitura
  }
  const colunaDeErros = () =>
    erros === 0 ? '—' : `${erros} (último ${ultimoErro})`

  const primeira = await ler()
  if (AQUECER) {
    return {
      linha: `| ${rotulo} | ${mostrar(primeira)} | — | — | ${colunaDeErros()} |`,
      ok: primeira !== undefined,
    }
  }
  let atual = primeira
  let convergiuEm = atual && bateu(atual) ? 0 : -1
  while (convergiuEm < 0 && Date.now() - inicio < LIMITE_MS) {
    await new Promise((ok) => setTimeout(ok, INTERVALO_MS))
    // Rodada com erro: `atual` fica na última leitura que respondeu.
    const lida = await ler()
    if (!lida) continue
    atual = lida
    if (bateu(lida)) convergiuEm = Math.round((Date.now() - inicio) / 1000)
  }
  const tempo = convergiuEm < 0 ? `não em ${LIMITE_S} s` : `${convergiuEm} s`
  return {
    linha: `| ${rotulo} | ${mostrar(primeira)} | ${tempo} | ${mostrar(atual)} | ${colunaDeErros()} |`,
    ok: convergiuEm >= 0,
  }
}

const resultados = await Promise.all(resolvedores.map(medir))

console.log(
  `Nome \`${NOME}\`, esperado \`${ESPERADO}\`, ${AQUECER ? 'aquecimento' : 'medição'} iniciada em ${new Date(inicio).toISOString()}\n`,
)
console.log(
  '| resolvedor | início: A / AAAA (TTL) | convergiu em | depois: A / AAAA (TTL) | erros de consulta |',
)
console.log('| --- | --- | --- | --- | --- |')
for (const { linha } of resultados) console.log(linha)
process.exit(resultados.every((r) => r.ok) ? 0 : 1)
