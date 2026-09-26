import { z } from 'zod'
import { CONTACT_LIMITS } from './contact-fields'

/**
 * Contrato de dados do contato. A regra de validação existe uma vez, aqui, e
 * tem dois executores: `src/integrations/contact/intake.ts` no navegador e
 * `lambda/contato/handler.ts` na função (spec D8 do bloco B2) — cliente e
 * servidor recusam exatamente a mesma coisa. Nenhum componente importa Zod
 * (catraca de `eslint.config.js`). O honeypot entra na entrada e some da
 * saída; o token do captcha entra e fica, porque é a função quem o consome.
 */
export type ContactFormInput = {
  nombre: string
  email: string
  empresa: string
  mensaje: string
  botcheck: string
  captcha: string
}

export type ContactMessage = {
  nombre: string
  email: string
  empresa: string
  mensaje: string
  captcha: string
}

export type ContactFieldErrors = Partial<Record<keyof ContactFormInput, string>>

export type ContactParseResult =
  | { ok: true; value: ContactMessage }
  | { ok: false; fieldErrors: ContactFieldErrors }

/**
 * Resultado que a UI enxerga. `failed` é genérico de propósito: o motivo da
 * falha do provedor não vira texto de tela (aceite da 4.1.9). Vive aqui, e
 * não em `src/integrations/`, porque componente e integração precisam do
 * mesmo contrato e `eslint.config.js` proíbe o componente de importar
 * integração — inclusive tipo. `ContactFieldErrors`, o payload do caso
 * `invalid`, já morava neste módulo.
 */
export type ContactSubmitResult =
  | { status: 'sent' }
  | { status: 'invalid'; fieldErrors: ContactFieldErrors }
  | { status: 'failed' }

/** Mensagens em es-CL, o idioma publicado do site. */
const MESSAGES = {
  nombreCorto: 'Ingrese su nombre completo.',
  nombreLargo: `El nombre no puede superar los ${CONTACT_LIMITS.nombre.max} caracteres.`,
  emailInvalido: 'Ingrese un correo electrónico válido.',
  emailLargo: `El correo no puede superar los ${CONTACT_LIMITS.email.max} caracteres.`,
  empresaLarga: `La empresa no puede superar los ${CONTACT_LIMITS.empresa.max} caracteres.`,
  mensajeCorto: `Escriba su mensaje con al menos ${CONTACT_LIMITS.mensaje.min} caracteres.`,
  mensajeLargo: `El mensaje no puede superar los ${CONTACT_LIMITS.mensaje.max} caracteres.`,
  honeypot: 'No pudimos validar el envío.',
  captcha: 'Confirme que no es un robot.',
} as const

const contactSchema = z.object({
  nombre: z
    .string()
    .min(CONTACT_LIMITS.nombre.min, MESSAGES.nombreCorto)
    .max(CONTACT_LIMITS.nombre.max, MESSAGES.nombreLargo),
  email: z
    .email(MESSAGES.emailInvalido)
    .max(CONTACT_LIMITS.email.max, MESSAGES.emailLargo),
  empresa: z.string().max(CONTACT_LIMITS.empresa.max, MESSAGES.empresaLarga),
  mensaje: z
    .string()
    .min(CONTACT_LIMITS.mensaje.min, MESSAGES.mensajeCorto)
    .max(CONTACT_LIMITS.mensaje.max, MESSAGES.mensajeLargo),
  botcheck: z.literal('', MESSAGES.honeypot),
  // Token do Turnstile. Só presença é checada aqui: quem diz se ele vale é
  // o siteverify da Cloudflare, na função.
  captcha: z.string().min(1, MESSAGES.captcha),
})

/** Normaliza antes de validar: o limite vale sobre o valor já aparado. */
export function normalizeContactInput(
  input: ContactFormInput,
): ContactFormInput {
  return {
    nombre: input.nombre.trim(),
    email: input.email.trim().toLowerCase(),
    empresa: input.empresa.trim(),
    mensaje: input.mensaje.trim(),
    botcheck: input.botcheck.trim(),
    captcha: input.captcha.trim(),
  }
}

function isFieldName(value: string): value is keyof ContactFormInput {
  return (
    value === 'nombre' ||
    value === 'email' ||
    value === 'empresa' ||
    value === 'mensaje' ||
    value === 'botcheck' ||
    value === 'captcha'
  )
}

export function parseContactMessage(
  input: ContactFormInput,
): ContactParseResult {
  const normalized = normalizeContactInput(input)
  const parsed = contactSchema.safeParse(normalized)

  if (parsed.success) {
    return {
      ok: true,
      value: {
        nombre: parsed.data.nombre,
        email: parsed.data.email,
        empresa: parsed.data.empresa,
        mensaje: parsed.data.mensaje,
        captcha: parsed.data.captcha,
      },
    }
  }

  const fieldErrors: ContactFieldErrors = {}
  for (const issue of parsed.error.issues) {
    const field = issue.path[0]
    if (typeof field !== 'string' || !isFieldName(field)) continue
    fieldErrors[field] ??= issue.message
  }

  return { ok: false, fieldErrors }
}
