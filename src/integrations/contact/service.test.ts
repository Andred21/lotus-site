import { describe, expect, it, vi } from 'vitest'
import type { ContactFormInput } from '../../lib/contact-schema'
import type { ContactSender } from './sender'
import { createContactService } from './service'

const VALID: ContactFormInput = {
  nombre: '  Ana Pérez  ',
  email: 'ANA@Lotusotec.CL',
  empresa: 'Lotus',
  mensaje: 'Necesito información sobre el curso de alta tensión.',
  botcheck: '',
}

function fakeSender() {
  return vi.fn<ContactSender>(() => Promise.resolve({ status: 'sent' }))
}

describe('createContactService', () => {
  it('entrega à porta a mensagem já normalizada, sem o honeypot', async () => {
    const send = fakeSender()
    const service = createContactService(send)

    const result = await service(VALID)

    expect(result).toEqual({ status: 'sent' })
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0]?.[0]).toEqual({
      nombre: 'Ana Pérez',
      email: 'ana@lotusotec.cl',
      empresa: 'Lotus',
      mensaje: 'Necesito información sobre el curso de alta tensión.',
    })
  })

  it('devolve invalid com erro por campo e não chama a porta', async () => {
    const send = fakeSender()
    const service = createContactService(send)

    const result = await service({ ...VALID, email: 'no-es-un-correo' })

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
    const service = createContactService(send)

    expect(await service(VALID)).toEqual({ status: 'failed' })
  })

  it('converte exceção da porta em failed, sem vazar o erro', async () => {
    const send = vi.fn<ContactSender>(() =>
      Promise.reject(new Error('web3forms: 503 Service Unavailable')),
    )
    const service = createContactService(send)

    expect(await service(VALID)).toEqual({ status: 'failed' })
  })
})
