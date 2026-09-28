import { SESv2Client } from '@aws-sdk/client-sesv2'
import { SSMClient } from '@aws-sdk/client-ssm'
import { createHandler } from './handler'
import { createSsmSecretReader } from './segredo'
import { createSesSender } from './ses'
import { createTurnstileVerifier } from './turnstile'

/**
 * Único módulo com efeito colateral: lê o ambiente, instancia os clientes e
 * liga as peças. Variável ausente derruba o cold start com o nome dela na
 * mensagem, que é o que se quer de um template mal preenchido.
 */
function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`variável de ambiente ${name} ausente`)
  return value
}

const ssm = new SSMClient({})
const ses = new SESv2Client({})

export const handler = createHandler({
  verifyCaptcha: createTurnstileVerifier({
    fetch,
    readSecret: createSsmSecretReader(
      { send: (command) => ssm.send(command) },
      env('TURNSTILE_SECRET_PARAMETRO'),
    ),
  }),
  sendEmail: createSesSender(
    { send: (command) => ses.send(command) },
    { from: env('CONTATO_DE'), to: env('CONTATO_PARA') },
  ),
  log: (entry) => console.log(JSON.stringify(entry)),
})
