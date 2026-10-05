// Latência HTTP medida pelo Globalping a partir de sondas no Chile (7.2.5,
// spec §4.2 e D7). Aqui fica só a parte pura — o pedido, o resumo de cada
// sonda, as medianas e a tabela —, testada com uma medição real em
// `latencia.test.mjs`. A rede e a impressão ficam em `medir-latencia.mjs`.
//
// As formas abaixo são as da OpenAPI do Globalping
// (https://api.globalping.io/v1/spec.yaml, lida em 2026-10-05): sonda que não
// rodou (`failed`, `offline`) traz só `status` e `rawOutput`; um cabeçalho
// repetido vem como lista; `dns` e `tls` podem ser `null`.

export const API_DO_GLOBALPING = 'https://api.globalping.io/v1/measurements'

/**
 * @typedef {{
 *   status: string,
 *   rawOutput?: string,
 *   resolvedAddress?: string | null,
 *   statusCode?: number,
 *   headers?: Record<string, string | string[]>,
 *   timings?: {
 *     dns: number | null,
 *     tcp: number,
 *     tls: number | null,
 *     firstByte: number,
 *     total: number,
 *   },
 * }} ResultadoHttp
 * @typedef {{
 *   probe: { city: string, asn: number, network: string },
 *   result: ResultadoHttp,
 * }} ItemDaMedicao
 * @typedef {{
 *   id: string,
 *   status: string,
 *   createdAt: string,
 *   target: string,
 *   results: ItemDaMedicao[],
 * }} Medicao
 * @typedef {{
 *   cidade: string,
 *   rede: string,
 *   status: string,
 *   ip: string,
 *   http: string,
 *   pop: string,
 *   cache: string,
 *   dns: number | null,
 *   tcp: number | null,
 *   tls: number | null,
 *   firstByte: number | null,
 *   total: number | null,
 * }} Sonda
 */

const HOST = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/

/**
 * O corpo do `POST` (spec §4.2). `sondas` é o ID de uma medição anterior: a
 * API devolve as mesmas sondas, na mesma ordem, enquanto aquela medição
 * existir. Sem ele, `quantas` sondas novas do `pais`. Até 50 sondas por
 * medição sem chave de API.
 * @param {{ alvo: string, sondas?: string, pais?: string, quantas?: number }} opcoes
 */
export function pedidoDeMedicao({ alvo, sondas, pais = 'CL', quantas = 10 }) {
  if (!HOST.test(alvo)) {
    throw new Error(
      `--alvo deve ser só o host, sem esquema nem caminho: ${alvo}`,
    )
  }
  if (!/^[A-Z]{2}$/.test(pais)) {
    throw new Error(
      `--pais deve ser um código de duas letras, como CL: ${pais}`,
    )
  }
  if (!Number.isInteger(quantas) || quantas < 1 || quantas > 50) {
    throw new Error(`--quantas deve ser um inteiro de 1 a 50: ${quantas}`)
  }
  if (sondas !== undefined && !/^[A-Za-z0-9]+$/.test(sondas)) {
    throw new Error(`--sondas deve ser o ID de uma medição: ${sondas}`)
  }
  return {
    type: 'http',
    target: alvo,
    locations: sondas ?? [{ country: pais, limit: quantas }],
    measurementOptions: {
      protocol: 'HTTPS',
      // A OpenAPI documenta `port` com padrão 80. Explícito, para não
      // depender de a API deduzir 443 do protocolo.
      port: 443,
      request: { method: 'GET', path: '/' },
    },
  }
}

/**
 * Valor de um cabeçalho da resposta. Ausente vira `—`; lista (cabeçalho
 * repetido) vira os valores separados por vírgula.
 * @param {Record<string, string | string[]> | undefined} cabecalhos
 * @param {string} nome em minúsculas, como a API entrega
 */
export function cabecalho(cabecalhos, nome) {
  const valor = cabecalhos?.[nome]
  if (valor === undefined) return '—'
  return Array.isArray(valor) ? valor.join(', ') : valor
}

/**
 * Uma sonda da tabela. Sonda que não terminou fica com o status dela e `—`
 * no resto.
 * @param {ItemDaMedicao} item
 * @returns {Sonda}
 */
export function resumirSonda({ probe, result }) {
  const tempos = result.status === 'finished' ? result.timings : undefined
  return {
    cidade: probe.city,
    rede: `AS${probe.asn} ${probe.network}`,
    status: result.status,
    ip: result.resolvedAddress ?? '—',
    http: result.statusCode === undefined ? '—' : String(result.statusCode),
    pop: cabecalho(result.headers, 'x-amz-cf-pop'),
    cache: cabecalho(result.headers, 'x-cache'),
    dns: tempos?.dns ?? null,
    tcp: tempos?.tcp ?? null,
    tls: tempos?.tls ?? null,
    firstByte: tempos?.firstByte ?? null,
    total: tempos?.total ?? null,
  }
}

/**
 * Mediana, arredondada ao ms; com número par de valores, a média dos dois do
 * meio. Lista vazia não tem mediana.
 * @param {number[]} valores
 * @returns {number | null}
 */
export function mediana(valores) {
  if (valores.length === 0) return null
  const ordenados = [...valores].sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  const alto = ordenados[meio] ?? 0
  if (ordenados.length % 2 === 1) return alto
  return Math.round(((ordenados[meio - 1] ?? 0) + alto) / 2)
}

/**
 * As sondas na ordem da API, quantas terminaram e os tempos de `firstByte`
 * e `total` só das que terminaram — as que entram nas medianas (spec §4.2).
 * @param {Medicao} medicao
 */
export function resumirMedicao(medicao) {
  const sondas = medicao.results.map(resumirSonda)
  const terminadas = sondas.filter((sonda) => sonda.status === 'finished')
  /** @param {(sonda: Sonda) => number | null} campo */
  const tempos = (campo) =>
    terminadas.flatMap((sonda) => {
      const valor = campo(sonda)
      return valor === null ? [] : [valor]
    })
  return {
    sondas,
    terminadas: terminadas.length,
    firstByte: tempos((sonda) => sonda.firstByte),
    total: tempos((sonda) => sonda.total),
  }
}

/** @param {number[]} valores */
function faixa(valores) {
  const meio = mediana(valores)
  if (meio === null) return '—'
  return `${meio} ms (${Math.min(...valores)}–${Math.max(...valores)})`
}

/** @param {number | null} valor */
const ms = (valor) => (valor === null ? '—' : String(valor))

/** @param {string} texto */
const celula = (texto) => texto.replaceAll('|', '\\|')

/**
 * A tabela da evidência (spec §4.2): uma linha por sonda, na ordem da API —
 * a mesma entre medições que reusam as sondas —, as medianas e o ID.
 * @param {Medicao} medicao
 * @param {string} origem de onde vieram as sondas (`descreverSondas`)
 */
export function tabelaDeLatencia(medicao, origem) {
  const { sondas, terminadas, firstByte, total } = resumirMedicao(medicao)
  return [
    `Medição \`${medicao.id}\` de \`${medicao.target}\`, criada em ${medicao.createdAt}; sondas: ${origem}.`,
    '',
    '| # | sonda | rede | status | IP resolvido | HTTP | x-amz-cf-pop | x-cache | dns | tcp | tls | firstByte | total |',
    '| - | ----- | ---- | ------ | ------------ | ---- | ------------ | ------- | --- | --- | --- | --------- | ----- |',
    ...sondas.map(
      (s, i) =>
        `| ${i + 1} | ${celula(s.cidade)} | ${celula(s.rede)} | ${s.status} | ${s.ip} | ${s.http} | ${celula(s.pop)} | ${celula(s.cache)} | ${ms(s.dns)} | ${ms(s.tcp)} | ${ms(s.tls)} | ${ms(s.firstByte)} | ${ms(s.total)} |`,
    ),
    '',
    `${terminadas} de ${sondas.length} sondas terminaram. \`firstByte\`: mediana ${faixa(firstByte)}; \`total\`: mediana ${faixa(total)}.`,
  ].join('\n')
}

/**
 * De onde vieram as sondas, para a primeira linha da tabela.
 * @param {string | { country: string, limit: number }[]} locations
 */
export function descreverSondas(locations) {
  if (typeof locations === 'string') {
    return `as mesmas da medição \`${locations}\``
  }
  return locations
    .map((local) => `${local.limit} novas de ${local.country}`)
    .join(', ')
}

/**
 * Uma resposta de erro da API (`{ error: { type, message } }`). `422` é
 * nenhuma sonda achada, ou ID de medição vencido ou inválido em `--sondas`;
 * `429`, o limite por hora.
 * @param {number} status
 * @param {unknown} corpo
 */
export function descreverErroDaApi(status, corpo) {
  const erro =
    /** @type {{ error?: { type?: string, message?: string } } | null} */ (
      corpo
    )?.error
  const tipo = erro?.type ? ` (${erro.type})` : ''
  return `Globalping respondeu ${status}${tipo}: ${erro?.message ?? JSON.stringify(corpo)}`
}
