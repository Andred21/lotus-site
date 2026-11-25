import { afterEach, describe, expect, it, vi } from 'vitest'
import { certificadoSchema } from '../../lib/certificado'
import { UUID, VIGENTE } from '../../lib/certificado.fixture'
import {
  TEMPO_LIMITE_DO_PDF_MS,
  TEMPO_LIMITE_MS,
  URL_PADRAO_DA_API,
  createCertificadosApi,
  lerRetryAfter,
  nomeDoArquivo,
} from './api-certificados'

const BASE = 'https://app.lotusotec.cl'

function stubFetch(response: Response | Error) {
  const fetchSpy = vi.fn<typeof fetch>(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  )
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
}

function stubFetchPendente() {
  const fetchSpy = vi.fn<typeof fetch>(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      }),
  )
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
}

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

const respostaDaApi = {
  ...VIGENTE,
  cliente: { name: 'Empresa X' },
  redator: { name: 'Fulano' },
}

const api = () => createCertificadosApi(BASE)

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('certificadoSchema', () => {
  it('aceita instante com fração de 6 dígitos (P10)', () => {
    const r = certificadoSchema.safeParse({
      ...VIGENTE,
      revoked_at: '2026-10-05T14:30:00.000000Z',
    })
    expect(r.success).toBe(true)
  })
})

describe('constantes', () => {
  it('usa o app do Lotus como padrão', () => {
    expect(URL_PADRAO_DA_API).toBe(BASE)
  })
})

describe('lerRetryAfter', () => {
  it.each([
    ['45', 45],
    ['0', null],
    ['-5', null],
    ['1.5', null],
    ['Wed, 21 Oct 2015 07:28:00 GMT', null],
    ['', null],
    [null, null],
  ])('%j vira %j', (entrada, esperado) => {
    expect(lerRetryAfter(entrada)).toBe(esperado)
  })
})

describe('nomeDoArquivo', () => {
  it('lê filename com e sem aspas, sem diretório', () => {
    expect(nomeDoArquivo('attachment; filename="a.pdf"', 'LOT-1')).toBe('a.pdf')
    expect(nomeDoArquivo('attachment; filename=b.pdf', 'LOT-1')).toBe('b.pdf')
    expect(nomeDoArquivo('attachment; filename="../x.pdf"', 'LOT-1')).toBe(
      'x.pdf',
    )
    expect(nomeDoArquivo(null, 'LOT-1')).toBe('certificado-LOT-1.pdf')
  })
})

describe('porUuid', () => {
  it('pede o uuid só com Accept json e sem credenciais', async () => {
    const spy = stubFetch(json(VIGENTE))
    await api().porUuid(UUID)

    expect(spy.mock.calls[0]?.[0]).toBe(
      `https://app.lotusotec.cl/api/publico/certificados/${UUID}`,
    )
    const init = spy.mock.calls[0]?.[1]
    expect(init?.credentials).toBe('omit')
    expect(init?.headers).toEqual({ Accept: 'application/json' })
    expect(init?.body).toBeUndefined()
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('200 válido vira certificado sem cliente nem redator', async () => {
    stubFetch(json(respostaDaApi))
    const r = await api().porUuid(UUID)
    expect(r).toEqual({ tipo: 'certificado', uuid: UUID, certificado: VIGENTE })
    if (r.tipo !== 'certificado') throw new Error('esperava certificado')
    expect(r.certificado).not.toHaveProperty('cliente')
    expect(r.certificado).not.toHaveProperty('redator')
  })

  it('200 com display_status desconhecido é falha', async () => {
    stubFetch(json({ ...VIGENTE, display_status: 'outro' }))
    expect(await api().porUuid(UUID)).toEqual({ tipo: 'falha' })
  })

  it('200 com corpo que não é JSON é falha', async () => {
    stubFetch(new Response('<html></html>', { status: 200 }))
    expect(await api().porUuid(UUID)).toEqual({ tipo: 'falha' })
  })

  it('404 com corpo HTML é nao-encontrado', async () => {
    stubFetch(new Response('<html>404</html>', { status: 404 }))
    expect(await api().porUuid(UUID)).toEqual({ tipo: 'nao-encontrado' })
  })

  it('410 e 422 são falha', async () => {
    stubFetch(new Response('', { status: 410 }))
    expect(await api().porUuid(UUID)).toEqual({ tipo: 'falha' })
    stubFetch(new Response('', { status: 422 }))
    expect(await api().porUuid(UUID)).toEqual({ tipo: 'falha' })
  })

  it('429 do QR é sempre espera', async () => {
    stubFetch(
      new Response('', { status: 429, headers: { 'Retry-After': '3000' } }),
    )
    expect(await api().porUuid(UUID)).toEqual({
      tipo: 'espera',
      segundos: 3000,
    })
  })

  it('500, rede e teto viram falha', async () => {
    stubFetch(new Response('', { status: 500 }))
    expect(await api().porUuid(UUID)).toEqual({ tipo: 'falha' })

    stubFetch(new TypeError('Failed to fetch'))
    expect(await api().porUuid(UUID)).toEqual({ tipo: 'falha' })

    vi.useFakeTimers()
    stubFetchPendente()
    const pendente = api().porUuid(UUID)
    vi.advanceTimersByTime(TEMPO_LIMITE_MS)
    expect(await pendente).toEqual({ tipo: 'falha' })
  })
})

describe('porCodigo', () => {
  it('manda só codigo e rut no corpo, normalizados', async () => {
    const spy = stubFetch(json({ ...respostaDaApi, uuid: UUID }))
    await api().porCodigo(' lot-2026-123 ', ' 12.345.678-5 ')

    const url = String(spy.mock.calls[0]?.[0])
    expect(url.endsWith('/consulta')).toBe(true)
    for (const parte of ['12.345.678', '12345678', '123456785']) {
      expect(url).not.toContain(parte)
    }
    const init = spy.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(init?.credentials).toBe('omit')
    expect(init?.body).toBe('{"codigo":"LOT-2026-123","rut":"12.345.678-5"}')
    expect(init?.headers).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    })
  })

  it('200 vira certificado com o uuid da resposta', async () => {
    stubFetch(json({ ...respostaDaApi, uuid: UUID }))
    const r = await api().porCodigo('LOT-2026-144', '1-9')
    expect(r).toEqual({ tipo: 'certificado', uuid: UUID, certificado: VIGENTE })
  })

  it('200 da consulta sem uuid é falha', async () => {
    stubFetch(json(respostaDaApi))
    expect(await api().porCodigo('LOT-2026-144', '1-9')).toEqual({
      tipo: 'falha',
    })
  })

  it('404 é nao-encontrado, 410 é falha', async () => {
    stubFetch(new Response('<html></html>', { status: 404 }))
    expect(await api().porCodigo('a', 'b')).toEqual({ tipo: 'nao-encontrado' })
    stubFetch(new Response('', { status: 410 }))
    expect(await api().porCodigo('a', 'b')).toEqual({ tipo: 'falha' })
  })

  it('422 com errors.rut marca só o RUT', async () => {
    stubFetch(json({ errors: { rut: ['x'], outro: ['y'] } }, 422))
    expect(await api().porCodigo('a', 'b')).toEqual({
      tipo: 'formato-invalido',
      campos: ['rut'],
    })
  })

  it('422 sem corpo JSON marca os dois', async () => {
    stubFetch(new Response('', { status: 422 }))
    expect(await api().porCodigo('a', 'b')).toEqual({
      tipo: 'formato-invalido',
      campos: ['codigo', 'rut'],
    })
  })

  it.each([
    ['45', { tipo: 'espera', segundos: 45 }],
    ['60', { tipo: 'espera', segundos: 60 }],
    ['61', { tipo: 'bloqueio', segundos: 61 }],
    ['3600', { tipo: 'bloqueio', segundos: 3600 }],
    [null, { tipo: 'espera', segundos: null }],
  ])('429 com Retry-After %j', async (valor, esperado) => {
    stubFetch(
      new Response('', {
        status: 429,
        headers: valor === null ? {} : { 'Retry-After': valor },
      }),
    )
    expect(await api().porCodigo('a', 'b')).toEqual(esperado)
  })

  it('500, rede e teto viram falha', async () => {
    stubFetch(new Response('', { status: 500 }))
    expect(await api().porCodigo('a', 'b')).toEqual({ tipo: 'falha' })
    stubFetch(new TypeError('Failed to fetch'))
    expect(await api().porCodigo('a', 'b')).toEqual({ tipo: 'falha' })

    vi.useFakeTimers()
    stubFetchPendente()
    const pendente = api().porCodigo('a', 'b')
    vi.advanceTimersByTime(TEMPO_LIMITE_MS)
    expect(await pendente).toEqual({ tipo: 'falha' })
  })
})

describe('pdf', () => {
  const pdfResponse = (headers: HeadersInit = {}) =>
    new Response('%PDF', {
      status: 200,
      headers: { 'Content-Type': 'application/pdf', ...headers },
    })

  it('200 devolve Blob e o nome do cabeçalho; pede só Accept pdf', async () => {
    const spy = stubFetch(
      pdfResponse({
        'Content-Disposition':
          'attachment; filename="certificado-LOT-2026-144.pdf"',
      }),
    )
    const r = await api().pdf(UUID, 'LOT-2026-144')
    expect(r.tipo).toBe('pdf')
    if (r.tipo !== 'pdf') throw new Error('esperava pdf')
    expect(r.nome).toBe('certificado-LOT-2026-144.pdf')
    expect(r.arquivo).toBeInstanceOf(Blob)

    expect(spy.mock.calls[0]?.[0]).toBe(
      `https://app.lotusotec.cl/api/publico/certificados/${UUID}/pdf`,
    )
    const init = spy.mock.calls[0]?.[1]
    expect(init?.headers).toEqual({ Accept: 'application/pdf' })
    expect(init?.credentials).toBe('omit')
  })

  it('sem Content-Disposition usa o nome padrão; remove diretório', async () => {
    stubFetch(pdfResponse())
    expect(await api().pdf(UUID, 'LOT-2026-144')).toMatchObject({
      nome: 'certificado-LOT-2026-144.pdf',
    })
    stubFetch(
      pdfResponse({ 'Content-Disposition': 'attachment; filename="../x.pdf"' }),
    )
    expect(await api().pdf(UUID, 'LOT-2026-144')).toMatchObject({
      nome: 'x.pdf',
    })
  })

  it('410 revogado, 404 falha, 429 espera', async () => {
    stubFetch(new Response('', { status: 410 }))
    expect(await api().pdf(UUID, 'c')).toEqual({ tipo: 'revogado' })
    stubFetch(new Response('', { status: 404 }))
    expect(await api().pdf(UUID, 'c')).toEqual({ tipo: 'falha' })
    stubFetch(
      new Response('', { status: 429, headers: { 'Retry-After': '7' } }),
    )
    expect(await api().pdf(UUID, 'c')).toEqual({ tipo: 'espera', segundos: 7 })
  })

  it('teto de 30 s vira falha', async () => {
    vi.useFakeTimers()
    stubFetchPendente()
    const pendente = api().pdf(UUID, 'c')
    vi.advanceTimersByTime(TEMPO_LIMITE_DO_PDF_MS)
    expect(await pendente).toEqual({ tipo: 'falha' })
  })
})

describe('base', () => {
  it('com barra final não duplica a barra', async () => {
    const spy = stubFetch(json(VIGENTE))
    await createCertificadosApi('http://localhost:8080/').porUuid(UUID)
    expect(spy.mock.calls[0]?.[0]).toBe(
      `http://localhost:8080/api/publico/certificados/${UUID}`,
    )
  })
})
