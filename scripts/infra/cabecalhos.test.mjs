import { describe, expect, it } from 'vitest'
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
  it('declara os sete cabeçalhos e os três removidos da spec', () => {
    expect(Object.keys(CABECALHOS)).toEqual([
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'X-Robots-Tag',
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
