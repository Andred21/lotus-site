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
    expect(resposta.body).toBe('{"ok":false}')
    expect(d.verifyCaptcha).not.toHaveBeenCalled()
    expect(d.log).toHaveBeenCalledWith({
      requestId: 'req-1',
      desfecho: 'tamanho',
    })
  })

  it('corpo base64 cujo decodificado passa de 16 KB também é 413 (semântica é bytes decodificados)', async () => {
    const d = deps()
    const corpoDecodificado = JSON.stringify({
      ...MENSAGEM,
      mensaje: 'a'.repeat(MAX_BODY_BYTES),
    })

    const resposta = await createHandler(d)(
      evento({
        body: Buffer.from(corpoDecodificado, 'utf8').toString('base64'),
        isBase64Encoded: true,
      }),
    )

    expect(resposta.statusCode).toBe(413)
    expect(resposta.body).toBe('{"ok":false}')
    expect(d.log).toHaveBeenCalledWith({
      requestId: 'req-1',
      desfecho: 'tamanho',
    })
  })

  it('corpo base64 cujo TEXTO codificado passa de 16 KB, mas o decodificado fica abaixo, não é 413', async () => {
    const d = deps()
    // `relleno` é um campo que o schema não conhece: `readInput` (handler.ts)
    // só lê os seis nomes esperados e ignora o resto, então ele infla o
    // tamanho do corpo sem violar nenhum teto de campo. Escolhido para o
    // decodificado ficar abaixo de 16 KB e o texto em base64 (~4/3 maior)
    // ficar acima -- a prova de que o teto mede bytes decodificados, não o
    // tamanho do texto que chegou na rede.
    const jsonDecodificado = JSON.stringify({
      ...MENSAGEM,
      relleno: 'x'.repeat(15_800),
    })
    const corpo = Buffer.from(jsonDecodificado, 'utf8').toString('base64')

    expect(Buffer.byteLength(jsonDecodificado, 'utf8')).toBeLessThan(
      MAX_BODY_BYTES,
    )
    expect(corpo.length).toBeGreaterThan(MAX_BODY_BYTES)

    const resposta = await createHandler(d)(
      evento({ body: corpo, isBase64Encoded: true }),
    )

    expect(resposta.statusCode).toBe(200)
    expect(resposta.body).toBe('{"ok":true}')
  })

  it('payload válido no máximo do schema não dá 413', async () => {
    const d = deps()
    // Cada campo no teto de contact-fields.ts/contact-schema.ts. `mensaje`
    // usa `\u0001` -- caractere de controle que o schema aceita (nenhuma
    // regra o recusa) e que o JSON escapa em 6 bytes ASCII (`\`, `u`, quatro
    // hex): a forma mais longa de escrever 1 caractere, e por isso o pior
    // caso real de tamanho. `email` no teto de 254 com um local-part de 64
    // (RFC 5321) mais domínio para completar. `captcha` não tem teto no
    // schema; 2048 é o tamanho documentado do token do Turnstile, usado aqui
    // como estimativa do pior caso real (M-8 da review de 2026-09-27).
    const emailMaximo = `${'a'.repeat(64)}@${'b'.repeat(186)}.co`
    const payload = {
      nombre: 'a'.repeat(80),
      email: emailMaximo,
      empresa: 'a'.repeat(80),
      mensaje: '\u0001'.repeat(2000),
      captcha: 'a'.repeat(2048),
    }
    const corpo = JSON.stringify(payload)

    // Medido: 14525 bytes -- ver o relatório do commit E. Abaixo do teto de
    // 16 KB (16384 bytes), com folga de pouco menos de 2 KB.
    expect(Buffer.byteLength(corpo, 'utf8')).toBeLessThan(MAX_BODY_BYTES)

    const resposta = await createHandler(d)(evento({ body: corpo }))

    expect(resposta.statusCode).not.toBe(413)
    expect(resposta.statusCode).toBe(200)
    expect(resposta.body).toBe('{"ok":true}')
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
