// @vitest-environment node
import { createHash } from 'node:crypto'
import { afterEach, expect, it, vi } from 'vitest'
import { createApiContactoSender } from '../../src/integrations/contact/api-contacto'
import type { ContactMessage } from '../../src/lib/contact-schema'
import { createHandler, type ContactHandlerDeps } from './handler'

const MENSAGEM: ContactMessage = {
  nombre: 'Ana Pérez',
  email: 'ana@lotusotec.cl',
  empresa: 'Lotus',
  mensaje: 'Necesito información sobre el curso de alta tensión.',
  captcha: 'token-de-teste',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

function ligarAoHandler(handler: ReturnType<typeof createHandler>) {
  const fetchFalso = vi.fn<typeof fetch>(async (_url, init) => {
    const body = String(init?.body)
    const resultado = await handler({
      requestContext: {
        requestId: 'contrato',
        http: { method: init?.method ?? 'GET' },
      },
      body,
    })
    return new Response(resultado.body, {
      status: resultado.statusCode,
      headers: resultado.headers,
    })
  })
  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

it('o corpo do adapter passa no handler, chega ao e-mail e volta como sent', async () => {
  const sendEmail = vi.fn<ContactHandlerDeps['sendEmail']>(() =>
    Promise.resolve(),
  )
  const fetchFalso = ligarAoHandler(
    createHandler({
      verifyCaptcha: () => Promise.resolve('ok'),
      sendEmail,
      log: () => {},
    }),
  )
  expect(await createApiContactoSender()(MENSAGEM)).toEqual({ status: 'sent' })
  expect(sendEmail).toHaveBeenCalledWith(MENSAGEM)
  const init = fetchFalso.mock.calls[0]?.[1]
  expect(new Headers(init?.headers).get('x-amz-content-sha256')).toBe(
    createHash('sha256').update(String(init?.body)).digest('hex'),
  )
})

it('a recusa da função volta ao adapter como failed', async () => {
  const sendEmail = vi.fn<ContactHandlerDeps['sendEmail']>(() =>
    Promise.resolve(),
  )
  ligarAoHandler(
    createHandler({
      verifyCaptcha: () => Promise.resolve('rejected'),
      sendEmail,
      log: () => {},
    }),
  )
  expect(await createApiContactoSender()(MENSAGEM)).toEqual({
    status: 'failed',
  })
  expect(sendEmail).not.toHaveBeenCalled()
})
