import { z } from 'zod'
import { CONTACT_LIMITS } from './contact-fields'

/**
 * Contrato de dados do contato. A regra de validação existe uma vez, aqui:
 * só `src/integrations/contact/intake.ts` executa este schema, e nenhum
 * componente importa Zod (D3 da spec, hoje catraca de `eslint.config.js`). O
 * honeypot entra na entrada e some da saída — quem envia nunca vê o campo de
 * armadilha.
 */
export type ContactFormInput = {
  nombre: string
  email: string
  empresa: string
  mensaje: string
  botcheck: string
}

export type ContactMessage = {
  nombre: string
  email: string
  empresa: string
  mensaje: string
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
  }
}

function isFieldName(value: string): value is keyof ContactFormInput {
  return (
    value === 'nombre' ||
    value === 'email' ||
    value === 'empresa' ||
    value === 'mensaje' ||
    value === 'botcheck'
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
