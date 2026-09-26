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

export type ContactIntake = (formData: FormData) => Promise<ContactSubmitResult>

/**
 * Intake nulo: sem site key do Turnstile ou sem `crypto.subtle` (só existe em
 * contexto seguro), o envio falha de forma visível em vez de simular sucesso
 * (D7 da spec do bloco 4.1.1-4.1.10; D1 e D6 da spec do bloco B2). Não é
 * código descartável — é o caminho real de um build publicado sem
 * `VITE_TURNSTILE_SITE_KEY`, e de `pnpm dev` aberto por endereço que não seja
 * `localhost`. É intake, não porta: sem widget não existe token, e validar
 * pelo schema devolveria "Confirme que no es un robot." para um captcha que
 * nunca apareceu na tela.
 */
export const unavailableContactIntake: ContactIntake = () =>
  Promise.resolve({ status: 'failed' })

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
    // O widget do Turnstile escreve o token num input oculto com este nome
    // dentro do formulário; o schema o vê como `captcha`.
    captcha: read('cf-turnstile-response'),
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
