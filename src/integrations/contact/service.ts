import {
  parseContactMessage,
  type ContactFormInput,
  type ContactSubmitResult,
} from '../../lib/contact-schema'
import type { ContactSender } from './sender'

export type { ContactSubmitResult }

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
