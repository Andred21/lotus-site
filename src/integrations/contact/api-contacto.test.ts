import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContactMessage } from '../../lib/contact-schema'
import {
  CONTACT_ENDPOINT,
  CONTACT_SEND_TIMEOUT_MS,
  createApiContactoSender,
  sha256Hex,
} from './api-contacto'

const MESSAGE: ContactMessage = {
  nombre: 'Ana Pérez',
  email: 'ana@lotusotec.cl',
  empresa: 'Lotus',
  mensaje: 'Necesito información sobre el curso de alta tensión.',
  captcha: 'token-de-teste',
}

// SHA-256 do JSON.stringify(MESSAGE) exato, medido com node:crypto em
// 2026-09-26. Fixar o valor aqui impede o teste de provar o hash com a
// própria função que está sob teste.
const HASH_DA_MENSAGEM =
  '78f5f03e1c3848eaa26f13b666dc340c0f3c13da201dd7236be3592f86d2d326'

// `vi.fn<typeof fetch>` importa: sem o tipo, `mock.calls[0]` é a tupla vazia
// e `calls[0]?.[1]` vira erro de tipo em `tsc -b`.
function stubFetch(response: Response | Error) {
  const fetchSpy = vi.fn<typeof fetch>(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  )
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('sha256Hex', () => {
  it('bate com o vetor conhecido de "abc"', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })
})

describe('createApiContactoSender', () => {
  it('posta em /api/contacto o JSON da mensagem com o hash do corpo no cabeçalho', async () => {
    const fetchSpy = stubFetch(jsonResponse({ ok: true }))

    const outcome = await createApiContactoSender()(MESSAGE)

    expect(outcome).toEqual({ status: 'sent' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(CONTACT_ENDPOINT)

    const init = fetchSpy.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
    expect(String(init?.body)).toBe(JSON.stringify(MESSAGE))
    expect(new Headers(init?.headers).get('x-amz-content-sha256')).toBe(
      HASH_DA_MENSAGEM,
    )
    expect(new Headers(init?.headers).get('content-type')).toBe(
      'application/json',
    )
  })

  it('só 2xx com ok:true vira sent', async () => {
    stubFetch(jsonResponse({ ok: false }))
    expect(await createApiContactoSender()(MESSAGE)).toEqual({
      status: 'failed',
    })

    stubFetch(jsonResponse({ ok: true }, 502))
    expect(await createApiContactoSender()(MESSAGE)).toEqual({
      status: 'failed',
    })

    stubFetch(new Response('<html>403</html>', { status: 403 }))
    expect(await createApiContactoSender()(MESSAGE)).toEqual({
      status: 'failed',
    })
  })

  it('propaga a falha de rede para o intake converter em failed', async () => {
    stubFetch(new TypeError('Failed to fetch'))

    await expect(createApiContactoSender()(MESSAGE)).rejects.toThrow(
      'Failed to fetch',
    )
  })

  it('aborta o envio que passa do limite e propaga a rejeição', async () => {
    vi.useFakeTimers()
    // O `fetch` só é chamado depois do `setTimeout` do limite, e o hash antes
    // dele sai de `crypto.subtle.digest`, que completa num macrotask real, fora
    // do relógio falso — sob carga, mais tarde. Esperar a chamada garante que
    // o timer já existe quando o relógio avança, sem depender de quanto o
    // digest demora.
    let avisarChamada!: () => void
    const chamado = new Promise<void>((resolve) => {
      avisarChamada = resolve
    })
    const fetchSpy = vi.fn<typeof fetch>((_input, init) => {
      avisarChamada()
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The user aborted a request.', 'AbortError'))
        })
      })
    })
    vi.stubGlobal('fetch', fetchSpy)

    const pendente = createApiContactoSender()(MESSAGE)
    const rejeicao = expect(pendente).rejects.toThrow(
      'The user aborted a request.',
    )

    await chamado
    await vi.advanceTimersByTimeAsync(CONTACT_SEND_TIMEOUT_MS)
    await rejeicao
  })
})
