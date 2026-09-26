// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import {
  MAX_BODY_BYTES,
  createHandler,
  type ContactHandlerDeps,
  type FunctionUrlEvent,
} from './handler'

const MENSAGEM = {
  nombre: 'Ana Pérez',
  email: 'ANA@Lotusotec.CL',
  empresa: 'Lotus',
  mensaje: 'Necesito información sobre el curso de alta tensión.',
  captcha: 'token-de-teste',
}

function evento(
  overrides: Partial<FunctionUrlEvent> & { method?: string } = {},
): FunctionUrlEvent {
  const { method = 'POST', ...resto } = overrides
  return {
    requestContext: { requestId: 'req-1', http: { method } },
    body: JSON.stringify(MENSAGEM),
    ...resto,
  }
}

function deps() {
  return {
    verifyCaptcha: vi.fn<ContactHandlerDeps['verifyCaptcha']>(() =>
      Promise.resolve('ok'),
    ),
    sendEmail: vi.fn<ContactHandlerDeps['sendEmail']>(() => Promise.resolve()),
    log: vi.fn<ContactHandlerDeps['log']>(),
  }
}

describe('createHandler — antes do captcha', () => {
  it('recusa método diferente de POST com 405, sem tocar captcha nem SES', async () => {
    const d = deps()
    const resposta = await createHandler(d)(evento({ method: 'GET' }))

    expect(resposta.statusCode).toBe(405)
    expect(resposta.body).toBe('{"ok":false}')
    expect(resposta.headers['content-type']).toBe('application/json')
    expect(d.verifyCaptcha).not.toHaveBeenCalled()
    expect(d.sendEmail).not.toHaveBeenCalled()
    expect(d.log).toHaveBeenCalledWith({
      requestId: 'req-1',
      desfecho: 'metodo',
    })
  })

  it('recusa corpo acima de 16 KB com 413, antes de fazer parse', async () => {
    const d = deps()
    const corpo = JSON.stringify({
      ...MENSAGEM,
      mensaje: 'a'.repeat(MAX_BODY_BYTES),
    })

    const resposta = await createHandler(d)(evento({ body: corpo }))

    expect(resposta.statusCode).toBe(413)
    expect(d.verifyCaptcha).not.toHaveBeenCalled()
  })

  it('recusa JSON malformado com 400', async () => {
    const d = deps()
    const resposta = await createHandler(d)(evento({ body: '{' }))

    expect(resposta.statusCode).toBe(400)
    expect(resposta.body).toBe('{"ok":false}')
    expect(d.log).toHaveBeenCalledWith({ requestId: 'req-1', desfecho: 'json' })
  })

  it('recusa JSON que não é objeto com 400, sem lançar', async () => {
    const d = deps()
    for (const body of ['[]', '"texto"', 'null', '42']) {
      expect((await createHandler(d)(evento({ body }))).statusCode).toBe(400)
    }
  })

  it('revalida pelo mesmo schema do cliente e responde 400 sem detalhe', async () => {
    const d = deps()
    const resposta = await createHandler(d)(
      evento({
        body: JSON.stringify({ ...MENSAGEM, email: 'no-es-un-correo' }),
      }),
    )

    expect(resposta.statusCode).toBe(400)
    expect(resposta.body).toBe('{"ok":false}')
    expect(resposta.body).not.toContain('correo')
    expect(d.verifyCaptcha).not.toHaveBeenCalled()
  })

  it('honeypot preenchido também é 400', async () => {
    const d = deps()
    const resposta = await createHandler(d)(
      evento({
        body: JSON.stringify({ ...MENSAGEM, botcheck: 'http://spam.example' }),
      }),
    )

    expect(resposta.statusCode).toBe(400)
  })

  it('token ausente é 400, não 403: nunca chegou à Cloudflare', async () => {
    const d = deps()
    const resposta = await createHandler(d)(
      evento({ body: JSON.stringify({ ...MENSAGEM, captcha: '' }) }),
    )

    expect(resposta.statusCode).toBe(400)
    expect(d.verifyCaptcha).not.toHaveBeenCalled()
  })
})

describe('createHandler — captcha e envio', () => {
  it('token recusado é 403 e não envia', async () => {
    const d = deps()
    d.verifyCaptcha.mockResolvedValue('rejected')

    const resposta = await createHandler(d)(evento())

    expect(resposta.statusCode).toBe(403)
    expect(d.verifyCaptcha).toHaveBeenCalledWith('token-de-teste')
    expect(d.sendEmail).not.toHaveBeenCalled()
    expect(d.log).toHaveBeenCalledWith({
      requestId: 'req-1',
      desfecho: 'captcha-recusado',
    })
  })

  it('Cloudflare ou SSM indisponível é 502 e não envia', async () => {
    const d = deps()
    d.verifyCaptcha.mockResolvedValue('unavailable')

    expect((await createHandler(d)(evento())).statusCode).toBe(502)
    expect(d.sendEmail).not.toHaveBeenCalled()
  })

  it('verificador que lança também é 502, sem derrubar a função', async () => {
    const d = deps()
    d.verifyCaptcha.mockRejectedValue(new Error('boom'))

    expect((await createHandler(d)(evento())).statusCode).toBe(502)
  })

  it('SES que falha é 502 com ok:false, e o motivo não vaza', async () => {
    const d = deps()
    d.sendEmail.mockRejectedValue(
      new Error('AccessDenied: not authorized to perform ses:SendEmail'),
    )

    const resposta = await createHandler(d)(evento())

    expect(resposta.statusCode).toBe(502)
    expect(resposta.body).toBe('{"ok":false}')
    expect(d.log).toHaveBeenCalledWith({
      requestId: 'req-1',
      desfecho: 'ses-falhou',
    })
  })

  it('envia a mensagem normalizada e responde 200 ok:true', async () => {
    const d = deps()

    const resposta = await createHandler(d)(evento())

    expect(resposta.statusCode).toBe(200)
    expect(resposta.body).toBe('{"ok":true}')
    expect(d.sendEmail).toHaveBeenCalledWith({
      nombre: 'Ana Pérez',
      email: 'ana@lotusotec.cl',
      empresa: 'Lotus',
      mensaje: 'Necesito información sobre el curso de alta tensión.',
      captcha: 'token-de-teste',
    })
    expect(d.log).toHaveBeenCalledWith({
      requestId: 'req-1',
      desfecho: 'enviado',
    })
  })

  it('decodifica corpo em base64 quando a Function URL o marca assim', async () => {
    const d = deps()
    const resposta = await createHandler(d)(
      evento({
        body: Buffer.from(JSON.stringify(MENSAGEM), 'utf8').toString('base64'),
        isBase64Encoded: true,
      }),
    )

    expect(resposta.statusCode).toBe(200)
  })

  it('o log nunca carrega nome, e-mail, empresa nem mensagem', async () => {
    const d = deps()
    await createHandler(d)(evento())
    await createHandler(d)(evento({ method: 'GET' }))

    const tudo = JSON.stringify(d.log.mock.calls)
    expect(tudo).not.toContain('Ana')
    expect(tudo).not.toContain('lotusotec.cl')
    expect(tudo).not.toContain('Necesito')
  })
})
