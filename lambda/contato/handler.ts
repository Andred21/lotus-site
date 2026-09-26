import { z } from 'zod'
import {
  parseContactMessage,
  type ContactFormInput,
  type ContactMessage,
} from '../../src/lib/contact-schema'

/**
 * O que o handler lê do evento da Function URL (payload 2.0). Tipo local de
 * propósito: `@types/aws-lambda` seria dependência para quatro campos.
 */
export type FunctionUrlEvent = {
  requestContext: { requestId: string; http: { method: string } }
  body?: string
  isBase64Encoded?: boolean
}

export type FunctionUrlResult = {
  statusCode: number
  headers: { 'content-type': 'application/json' }
  body: string
}

/**
 * Veredito do captcha. `unavailable` é a Cloudflare ou o SSM fora do ar, não
 * o visitante: vira 502, não 403.
 */
export type CaptchaVerdict = 'ok' | 'rejected' | 'unavailable'
export type CaptchaVerifier = (token: string) => Promise<CaptchaVerdict>

/** Envia ou lança. O motivo morre aqui: o corpo da resposta nunca o carrega. */
export type EmailSender = (message: ContactMessage) => Promise<void>

export type Desfecho =
  | 'metodo'
  | 'tamanho'
  | 'json'
  | 'schema'
  | 'captcha-recusado'
  | 'captcha-indisponivel'
  | 'ses-falhou'
  | 'enviado'

export type ContactHandlerDeps = {
  verifyCaptcha: CaptchaVerifier
  sendEmail: EmailSender
  /** Recebe só request id e desfecho: os campos do visitante ficam fora do log. */
  log: (entry: { requestId: string; desfecho: Desfecho }) => void
}

/** Teto do corpo (spec §4). O maior payload válido tem pouco mais de 2 KB. */
export const MAX_BODY_BYTES = 16 * 1024

const STATUS: Record<Desfecho, number> = {
  metodo: 405,
  tamanho: 413,
  json: 400,
  schema: 400,
  'captcha-recusado': 403,
  'captcha-indisponivel': 502,
  'ses-falhou': 502,
  enviado: 200,
}

/** Objeto solto: qualquer chave, qualquer valor. Array, null e escalar reprovam. */
const objetoSolto = z.record(z.string(), z.unknown())

function readBody(event: FunctionUrlEvent): Buffer {
  return Buffer.from(
    event.body ?? '',
    event.isBase64Encoded ? 'base64' : 'utf8',
  )
}

/**
 * Campo ausente ou não-textual vira string vazia, como em
 * `readContactFormData` do intake: quem decide se isso é erro é o schema.
 * `botcheck` normalmente não viaja no JSON — o honeypot é do formulário — e
 * nasce vazio para o schema não o reprovar por ausência.
 */
function readInput(json: unknown): ContactFormInput {
  const parsed = objetoSolto.safeParse(json)
  const objeto = parsed.success ? parsed.data : {}
  const read = (name: string): string => {
    const value = objeto[name]
    return typeof value === 'string' ? value : ''
  }

  return {
    nombre: read('nombre'),
    email: read('email'),
    empresa: read('empresa'),
    mensaje: read('mensaje'),
    botcheck: read('botcheck'),
    captcha: read('captcha'),
  }
}

/**
 * Ordem fixa: método, tamanho, JSON, schema, captcha, envio. Cada degrau só
 * gasta o que o anterior autorizou — o siteverify da Cloudflare, por
 * exemplo, só é chamado com um payload que já passou pelo schema.
 */
export function createHandler(deps: ContactHandlerDeps) {
  const respond = (
    requestId: string,
    desfecho: Desfecho,
  ): FunctionUrlResult => {
    deps.log({ requestId, desfecho })
    return {
      statusCode: STATUS[desfecho],
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: desfecho === 'enviado' }),
    }
  }

  return async (event: FunctionUrlEvent): Promise<FunctionUrlResult> => {
    const { requestId } = event.requestContext
    if (event.requestContext.http.method !== 'POST') {
      return respond(requestId, 'metodo')
    }

    const body = readBody(event)
    if (body.byteLength > MAX_BODY_BYTES) return respond(requestId, 'tamanho')

    let json: unknown
    try {
      json = JSON.parse(body.toString('utf8'))
    } catch {
      return respond(requestId, 'json')
    }

    const parsed = parseContactMessage(readInput(json))
    if (!parsed.ok) return respond(requestId, 'schema')

    let verdict: CaptchaVerdict
    try {
      verdict = await deps.verifyCaptcha(parsed.value.captcha)
    } catch {
      verdict = 'unavailable'
    }
    if (verdict === 'rejected') return respond(requestId, 'captcha-recusado')
    if (verdict === 'unavailable') {
      return respond(requestId, 'captcha-indisponivel')
    }

    try {
      await deps.sendEmail(parsed.value)
    } catch {
      return respond(requestId, 'ses-falhou')
    }
    return respond(requestId, 'enviado')
  }
}
