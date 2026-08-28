import type { ContactFormInput } from '../../lib/contact-schema'
import type { ContactService, ContactSubmitResult } from './service'

export type ContactFormSubmit = (
  formData: FormData,
) => Promise<ContactSubmitResult>

/**
 * Lê o payload cru do formulário. Campo ausente ou não-textual vira string
 * vazia: quem decide se isso é erro é o schema, não esta função.
 */
export function readContactFormData(formData: FormData): ContactFormInput {
  const read = (name: string): string => {
    const value = formData.get(name)
    return typeof value === 'string' ? value : ''
  }

  return {
    nombre: read('nombre'),
    email: read('email'),
    empresa: read('empresa'),
    mensaje: read('mensaje'),
    botcheck: read('botcheck'),
  }
}

/**
 * Entrada única de submissão. É o que o SPA tem no lugar da Server Action da
 * EAP (D1 da spec): tudo passa por aqui antes de qualquer rede, e este módulo
 * não conhece o provedor (aceite da 4.1.3).
 */
export function createContactFormSubmit(
  service: ContactService,
): ContactFormSubmit {
  return (formData) => service(readContactFormData(formData))
}
