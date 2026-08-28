import {
  parseContactMessage,
  type ContactFieldErrors,
  type ContactFormInput,
} from '../../lib/contact-schema'
import type { ContactSender } from './sender'

/**
 * Resultado que a UI enxerga. `failed` é genérico de propósito: o motivo da
 * falha do provedor não vira texto de tela (aceite da 4.1.9).
 */
export type ContactSubmitResult =
  | { status: 'sent' }
  | { status: 'invalid'; fieldErrors: ContactFieldErrors }
  | { status: 'failed' }

export type ContactService = (
  input: ContactFormInput,
) => Promise<ContactSubmitResult>

/**
 * Valida com o schema de `src/lib/` e delega à porta. É o único executor do
 * schema no repositório e não conhece o provedor — troca de adapter não toca
 * este arquivo (aceite da 4.1.4).
 */
export function createContactService(send: ContactSender): ContactService {
  return async (input) => {
    const parsed = parseContactMessage(input)

    if (!parsed.ok) {
      return { status: 'invalid', fieldErrors: parsed.fieldErrors }
    }

    try {
      return await send(parsed.value)
    } catch {
      return { status: 'failed' }
    }
  }
}
