import { z } from 'zod'
import type { ContactMessage } from '../../lib/contact-schema'
import type { ContactSender } from './intake'

/** Caminho do próprio site, servido pelo CloudFront à função (spec D10). */
export const CONTACT_ENDPOINT = '/api/contacto'

/** Teto de espera de uma tentativa de envio. */
export const CONTACT_SEND_TIMEOUT_MS = 10_000

/** A função responde `{ok}` e nada mais (spec §4). */
const responseSchema = z.object({ ok: z.boolean() })

/** SHA-256 em hexadecimal minúsculo, como o cabeçalho `x-amz-content-sha256` exige. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Adapter de `/api/contacto`: o único `fetch` do repositório (ADR-SITE-005).
 * Serializa o corpo uma vez e manda o hash desse texto exato: o OAC do
 * CloudFront assina a requisição à Function URL e a Lambda recusa payload
 * sem `x-amz-content-sha256` (spec D1). Mensagem de erro da função morre
 * aqui: quem chama recebe `sent` ou `failed`, nada mais.
 */
export function createApiContactoSender(): ContactSender {
  return async (message: ContactMessage) => {
    const body = JSON.stringify(message)
    const hash = await sha256Hex(body)

    // Sem teto de espera, função pendurada deixa a UI em `submitting` para
    // sempre. `AbortController` explícito em vez de `AbortSignal.timeout`
    // porque o timer precisa ser observável no teste. Abortar rejeita o
    // `fetch`, e o intake já converte rejeição em `failed`.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), CONTACT_SEND_TIMEOUT_MS)

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-amz-content-sha256': hash,
        },
        body,
      })

      if (!response.ok) return { status: 'failed' }

      const parsed = responseSchema.safeParse(await response.json())
      return parsed.success && parsed.data.ok
        ? { status: 'sent' }
        : { status: 'failed' }
    } finally {
      clearTimeout(timer)
    }
  }
}
