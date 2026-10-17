import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONTACT_HONEYPOT_FIELD } from '../../lib/contact-fields'
import {
  createContactIntake,
  unavailableContactIntake,
  type ContactSender,
} from './intake'

const VALID = {
  nombre: '  Ana Pérez  ',
  email: 'ANA@Lotusotec.CL',
  empresa: 'Lotus',
  mensaje: 'Necesito información sobre el curso de alta tensión.',
  [CONTACT_HONEYPOT_FIELD]: '',
  'cf-turnstile-response': 'token-de-teste',
}

function formDataOf(entries: Record<string, string>) {
  const formData = new FormData()
  for (const [name, value] of Object.entries(entries)) {
    formData.append(name, value)
  }
  return formData
}

function fakeSender() {
  return vi.fn<ContactSender>(() => Promise.resolve({ status: 'sent' }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createContactIntake', () => {
  it('entrega à porta a mensagem já normalizada, sem o honeypot', async () => {
    const send = fakeSender()
    const intake = createContactIntake(send)

    const result = await intake(formDataOf(VALID))

    expect(result).toEqual({ status: 'sent' })
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0]?.[0]).toEqual({
      nombre: 'Ana Pérez',
      email: 'ana@lotusotec.cl',
      empresa: 'Lotus',
      mensaje: 'Necesito información sobre el curso de alta tensión.',
      captcha: 'token-de-teste',
    })
  })

  it('devolve invalid com erro por campo e não chama a porta', async () => {
    const send = fakeSender()
    const intake = createContactIntake(send)

    const result = await intake(
      formDataOf({ ...VALID, email: 'no-es-un-correo' }),
    )

    if (result.status !== 'invalid') throw new Error('esperava invalid')
    expect(result.fieldErrors.email).toBe(
      'Ingrese un correo electrónico válido.',
    )
    expect(send).not.toHaveBeenCalled()
  })

  it('repassa a falha da porta como failed genérico', async () => {
    const send = vi.fn<ContactSender>(() =>
      Promise.resolve({ status: 'failed' }),
    )

    expect(await createContactIntake(send)(formDataOf(VALID))).toEqual({
      status: 'failed',
    })
  })

  it('converte exceção da porta em failed, sem vazar o erro', async () => {
    const send = vi.fn<ContactSender>(() =>
      Promise.reject(new Error('api/contacto: 502 Bad Gateway')),
    )

    expect(await createContactIntake(send)(formDataOf(VALID))).toEqual({
      status: 'failed',
    })
  })

  it('armadilha preenchida é failed antes da rede: a porta não é chamada', async () => {
    const send = fakeSender()
    const result = await createContactIntake(send)(
      formDataOf({ ...VALID, [CONTACT_HONEYPOT_FIELD]: 'http://spam.example' }),
    )
    expect(result).toEqual({ status: 'failed' })
    expect(send).not.toHaveBeenCalled()
  })

  it('armadilha preenchida vence campo inválido: failed, não invalid', async () => {
    const send = fakeSender()
    const result = await createContactIntake(send)(
      formDataOf({ ...VALID, nombre: 'A', [CONTACT_HONEYPOT_FIELD]: 'x' }),
    )
    expect(result).toEqual({ status: 'failed' })
  })

  it('armadilha só com espaço conta como vazia', async () => {
    const send = fakeSender()
    await createContactIntake(send)(
      formDataOf({ ...VALID, [CONTACT_HONEYPOT_FIELD]: '   ' }),
    )
    expect(send).toHaveBeenCalledOnce()
  })

  it('rejeita payload excessivo antes da rede: a porta não é chamada', async () => {
    const send = fakeSender()
    const intake = createContactIntake(send)

    const result = await intake(
      formDataOf({ ...VALID, mensaje: 'a'.repeat(2001) }),
    )

    expect(result.status).toBe('invalid')
    expect(send).not.toHaveBeenCalled()
  })

  it('não cobra nada do envio normal: um payload válido chama a porta uma vez', async () => {
    const send = fakeSender()

    await createContactIntake(send)(formDataOf(VALID))

    expect(send).toHaveBeenCalledTimes(1)
  })

  it('trata formulário vazio como campo vazio e reprova no schema, sem tocar a porta', async () => {
    const send = fakeSender()
    const intake = createContactIntake(send)

    const result = await intake(new FormData())

    if (result.status !== 'invalid') throw new Error('esperava invalid')
    expect(result.fieldErrors.nombre).toBe('Ingrese su nombre completo.')
    expect(result.fieldErrors.email).toBe(
      'Ingrese un correo electrónico válido.',
    )
    expect(send).not.toHaveBeenCalled()
  })

  it('ignora valor que não é texto: campo vira vazio e reprova no schema', async () => {
    const send = fakeSender()
    const formData = formDataOf(VALID)
    formData.set('nombre', new File(['x'], 'ataque.txt'))

    const result = await createContactIntake(send)(formData)

    if (result.status !== 'invalid') throw new Error('esperava invalid')
    expect(result.fieldErrors.nombre).toBe('Ingrese su nombre completo.')
    expect(send).not.toHaveBeenCalled()
  })

  it('lê o token do campo que o widget preenche, e sem ele não chama a porta', async () => {
    const send = fakeSender()
    const intake = createContactIntake(send)

    const semToken = formDataOf({ ...VALID, 'cf-turnstile-response': '' })
    const result = await intake(semToken)

    if (result.status !== 'invalid') throw new Error('esperava invalid')
    expect(result.fieldErrors.captcha).toBe('Confirme que no es un robot.')
    expect(send).not.toHaveBeenCalled()
  })
})

describe('unavailableContactIntake', () => {
  it('falha sem validar e sem tocar a rede quando não há captcha', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const semToken = formDataOf({ ...VALID })
    semToken.delete('cf-turnstile-response')

    expect(await unavailableContactIntake(semToken)).toEqual({
      status: 'failed',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
