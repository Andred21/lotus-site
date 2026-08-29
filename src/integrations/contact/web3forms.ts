import { z } from 'zod'
import type { ContactMessage } from '../../lib/contact-schema'
import type { ContactSender } from './intake'

const ENDPOINT = 'https://api.web3forms.com/submit'

/** Teto de espera de uma tentativa de envio. */
export const CONTACT_SEND_TIMEOUT_MS = 10_000

/** O provedor responde JSON com `success`; o resto do corpo não interessa. */
const responseSchema = z.object({ success: z.boolean() })

/**
 * Adapter do Web3Forms: o único `fetch` do repositório (ADR-SITE-002). A
 * `accessKey` é configuração pública, não segredo — entra no bundle por
 * definição do Vite (D8 da spec). Mensagem de erro do provedor morre aqui:
 * quem chama recebe `sent` ou `failed`, nada mais.
 */
export function createWeb3FormsSender(accessKey: string): ContactSender {
  return async (message: ContactMessage) => {
    // Sem teto de espera, provedor pendurado deixa a UI em `submitting` para
    // sempre: botão desabilitado e nenhuma saída além de recarregar a página.
    // `AbortController` explícito em vez de `AbortSignal.timeout` porque o
    // timer precisa ser observável no teste. Abortar rejeita o `fetch`, e o
    // serviço já converte rejeição em `failed`.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), CONTACT_SEND_TIMEOUT_MS)

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: 'Nuevo mensaje desde el sitio de Lotus OTEC',
          from_name: 'Lotus OTEC',
          name: message.nombre,
          email: message.email,
          company: message.empresa,
          message: message.mensaje,
        }),
      })

      if (!response.ok) return { status: 'failed' }

      const parsed = responseSchema.safeParse(await response.json())
      return parsed.success && parsed.data.success
        ? { status: 'sent' }
        : { status: 'failed' }
    } finally {
      clearTimeout(timer)
    }
  }
}
