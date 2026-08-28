import type { ContactMessage } from '../../lib/contact-schema'

/**
 * Resultado da tentativa de entrega. Nenhum detalhe do provedor cruza esta
 * linha: mensagem de erro, código HTTP e corpo da resposta morrem no adapter.
 */
export type ContactSendOutcome = { status: 'sent' } | { status: 'failed' }

/**
 * Porta de saída do contato. A feature depende deste tipo; o adapter do
 * provedor é detalhe substituível (aceite da 4.1.5).
 */
export type ContactSender = (
  message: ContactMessage,
) => Promise<ContactSendOutcome>

/**
 * Implementação nula: sem chave configurada, o envio falha de forma visível
 * em vez de simular sucesso (D7 da spec). Não é código descartável — é o
 * caminho real de um build publicado sem `VITE_WEB3FORMS_ACCESS_KEY`.
 */
export const unavailableContactSender: ContactSender = () =>
  Promise.resolve({ status: 'failed' })
