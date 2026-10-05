// Mede a latência HTTP de um host a partir de sondas do Globalping (7.2.5,
// spec §4.2 e D7) e imprime a tabela Markdown da evidência. A lógica pura
// mora em `lib/latencia.mjs`; aqui ficam a rede e a impressão. Sem chave de
// API: o limite anônimo (250 testes por hora, 50 sondas por medição) cobre as
// medições do bloco.
//
// Uso:
//   node scripts/infra/medir-latencia.mjs --alvo <host> [--sondas <id>] [--pais CL] [--quantas 10]
//
// --sondas reusa as sondas de uma medição anterior, na mesma ordem. ID vencido
// ou inválido é 422 da API, e o script sai 1 em vez de escolher sondas novas:
// trocar de sondas é decisão de quem mede, e a evidência precisa dizer que
// elas mudaram (spec D7). Sai 1 também quando a medição não termina em 120 s
// ou nenhuma sonda termina.
import {
  API_DO_GLOBALPING,
  descreverErroDaApi,
  descreverSondas,
  pedidoDeMedicao,
  resumirMedicao,
  tabelaDeLatencia,
} from './lib/latencia.mjs'

/** @typedef {import('./lib/latencia.mjs').Medicao} Medicao */

const LIMITE_MS = 120_000
// A API pede 500 ms entre uma resposta e o pedido seguinte, e no máximo dois
// pedidos por segundo por medição.
const INTERVALO_MS = 500
const CABECALHOS = {
  'content-type': 'application/json',
  'user-agent': 'lotus-site medir-latencia (7.2.5)',
}
const OPCOES = new Set(['alvo', 'sondas', 'pais', 'quantas'])

/** @param {string[]} argv */
function lerArgumentos(argv) {
  /** @type {Record<string, string>} */
  const valores = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? ''
    const nome = arg.slice(2)
    if (!arg.startsWith('--') || !OPCOES.has(nome)) {
      throw new Error(`argumento inesperado: ${arg}`)
    }
    const valor = argv[++i]
    if (valor === undefined) throw new Error(`${arg} exige valor`)
    valores[nome] = valor
  }
  return valores
}

/**
 * @param {string} mensagem
 * @returns {never}
 */
function falhar(mensagem) {
  console.error(mensagem)
  process.exit(1)
}

/** @param {Response} resposta */
async function corpoDoErro(resposta) {
  try {
    return await resposta.json()
  } catch {
    return null
  }
}

/**
 * @param {string} id
 * @returns {Promise<Medicao>}
 */
async function esperarFim(id) {
  const inicio = Date.now()
  for (;;) {
    const resposta = await fetch(`${API_DO_GLOBALPING}/${id}`, {
      headers: CABECALHOS,
    })
    if (!resposta.ok) {
      falhar(descreverErroDaApi(resposta.status, await corpoDoErro(resposta)))
    }
    const medicao = /** @type {Medicao} */ (await resposta.json())
    if (medicao.status !== 'in-progress') return medicao
    if (Date.now() - inicio > LIMITE_MS) {
      falhar(
        `medição ${id} ainda em andamento depois de ${LIMITE_MS / 1000} s; o resultado fica em ${API_DO_GLOBALPING}/${id}`,
      )
    }
    await new Promise((pronto) => setTimeout(pronto, INTERVALO_MS))
  }
}

const args = lerArgumentos(process.argv.slice(2))
if (!args.alvo) throw new Error('--alvo é obrigatório')
let pedido
try {
  pedido = pedidoDeMedicao({
    alvo: args.alvo,
    sondas: args.sondas,
    pais: args.pais,
    quantas: args.quantas === undefined ? undefined : Number(args.quantas),
  })
} catch (erro) {
  if (erro instanceof Error) {
    falhar(erro.message)
  }
  throw erro
}

const criada = await fetch(API_DO_GLOBALPING, {
  method: 'POST',
  headers: CABECALHOS,
  body: JSON.stringify(pedido),
})
if (criada.status !== 202) {
  falhar(descreverErroDaApi(criada.status, await corpoDoErro(criada)))
}
const { id } = /** @type {{ id: string }} */ (await criada.json())
console.error(`medição ${id} criada; esperando o fim`)

const medicao = await esperarFim(id)
console.log(tabelaDeLatencia(medicao, descreverSondas(pedido.locations)))
if (resumirMedicao(medicao).terminadas === 0) {
  falhar('nenhuma sonda terminou')
}
