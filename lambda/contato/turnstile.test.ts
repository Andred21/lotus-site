// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { SITEVERIFY_URL, createTurnstileVerifier } from './turnstile'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function verificador(
  resposta: Response | Error,
  readSecret = () => Promise.resolve('segredo-de-teste'),
) {
  const fetchSpy = vi.fn<typeof fetch>(() =>
    resposta instanceof Error
      ? Promise.reject(resposta)
      : Promise.resolve(resposta),
  )
  return {
    fetchSpy,
    verify: createTurnstileVerifier({ fetch: fetchSpy, readSecret }),
  }
}

describe('createTurnstileVerifier', () => {
  it('posta segredo e token no siteverify, como formulário, e aceita success:true', async () => {
    const { fetchSpy, verify } = verificador(jsonResponse({ success: true }))

    expect(await verify('token-de-teste')).toBe('ok')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(SITEVERIFY_URL)

    const init = fetchSpy.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(String(init?.body)).toBe(
      'secret=segredo-de-teste&response=token-de-teste',
    )
  })

  it('success:false é rejected', async () => {
    const { verify } = verificador(
      jsonResponse({
        success: false,
        'error-codes': ['invalid-input-response'],
      }),
    )

    expect(await verify('token-ruim')).toBe('rejected')
  })

  it('HTTP fora de 2xx, corpo inesperado e rede fora são unavailable', async () => {
    expect(await verificador(jsonResponse({}, 500)).verify('t')).toBe(
      'unavailable',
    )
    expect(await verificador(jsonResponse({ ok: true })).verify('t')).toBe(
      'unavailable',
    )
    expect(await verificador(new TypeError('fetch failed')).verify('t')).toBe(
      'unavailable',
    )
  })

  it('segredo indisponível é unavailable, e a Cloudflare nem é chamada', async () => {
    const { fetchSpy, verify } = verificador(
      jsonResponse({ success: true }),
      () => Promise.reject(new Error('ParameterNotFound')),
    )

    expect(await verify('token-de-teste')).toBe('unavailable')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
