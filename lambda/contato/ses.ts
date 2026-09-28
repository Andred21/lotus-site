import {
  SendEmailCommand,
  type SendEmailCommandOutput,
} from '@aws-sdk/client-sesv2'
import type { ContactMessage } from '../../src/lib/contact-schema'
import type { EmailSender } from './handler'

export const ASSUNTO = 'Nuevo mensaje desde el sitio de Lotus OTEC'

/** Só o que o remetente usa do `SESv2Client`; método para aceitar o cliente real. */
export type SesClient = {
  send(command: SendEmailCommand): Promise<SendEmailCommandOutput>
}

export type Enderecos = { from: string; to: string }

/** Texto puro, quatro campos rotulados em espanhol (spec §4). O token não entra. */
export function formatContactEmail(message: ContactMessage): string {
  return [
    `Nombre: ${message.nombre}`,
    `Correo: ${message.email}`,
    `Empresa: ${message.empresa || '(no indicada)'}`,
    '',
    'Mensaje:',
    message.mensaje,
    '',
    'Enviado desde el formulario de contacto de lotusotec.cl.',
  ].join('\n')
}

/**
 * `Reply-To` é o e-mail do visitante, para que responder no Gmail chegue nele
 * (spec D9). Remetente e destinatário chegam por variável de ambiente, do
 * template; não vivem no código.
 */
export function createSesSender(
  client: SesClient,
  enderecos: Enderecos,
): EmailSender {
  return async (message) => {
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: enderecos.from,
        Destination: { ToAddresses: [enderecos.to] },
        ReplyToAddresses: [message.email],
        Content: {
          Simple: {
            Subject: { Data: ASSUNTO, Charset: 'UTF-8' },
            Body: {
              Text: { Data: formatContactEmail(message), Charset: 'UTF-8' },
            },
          },
        },
      }),
    )
  }
}
