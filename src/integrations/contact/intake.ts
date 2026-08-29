import {
  parseContactMessage,
  type ContactFormInput,
  type ContactMessage,
  type ContactSubmitResult,
} from '../../lib/contact-schema'

/**
 * Resultado da tentativa de entrega. Nenhum detalhe do provedor cruza esta
 * linha: mensagem de erro, código HTTP e corpo da resposta morrem no adapter.
 */
export type ContactSendOutcome = { status: 'sent' } | { status: 'failed' }

/**
 * Porta de saída do contato. O intake depende deste tipo; o adapter do
 * provedor é detalhe substituível (aceite da 4.1.5). O tipo mora aqui, junto
 * de quem o chama, e o adapter o importa deste módulo — é a direção canônica
 * de ports & adapters.
 */
export type ContactSender = (
  message: ContactMessage,
) => Promise<ContactSendOutcome>

/**
 * Implementação nula: sem chave configurada, o envio falha de forma visível
 * em vez de simular sucesso (D7 da spec do bloco 4.1.1-4.1.10). Não é código
 * descartável — é o caminho real de um build publicado sem
 * `VITE_WEB3FORMS_ACCESS_KEY`.
 */
export const unavailableContactSender: ContactSender = () =>
  Promise.resolve({ status: 'failed' })

export type ContactIntake = (formData: FormData) => Promise<ContactSubmitResult>

/**
 * Lê o payload cru do formulário. Campo ausente ou não-textual vira string
 * vazia: quem decide se isso é erro é o schema, não esta função. Privada de
 * propósito — a interface do intake é a superfície de teste, e é por ela que
 * "campo ausente vira vazio" fica provado.
 */
function readContactFormData(formData: FormData): ContactFormInput {
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
 * Entrada única de submissão do contato. É o que o SPA tem no lugar da Server
 * Action da EAP (D1 da spec do bloco 4.1.1-4.1.10): tudo passa por aqui antes
 * de qualquer rede. Lê o formulário, normaliza e valida pelo schema de
 * `src/lib/`, e só então delega à porta — não conhece o provedor (aceites da
 * 4.1.3 e da 4.1.4). É o único executor do schema no repositório.
 */
export function createContactIntake(send: ContactSender): ContactIntake {
  return async (formData) => {
    const parsed = parseContactMessage(readContactFormData(formData))

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
