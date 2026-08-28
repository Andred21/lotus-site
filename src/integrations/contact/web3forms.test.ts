import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContactMessage } from '../../lib/contact-schema'
import { CONTACT_SEND_TIMEOUT_MS, createWeb3FormsSender } from './web3forms'

const MESSAGE: ContactMessage = {
  nombre: 'Ana Pérez',
  email: 'ana@lotusotec.cl',
  empresa: 'Lotus',
  mensaje: 'Necesito información sobre el curso de alta tensión.',
}

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

describe('createWeb3FormsSender', () => {
  it('posta no endpoint documentado, com a chave e os campos da mensagem', async () => {
    const fetchSpy = stubFetch(jsonResponse({ success: true }))

    const outcome = await createWeb3FormsSender('chave-de-teste')(MESSAGE)

    expect(outcome).toEqual({ status: 'sent' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('https://api.web3forms.com/submit')

    const init = fetchSpy.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
    expect(JSON.parse(String(init?.body))).toEqual({
      access_key: 'chave-de-teste',
      subject: 'Nuevo mensaje desde el sitio de Lotus OTEC',
      from_name: 'Lotus OTEC',
      name: 'Ana Pérez',
      email: 'ana@lotusotec.cl',
      company: 'Lotus',
      message: 'Necesito información sobre el curso de alta tensión.',
    })
  })

  it('trata resposta de erro do provedor como failed', async () => {
    stubFetch(jsonResponse({ success: false, message: 'Invalid access key' }))

    expect(await createWeb3FormsSender('chave-ruim')(MESSAGE)).toEqual({
      status: 'failed',
    })
  })

  it('trata HTTP fora de 2xx como failed, sem ler o corpo', async () => {
    stubFetch(jsonResponse({ message: 'boom' }, 500))

    expect(await createWeb3FormsSender('chave-de-teste')(MESSAGE)).toEqual({
      status: 'failed',
    })
  })

  it('propaga a falha de rede para o serviço converter em failed', async () => {
    stubFetch(new TypeError('Failed to fetch'))

    await expect(
      createWeb3FormsSender('chave-de-teste')(MESSAGE),
    ).rejects.toThrow('Failed to fetch')
  })
})

describe('createWeb3FormsSender — teto de espera', () => {
  it('aborta o envio que passa do limite e propaga a rejeição', async () => {
    vi.useFakeTimers()
    const fetchSpy = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(
              new DOMException('The user aborted a request.', 'AbortError'),
            )
          })
        }),
    )
    vi.stubGlobal('fetch', fetchSpy)

    const pendente = createWeb3FormsSender('chave-de-teste')(MESSAGE)
    const rejeicao = expect(pendente).rejects.toThrow(
      'The user aborted a request.',
    )

    await vi.advanceTimersByTimeAsync(CONTACT_SEND_TIMEOUT_MS)
    await rejeicao
  })
})
