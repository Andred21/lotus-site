import { describe, expect, it } from 'vitest'
import {
  cabecalho,
  descreverErroDaApi,
  descreverSondas,
  mediana,
  pedidoDeMedicao,
  resumirMedicao,
  tabelaDeLatencia,
} from './lib/latencia.mjs'

/** @typedef {import('./lib/latencia.mjs').Medicao} Medicao */
/** @typedef {import('./lib/latencia.mjs').ItemDaMedicao} ItemDaMedicao */

// Tirada da medição 2RPHs1DyUphRHy40L00021G3h (2026-10-05T01:33Z, `GET /` em
// dhpoztt69jydz.cloudfront.net a partir de cinco sondas no Chile, a tabela de
// D4 na spec), só com os campos que a tabela lê.
/** @type {Medicao} */
const MEDICAO_REAL = {
  id: '2RPHs1DyUphRHy40L00021G3h',
  status: 'finished',
  createdAt: '2026-10-05T01:33:53.025Z',
  target: 'dhpoztt69jydz.cloudfront.net',
  results: [
    {
      probe: { city: 'Santiago', asn: 61138, network: 'Zappie Host' },
      result: {
        status: 'finished',
        resolvedAddress: '3.166.160.56',
        statusCode: 200,
        headers: {
          'x-amz-cf-pop': 'MIA50-P3',
          'x-cache': 'RefreshHit from cloudfront',
        },
        timings: { total: 1638, dns: 109, tcp: 149, tls: 837, firstByte: 538 },
      },
    },
    {
      probe: { city: 'Vina del Mar', asn: 31898, network: 'Oracle' },
      result: {
        status: 'finished',
        resolvedAddress: '3.166.160.79',
        statusCode: 200,
        headers: {
          'x-amz-cf-pop': 'MIA50-P3',
          'x-cache': 'Hit from cloudfront',
        },
        timings: { total: 854, dns: 109, tcp: 128, tls: 131, firstByte: 486 },
      },
    },
    {
      probe: { city: 'Santiago', asn: 20473, network: 'The Constant Company' },
      result: {
        status: 'finished',
        resolvedAddress: '3.167.246.28',
        statusCode: 200,
        headers: {
          'x-amz-cf-pop': 'DFW59-P1',
          'x-cache': 'Miss from cloudfront',
        },
        timings: { total: 1028, dns: 56, tcp: 128, tls: 133, firstByte: 710 },
      },
    },
    {
      probe: {
        city: 'Santiago',
        asn: 270013,
        network: 'J AND J SPA (INFOFRACTAL)',
      },
      result: {
        status: 'finished',
        resolvedAddress: '3.166.160.121',
        statusCode: 200,
        headers: {
          'x-amz-cf-pop': 'MIA50-P3',
          'x-cache': 'Hit from cloudfront',
        },
        timings: { total: 801, dns: 112, tcp: 106, tls: 109, firstByte: 473 },
      },
    },
    {
      probe: { city: 'Santiago', asn: 136907, network: 'HUAWEI CLOUDS' },
      result: {
        status: 'finished',
        resolvedAddress: '3.166.160.79',
        statusCode: 200,
        headers: {
          'x-amz-cf-pop': 'MIA50-P3',
          'x-cache': 'RefreshHit from cloudfront',
        },
        timings: { total: 830, dns: 57, tcp: 122, tls: 125, firstByte: 525 },
      },
    },
  ],
}

// Sonda que não rodou: a OpenAPI do Globalping (`OfflineTestResult`,
// `FailedTestResult`) só garante `status` e `rawOutput`.
/** @type {ItemDaMedicao} */
const OFFLINE = {
  probe: { city: 'Santiago', asn: 61138, network: 'Zappie Host' },
  result: { status: 'offline', rawOutput: 'This probe is currently offline.' },
}

// Primeira sonda da medição 2bQ2J3jMJomWQe6MR00021G3h, o WordPress: sem
// `x-amz-cf-pop` nem `x-cache`.
/** @type {ItemDaMedicao} */
const WORDPRESS = {
  probe: { city: 'Santiago', asn: 61138, network: 'Zappie Host' },
  result: {
    status: 'finished',
    resolvedAddress: '185.146.167.195',
    statusCode: 200,
    headers: { server: 'Apache' },
    timings: { total: 31, dns: 15, tcp: 2, tls: 6, firstByte: 6 },
  },
}

describe('pedidoDeMedicao', () => {
  it('pede GET / por HTTPS a dez sondas novas do Chile por padrão', () => {
    expect(pedidoDeMedicao({ alvo: 'lotusotec.cl' })).toEqual({
      type: 'http',
      target: 'lotusotec.cl',
      locations: [{ country: 'CL', limit: 10 }],
      measurementOptions: {
        protocol: 'HTTPS',
        port: 443,
        request: { method: 'GET', path: '/' },
      },
    })
  })

  it('reusa as sondas de uma medição anterior pelo ID', () => {
    expect(
      pedidoDeMedicao({
        alvo: 'dhpoztt69jydz.cloudfront.net',
        sondas: '2RPHs1DyUphRHy40L00021G3h',
      }).locations,
    ).toBe('2RPHs1DyUphRHy40L00021G3h')
  })

  it('recusa alvo com esquema ou caminho antes de gastar a cota', () => {
    expect(() => pedidoDeMedicao({ alvo: 'https://lotusotec.cl/' })).toThrow(
      '--alvo deve ser só o host',
    )
    expect(() => pedidoDeMedicao({ alvo: 'lotusotec.cl/' })).toThrow(
      '--alvo deve ser só o host',
    )
  })

  it('recusa país, quantidade e ID fora da forma', () => {
    expect(() => pedidoDeMedicao({ alvo: 'lotusotec.cl', pais: 'cl' })).toThrow(
      '--pais',
    )
    expect(() => pedidoDeMedicao({ alvo: 'lotusotec.cl', quantas: 0 })).toThrow(
      '--quantas',
    )
    expect(() =>
      pedidoDeMedicao({ alvo: 'lotusotec.cl', quantas: 51 }),
    ).toThrow('--quantas')
    expect(() =>
      pedidoDeMedicao({ alvo: 'lotusotec.cl', sondas: 'lotusotec.cl' }),
    ).toThrow('--sondas')
  })
})

describe('mediana', () => {
  it('ímpar é o valor do meio', () => {
    expect(mediana([538, 486, 710, 473, 525])).toBe(525)
  })

  it('par é a média dos dois do meio, arredondada', () => {
    // Dez sondas pedidas: se todas terminam, a lista é par.
    expect(mediana([473, 486, 525, 538])).toBe(506)
    expect(mediana([2, 3])).toBe(3)
  })

  it('lista vazia não tem mediana', () => {
    expect(mediana([])).toBeNull()
  })
})

describe('cabecalho', () => {
  it('ausente vira travessão; lista vira valores separados por vírgula', () => {
    expect(cabecalho({ server: 'Apache' }, 'x-amz-cf-pop')).toBe('—')
    expect(cabecalho(undefined, 'x-cache')).toBe('—')
    expect(cabecalho({ 'x-cache': ['a', 'b'] }, 'x-cache')).toBe('a, b')
  })
})

describe('resumo e tabela sobre a medição real', () => {
  it('medianas de firstByte e total são as da tabela de D4', () => {
    const resumo = resumirMedicao(MEDICAO_REAL)
    expect(resumo.terminadas).toBe(5)
    expect(mediana(resumo.firstByte)).toBe(525)
    expect(mediana(resumo.total)).toBe(854)
  })

  it('uma linha por sonda, na ordem da API, e o resumo no fim', () => {
    const tabela = tabelaDeLatencia(MEDICAO_REAL, 'cinco novas de CL')
    expect(tabela).toContain(
      'Medição `2RPHs1DyUphRHy40L00021G3h` de `dhpoztt69jydz.cloudfront.net`, criada em 2026-10-05T01:33:53.025Z; sondas: cinco novas de CL.',
    )
    expect(tabela).toContain(
      '| 3 | Santiago | AS20473 The Constant Company | finished | 3.167.246.28 | 200 | DFW59-P1 | Miss from cloudfront | 56 | 128 | 133 | 710 | 1028 |',
    )
    expect(tabela).toContain(
      '5 de 5 sondas terminaram. `firstByte`: mediana 525 ms (473–710); `total`: mediana 854 ms (801–1638).',
    )
  })

  it('sonda que não rodou aparece com o status dela e fica fora das medianas', () => {
    const comOffline = {
      ...MEDICAO_REAL,
      results: [...MEDICAO_REAL.results, OFFLINE],
    }
    const tabela = tabelaDeLatencia(comOffline, 'as mesmas')
    expect(tabela).toContain(
      '| 6 | Santiago | AS61138 Zappie Host | offline | — | — | — | — | — | — | — | — | — |',
    )
    expect(tabela).toContain(
      '5 de 6 sondas terminaram. `firstByte`: mediana 525 ms (473–710); `total`: mediana 854 ms (801–1638).',
    )
  })

  it('cabeçalho de borda ausente vira travessão (o WordPress não tem x-amz-cf-pop)', () => {
    const tabela = tabelaDeLatencia(
      { ...MEDICAO_REAL, target: 'lotusotec.cl', results: [WORDPRESS] },
      'uma',
    )
    expect(tabela).toContain(
      '| 1 | Santiago | AS61138 Zappie Host | finished | 185.146.167.195 | 200 | — | — | 15 | 2 | 6 | 6 | 31 |',
    )
  })

  it('nenhuma sonda terminou: zero no resumo e sem mediana', () => {
    const vazia = { ...MEDICAO_REAL, results: [OFFLINE] }
    expect(resumirMedicao(vazia).terminadas).toBe(0)
    expect(tabelaDeLatencia(vazia, 'uma')).toContain(
      '0 de 1 sondas terminaram. `firstByte`: mediana —; `total`: mediana —.',
    )
  })

  it('barra vertical em nome de rede não quebra a tabela', () => {
    const tabela = tabelaDeLatencia(
      {
        ...MEDICAO_REAL,
        results: [
          { ...WORDPRESS, probe: { ...WORDPRESS.probe, network: 'A|B' } },
        ],
      },
      'uma',
    )
    expect(tabela).toContain('| AS61138 A\\|B |')
  })
})

describe('descrições para a evidência', () => {
  it('diz de onde vieram as sondas', () => {
    expect(descreverSondas([{ country: 'CL', limit: 10 }])).toBe(
      '10 novas de CL',
    )
    expect(descreverSondas('2RPHs1DyUphRHy40L00021G3h')).toBe(
      'as mesmas da medição `2RPHs1DyUphRHy40L00021G3h`',
    )
  })

  it('erro da API sai com o status, o tipo e a mensagem', () => {
    // Resposta real a `--sondas` com um ID que não existe (2026-10-05): o
    // mesmo 422 de "nenhuma sonda achada" (OpenAPI, `measurements422`).
    expect(
      descreverErroDaApi(422, {
        error: {
          type: 'no_probes_found',
          message: 'No matching IPv4 probes available.',
        },
      }),
    ).toBe(
      'Globalping respondeu 422 (no_probes_found): No matching IPv4 probes available.',
    )
    expect(descreverErroDaApi(502, null)).toBe('Globalping respondeu 502: null')
  })
})
