import { z } from 'zod'
import type { CaptchaVerifier } from './handler'

export const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** A Cloudflare responde mais campos; só `success` decide. */
const vereditoSchema = z.object({ success: z.boolean() })

export type SecretReader = () => Promise<string>

/**
 * Verifica o token no siteverify (spec D6). `fetch` e o leitor do segredo são
 * injetados para o teste rodar sem rede e sem SSM. Toda falha que não seja
 * "a Cloudflare disse não" vira `unavailable`: o handler responde 502, e o
 * formulário mostra a falha com contacto@ como saída.
 */
export function createTurnstileVerifier(deps: {
  fetch: typeof fetch
  readSecret: SecretReader
}): CaptchaVerifier {
  return async (token) => {
    let secret: string
    try {
      secret = await deps.readSecret()
    } catch {
      return 'unavailable'
    }

    try {
      const response = await deps.fetch(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }),
      })
      if (!response.ok) return 'unavailable'

      const parsed = vereditoSchema.safeParse(await response.json())
      if (!parsed.success) return 'unavailable'
      return parsed.data.success ? 'ok' : 'rejected'
    } catch {
      return 'unavailable'
    }
  }
}
