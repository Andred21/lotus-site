import {
  GetParameterCommand,
  type GetParameterCommandOutput,
} from '@aws-sdk/client-ssm'
import type { SecretReader } from './turnstile'

/**
 * Só o que o leitor usa do `SSMClient`. Método, e não propriedade de função,
 * para a assinatura genérica do cliente real ser aceita por bivariância.
 */
export type SsmClient = {
  send(command: GetParameterCommand): Promise<GetParameterCommandOutput>
}

/**
 * Lê o SecureString uma vez por cold start e guarda em memória (spec D7). A
 * chave gerenciada `aws/ssm` cobre o `kms:Decrypt` pela própria key policy;
 * a role só precisa de `ssm:GetParameter` neste ARN. Falha não fica
 * memoizada: a requisição seguinte tenta de novo.
 */
export function createSsmSecretReader(
  client: SsmClient,
  parameterName: string,
): SecretReader {
  let cached: Promise<string> | undefined

  return () => {
    cached ??= client
      .send(
        new GetParameterCommand({ Name: parameterName, WithDecryption: true }),
      )
      .then((output) => {
        const value = output.Parameter?.Value
        if (!value) throw new Error(`parâmetro ${parameterName} sem valor`)
        return value
      })
      .catch((error: unknown) => {
        cached = undefined
        throw error
      })
    return cached
  }
}
