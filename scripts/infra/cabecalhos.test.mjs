import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  CABECALHOS,
  REMOVIDOS,
  lerPoliticaDoTemplate,
} from './lib/cabecalhos.mjs'

// Fixture com a mesma forma do recurso real. Os testes mutam esta string com
// `.replace()` para provar que a leitura quebra ruidosamente, com o nome do
// campo — nunca em silêncio (spec §4.2).
const MODELO = `
  PoliticaDeCabecalhos:
    Type: AWS::CloudFront::ResponseHeadersPolicy
    Properties:
      ResponseHeadersPolicyConfig:
        Name: teste-cabecalhos
        Comment: fixture dos testes
        SecurityHeadersConfig:
          ContentSecurityPolicy:
            ContentSecurityPolicy: "default-src 'none'; img-src 'self'"
            Override: true
          StrictTransportSecurity:
            AccessControlMaxAgeSec: 31536000
            IncludeSubdomains: false
            Preload: false
            Override: true
          ContentTypeOptions:
            Override: true
          FrameOptions:
            FrameOption: DENY
            Override: true
          ReferrerPolicy:
            ReferrerPolicy: strict-origin-when-cross-origin
            Override: true
        CustomHeadersConfig:
          Items:
            - Header: Permissions-Policy
              Value: camera=(), usb=()
              Override: true
            - Header: X-Robots-Tag
              Value: noindex, nofollow
              Override: true
        RemoveHeadersConfig:
          Items:
            - Header: Server
            - Header: x-amz-version-id
`

describe('o módulo canônico', () => {
  it('declara os seis cabeçalhos e os três removidos; o X-Robots-Tag saiu em 7.2.5', () => {
    expect(Object.keys(CABECALHOS)).toEqual([
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ])
    expect([...REMOVIDOS]).toEqual([
      'Server',
      'x-amz-server-side-encryption',
      'x-amz-version-id',
    ])
  })

  it('a CSP começa fechada e cabe no limite de 1783 do CloudFront', () => {
    const csp = CABECALHOS['Content-Security-Policy'] ?? ''
    expect(csp.startsWith("default-src 'none'; ")).toBe(true)
    expect(csp.length).toBeLessThanOrEqual(1783)
  })
})

describe('lerPoliticaDoTemplate sobre fixtures', () => {
  it('lê e renderiza cada cabeçalho da política', () => {
    const politica = lerPoliticaDoTemplate(MODELO)
    expect(politica.cabecalhos).toEqual({
      'Content-Security-Policy': "default-src 'none'; img-src 'self'",
      'Strict-Transport-Security': 'max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), usb=()',
      'X-Robots-Tag': 'noindex, nofollow',
    })
    expect(politica.removidos).toEqual(['Server', 'x-amz-version-id'])
    expect(politica.comentario).toBe('fixture dos testes')
  })

  it('HSTS só ganha diretiva quando o campo é true', () => {
    const politica = lerPoliticaDoTemplate(
      MODELO.replace(
        'IncludeSubdomains: false',
        'IncludeSubdomains: true',
      ).replace('Preload: false', 'Preload: true'),
    )
    expect(politica.cabecalhos['Strict-Transport-Security']).toBe(
      'max-age=31536000; includeSubDomains; preload',
    )
  })

  it('campo esperado ausente quebra com o nome do campo', () => {
    expect(() =>
      lerPoliticaDoTemplate(
        MODELO.replace('            FrameOption: DENY\n', ''),
      ),
    ).toThrow('FrameOptions sem FrameOption')
    expect(() =>
      lerPoliticaDoTemplate(
        MODELO.replace('            AccessControlMaxAgeSec: 31536000\n', ''),
      ),
    ).toThrow('StrictTransportSecurity sem AccessControlMaxAgeSec')
  })

  it('IncludeSubdomains ausente quebra com o nome do campo', () => {
    expect(() =>
      lerPoliticaDoTemplate(
        MODELO.replace('            IncludeSubdomains: false\n', ''),
      ),
    ).toThrow('StrictTransportSecurity sem IncludeSubdomains')
  })

  it('Preload ausente quebra com o nome do campo', () => {
    expect(() =>
      lerPoliticaDoTemplate(MODELO.replace('            Preload: false\n', '')),
    ).toThrow('StrictTransportSecurity sem Preload')
  })

  it('IncludeSubdomains ou Preload fora de true/false quebra com o valor', () => {
    expect(() =>
      lerPoliticaDoTemplate(
        MODELO.replace('IncludeSubdomains: false', 'IncludeSubdomains: talvez'),
      ),
    ).toThrow('StrictTransportSecurity.IncludeSubdomains')
    expect(() =>
      lerPoliticaDoTemplate(
        MODELO.replace('Preload: false', 'Preload: talvez'),
      ),
    ).toThrow('StrictTransportSecurity.Preload')
  })

  it('Type ausente quebra com o nome do campo', () => {
    expect(() =>
      lerPoliticaDoTemplate(
        MODELO.replace(
          '    Type: AWS::CloudFront::ResponseHeadersPolicy\n',
          '',
        ),
      ),
    ).toThrow('PoliticaDeCabecalhos sem Type')
  })

  it('Properties ausente quebra com o nome do campo', () => {
    expect(() =>
      lerPoliticaDoTemplate(MODELO.replace('    Properties:\n', '')),
    ).toThrow('PoliticaDeCabecalhos sem Properties')
  })

  it('ResponseHeadersPolicyConfig ausente quebra com o nome do campo', () => {
    expect(() =>
      lerPoliticaDoTemplate(
        MODELO.replace('      ResponseHeadersPolicyConfig:\n', ''),
      ),
    ).toThrow('Properties sem ResponseHeadersPolicyConfig')
  })

  it('campo desconhecido dentro da política quebra com o nome do campo', () => {
    expect(() =>
      lerPoliticaDoTemplate(
        MODELO.replace('ContentTypeOptions:', 'CoisaNova:'),
      ),
    ).toThrow('SecurityHeadersConfig com campo desconhecido: CoisaNova')
    expect(() =>
      lerPoliticaDoTemplate(
        MODELO.replace('        RemoveHeadersConfig:', '        OutraSecao:'),
      ),
    ).toThrow('ResponseHeadersPolicyConfig com campo desconhecido: OutraSecao')
  })

  it('Override diferente de true quebra', () => {
    expect(() =>
      lerPoliticaDoTemplate(
        MODELO.replace(
          '            FrameOption: DENY\n            Override: true',
          '            FrameOption: DENY\n            Override: false',
        ),
      ),
    ).toThrow('FrameOptions sem Override: true')
  })

  it('template sem o recurso quebra', () => {
    expect(() => lerPoliticaDoTemplate('Resources: {}')).toThrow(
      'template sem o recurso PoliticaDeCabecalhos',
    )
  })
})

// Caminho a partir da raiz do repositório, como `zona.test.mjs`: sob o
// Vitest, `import.meta.url` não é URL de esquema `file:` e `readFileSync` a
// recusa.
const TEMPLATE = readFileSync('infra/lotus-site.yaml', 'utf8')

describe('catraca: template ≡ módulo', () => {
  const politica = lerPoliticaDoTemplate(TEMPLATE)
  // Nome de cabeçalho é comparado sem caixa (HTTP não distingue; o template
  // escreve `x-amz-version-id` ao lado de `Permissions-Policy`). Valor é
  // comparado exato.
  const doTemplate = new Map(
    Object.entries(politica.cabecalhos).map(([nome, valor]) => [
      nome.toLowerCase(),
      valor,
    ]),
  )
  const doModulo = new Map(
    Object.entries(CABECALHOS).map(([nome, valor]) => [
      nome.toLowerCase(),
      valor,
    ]),
  )

  it('todo cabeçalho do módulo está no template, com o mesmo valor', () => {
    for (const [nome, valor] of doModulo) {
      expect(doTemplate.get(nome), `cabeçalho ${nome}`).toBe(valor)
    }
  })

  it('o template não emite cabeçalho fora do módulo', () => {
    expect([...doTemplate.keys()].sort()).toEqual([...doModulo.keys()].sort())
  })

  it('os removidos batem, sem caixa', () => {
    /** @param {readonly string[]} lista */
    const chaves = (lista) => lista.map((nome) => nome.toLowerCase()).sort()
    expect(chaves(politica.removidos)).toEqual(chaves(REMOVIDOS))
  })

  it('o Comment cabe nos 128 caracteres do CloudFront', () => {
    // Medido em 2026-09-04: com 286 o stack reprovou em CREATE_FAILED.
    expect(politica.comentario.length).toBeGreaterThan(0)
    expect(politica.comentario.length).toBeLessThanOrEqual(128)
  })
})
