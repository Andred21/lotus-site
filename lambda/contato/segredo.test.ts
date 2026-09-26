// @vitest-environment node
import { GetParameterCommand } from '@aws-sdk/client-ssm'
import { describe, expect, it, vi } from 'vitest'
import { createSsmSecretReader, type SsmClient } from './segredo'

function cliente(valor: string | undefined) {
  const send = vi.fn<SsmClient['send']>(() =>
    Promise.resolve({ $metadata: {}, Parameter: { Value: valor } }),
  )
  return {
    send,
    reader: createSsmSecretReader(
      { send },
      '/lotus-site/contato/turnstile-secret',
    ),
  }
}

describe('createSsmSecretReader', () => {
  it('pede o parâmetro pelo nome, com decriptação, e devolve o valor', async () => {
    const { send, reader } = cliente('segredo-de-teste')

    expect(await reader()).toBe('segredo-de-teste')

    const comando = send.mock.calls[0]?.[0]
    expect(comando).toBeInstanceOf(GetParameterCommand)
    expect(comando?.input).toEqual({
      Name: '/lotus-site/contato/turnstile-secret',
      WithDecryption: true,
    })
  })

  it('lê uma vez por cold start: a segunda chamada não vai ao SSM', async () => {
    const { send, reader } = cliente('segredo-de-teste')

    await reader()
    await reader()

    expect(send).toHaveBeenCalledTimes(1)
  })

  it('parâmetro sem valor lança, e a mensagem não carrega valor nenhum', async () => {
    const { reader } = cliente(undefined)

    await expect(reader()).rejects.toThrow(/turnstile-secret/)
  })

  it('falha não fica memoizada: a chamada seguinte tenta de novo', async () => {
    const send = vi.fn<SsmClient['send']>()
    send.mockRejectedValueOnce(new Error('ThrottlingException'))
    send.mockResolvedValueOnce({
      $metadata: {},
      Parameter: { Value: 'segredo' },
    })
    const reader = createSsmSecretReader({ send }, '/x')

    await expect(reader()).rejects.toThrow('ThrottlingException')
    expect(await reader()).toBe('segredo')
    expect(send).toHaveBeenCalledTimes(2)
  })
})
