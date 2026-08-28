import { z } from 'zod'
import type { ContactMessage } from '../../lib/contact-schema'
import type { ContactSender } from './sender'

const ENDPOINT = 'https://api.web3forms.com/submit'

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
    const response = await fetch(ENDPOINT, {
      method: 'POST',
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
  }
}
