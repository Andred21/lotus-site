import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  ARN_DA_FUNCAO,
  conferirDistribuicao,
  evento,
  executarFuncao,
  lerDistribuicao,
  lerFuncao,
  lerPadraoDoParametro,
  nomesDoCertificado,
} from './lib/distribuicao.mjs'

// Fixture com a forma dos dois recursos; os testes de leitura usam ela. A
// catraca de verdade roda sobre os templates reais, mutados com `.replace()`
// para provar que reprova com o nome do campo (spec §4.2).
const MODELO = `
Parameters:
  ArnDoCertificadoDoDominio:
    Type: String
    AllowedPattern: '^arn:aws:acm:us-east-1:[0-9]{12}:certificate/[0-9a-f-]+$'

Resources:
  RedirecionarWww:
    Type: AWS::CloudFront::Function
    Properties:
      Name: teste-redirecionar-www
      AutoPublish: true
      FunctionConfig:
        Comment: fixture
        Runtime: cloudfront-js-2.0
      FunctionCode: |
        function handler(event) {
          return { statusCode: 301, headers: { location: { value: 'x' } } };
        }

  Distribuicao:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        # comentario no meio
        Aliases:
          - lotusotec.cl
          - www.lotusotec.cl
        ViewerCertificate:
          AcmCertificateArn: !Ref ArnDoCertificadoDoDominio
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
        DefaultCacheBehavior:
          TargetOriginId: balde
          AllowedMethods: [GET, HEAD]
          FunctionAssociations:
            - EventType: viewer-request
              FunctionARN: !GetAtt RedirecionarWww.FunctionMetadata.FunctionARN
        CacheBehaviors:
          - PathPattern: /api/*
            TargetOriginId: funcao-de-contato
            ViewerProtocolPolicy: https-only
      Tags:
        - Key: Projeto
          Value: lotus-site
`

const MODELO_DNS = `
Parameters:
  NomeDaZona:
    Default: exemplo.cl
Resources:
  Certificado:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref NomeDaZona
      SubjectAlternativeNames:
        - !Sub 'www.\${NomeDaZona}'
      ValidationMethod: DNS
      DomainValidationOptions:
        - DomainName: !Ref NomeDaZona
          HostedZoneId: !Ref Zona
Outputs:
`

describe('leitura da Distribuicao', () => {
  const lida = lerDistribuicao(MODELO)

  it('lê aliases, certificado e funções por behavior', () => {
    expect(lida.aliases).toEqual(['lotusotec.cl', 'www.lotusotec.cl'])
    expect(lida.certificado).toEqual({
      AcmCertificateArn: '!Ref ArnDoCertificadoDoDominio',
      SslSupportMethod: 'sni-only',
      MinimumProtocolVersion: 'TLSv1.2_2021',
    })
    expect(lida.funcoesPadrao).toEqual([
      { evento: 'viewer-request', arn: ARN_DA_FUNCAO },
    ])
    expect(lida.comportamentos).toEqual([{ caminho: '/api/*', funcoes: [] }])
  })

  it('vê função associada a um CacheBehavior', () => {
    const comFuncao = MODELO.replace(
      '            ViewerProtocolPolicy: https-only\n',
      '            ViewerProtocolPolicy: https-only\n            FunctionAssociations:\n              - EventType: viewer-request\n                FunctionARN: !GetAtt RedirecionarWww.FunctionMetadata.FunctionARN\n',
    )
    expect(lerDistribuicao(comFuncao).comportamentos[0]?.funcoes).toHaveLength(
      1,
    )
  })

  it('item de FunctionAssociations com campo desconhecido quebra com o nome', () => {
    expect(() =>
      lerDistribuicao(MODELO.replace('FunctionARN:', 'FunctionArn:')),
    ).toThrow('FunctionAssociations com campo desconhecido: FunctionArn')
  })

  it('template sem Distribuicao quebra', () => {
    expect(() => lerDistribuicao('Resources: {}')).toThrow(
      'template sem o recurso Distribuicao',
    )
  })
})

describe('leitura da função', () => {
  it('lê Type, AutoPublish, Runtime e o bloco de código', () => {
    const funcao = lerFuncao(MODELO, 'RedirecionarWww')
    expect(funcao.tipo).toBe('AWS::CloudFront::Function')
    expect(funcao.autoPublish).toBe(true)
    expect(funcao.runtime).toBe('cloudfront-js-2.0')
    expect(funcao.codigo).toContain('function handler(event)')
    expect(executarFuncao(funcao.codigo, evento('x', '/')).statusCode).toBe(301)
  })

  it('função sem FunctionCode quebra com o nome do campo', () => {
    const sem = MODELO.replace(/      FunctionCode: \|[\s\S]*?\n\n/, '\n')
    expect(() => lerFuncao(sem, 'RedirecionarWww')).toThrow(
      'RedirecionarWww sem FunctionCode',
    )
  })

  it('AutoPublish ausente quebra com o nome do campo', () => {
    expect(() =>
      lerFuncao(
        MODELO.replace('      AutoPublish: true\n', ''),
        'RedirecionarWww',
      ),
    ).toThrow('RedirecionarWww sem AutoPublish')
  })
})

describe('nomes do certificado e AllowedPattern', () => {
  it('lê DomainName + SANs resolvidos', () => {
    expect(nomesDoCertificado(MODELO_DNS)).toEqual([
      'exemplo.cl',
      'www.exemplo.cl',
    ])
  })

  it('lê o AllowedPattern do parâmetro e reprova parâmetro ausente', () => {
    expect(lerPadraoDoParametro(MODELO, 'ArnDoCertificadoDoDominio')).toMatch(
      /^\^arn:aws:acm:us-east-1:/,
    )
    expect(() => lerPadraoDoParametro(MODELO, 'NaoExiste')).toThrow('NaoExiste')
  })
})

const SITE = readFileSync('infra/lotus-site.yaml', 'utf8')
const DNS = readFileSync('infra/lotus-dns.yaml', 'utf8')

describe('catraca: infra/lotus-site.yaml ≡ spec §4.2', () => {
  it('passa no template real', () => {
    expect(conferirDistribuicao(SITE, DNS)).toEqual([])
  })

  it('aliases fora dos nomes do certificado reprovam com o campo', () => {
    const problemas = conferirDistribuicao(
      SITE.replace(
        '          - www.lotusotec.cl\n',
        '          - www.lotusotec.com\n',
      ),
      DNS,
    )
    expect(problemas.some((p) => p.startsWith('Aliases:'))).toBe(true)
  })

  it('função em CacheBehavior fora do padrão reprova com o caminho', () => {
    const comFuncao = SITE.replace(
      '            ResponseHeadersPolicyId: !Ref PoliticaDeCabecalhos\n',
      '            ResponseHeadersPolicyId: !Ref PoliticaDeCabecalhos\n            FunctionAssociations:\n              - EventType: viewer-request\n                FunctionARN: !GetAtt RedirecionarWww.FunctionMetadata.FunctionARN\n',
    )
    expect(conferirDistribuicao(comFuncao, DNS)).toContain(
      'CacheBehaviors /api/*: FunctionAssociations presente',
    )
  })

  it('função ausente do behavior padrão reprova', () => {
    const sem = SITE.replace(
      /          FunctionAssociations:\n            - EventType: viewer-request\n              FunctionARN: !GetAtt RedirecionarWww\.FunctionMetadata\.FunctionARN\n/,
      '',
    )
    expect(
      conferirDistribuicao(sem, DNS).some((p) =>
        p.startsWith('DefaultCacheBehavior.FunctionAssociations'),
      ),
    ).toBe(true)
  })

  it('location errado reprova com o caso e os dois valores', () => {
    const errado = SITE.replace(
      "'https://lotusotec.cl' + request.uri",
      "'https://lotusotec.cl/' + request.uri",
    )
    const problemas = conferirDistribuicao(errado, DNS)
    expect(
      problemas.some((p) => p.startsWith('location para www com caminho')),
    ).toBe(true)
    expect(problemas.join('\n')).toContain('https://lotusotec.cl//cursos/')
  })

  it('AllowedPattern do certificado solto de us-east-1 reprova', () => {
    const solto = SITE.replace(
      "'^arn:aws:acm:us-east-1:",
      "'^arn:aws:acm:[a-z0-9-]+:",
    )
    expect(conferirDistribuicao(solto, DNS)).toContain(
      'ArnDoCertificadoDoDominio.AllowedPattern: não prende us-east-1',
    )
  })
})

describe('a função do template, em node:vm', () => {
  const { codigo } = lerFuncao(SITE, 'RedirecionarWww')

  it('www com caminho e query de chave repetida vira 301 para o apex, na ordem', () => {
    const resposta = executarFuncao(
      codigo,
      evento('www.lotusotec.cl', '/cursos/', {
        a: { value: '1', multiValue: [{ value: '1' }, { value: '2' }] },
        b: { value: 'x' },
      }),
    )
    expect(resposta.statusCode).toBe(301)
    expect(resposta.statusDescription).toBe('Moved Permanently')
    expect(resposta.headers.location.value).toBe(
      'https://lotusotec.cl/cursos/?a=1&a=2&b=x',
    )
  })

  it('chave sem valor vira `chave=`', () => {
    expect(
      executarFuncao(
        codigo,
        evento('www.lotusotec.cl', '/x', { vazio: { value: '' } }),
      ).headers.location.value,
    ).toBe('https://lotusotec.cl/x?vazio=')
  })

  it('apex, domínio do CloudFront e pedido sem host seguem intactos', () => {
    for (const host of [
      'lotusotec.cl',
      'dhpoztt69jydz.cloudfront.net',
      undefined,
    ]) {
      const pedido = evento(host, '/qualquer?z=1')
      expect(executarFuncao(codigo, pedido)).toBe(pedido.request)
    }
  })

  it('cabe no limite de 10 KB do cloudfront-js-2.0 e não importa módulo', () => {
    expect(Buffer.byteLength(codigo, 'utf8')).toBeLessThanOrEqual(10 * 1024)
    expect(codigo).not.toMatch(/\brequire\(|\bimport\b/)
  })
})
