// @vitest-environment node
import { SendEmailCommand } from '@aws-sdk/client-sesv2'
import { describe, expect, it, vi } from 'vitest'
import type { ContactMessage } from '../../src/lib/contact-schema'
import {
  ASSUNTO,
  createSesSender,
  formatContactEmail,
  type SesClient,
} from './ses'

const MENSAGEM: ContactMessage = {
  nombre: 'Ana Pérez',
  email: 'ana@lotusotec.cl',
  empresa: 'Lotus',
  mensaje: 'Necesito información sobre el curso de alta tensión.',
  captcha: 'token-de-teste',
}

const ENDERECOS = {
  from: 'Sitio Lotus OTEC <sitio@lotusotec.cl>',
  to: 'contacto@lotusotec.cl',
}

describe('formatContactEmail', () => {
  it('rotula os quatro campos em espanhol e deixa o token de fora', () => {
    const texto = formatContactEmail(MENSAGEM)

    expect(texto).toContain('Nombre: Ana Pérez')
    expect(texto).toContain('Correo: ana@lotusotec.cl')
    expect(texto).toContain('Empresa: Lotus')
    expect(texto).toContain(
      'Necesito información sobre el curso de alta tensión.',
    )
    expect(texto).not.toContain('token-de-teste')
  })

  it('diz quando a empresa não foi informada', () => {
    expect(formatContactEmail({ ...MENSAGEM, empresa: '' })).toContain(
      'Empresa: (no indicada)',
    )
  })
})

describe('createSesSender', () => {
  it('manda SendEmail simples, do remitente ao destinatario, com Reply-To do visitante', async () => {
    const send = vi.fn<SesClient['send']>(() =>
      Promise.resolve({ $metadata: {}, MessageId: 'id-1' }),
    )

    await createSesSender({ send }, ENDERECOS)(MENSAGEM)

    const comando = send.mock.calls[0]?.[0]
    expect(comando).toBeInstanceOf(SendEmailCommand)
    expect(comando?.input).toEqual({
      FromEmailAddress: 'Sitio Lotus OTEC <sitio@lotusotec.cl>',
      Destination: { ToAddresses: ['contacto@lotusotec.cl'] },
      ReplyToAddresses: ['ana@lotusotec.cl'],
      Content: {
        Simple: {
          Subject: { Data: ASSUNTO, Charset: 'UTF-8' },
          Body: {
            Text: { Data: formatContactEmail(MENSAGEM), Charset: 'UTF-8' },
          },
        },
      },
    })
  })

  it('propaga a falha do SES para o handler converter em 502', async () => {
    const send = vi.fn<SesClient['send']>(() =>
      Promise.reject(new Error('Throttling')),
    )

    await expect(
      createSesSender({ send }, ENDERECOS)(MENSAGEM),
    ).rejects.toThrow('Throttling')
  })
})
