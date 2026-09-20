import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  INVENTARIO,
  lerParametros,
  lerPoliticasDaZona,
  lerRegistros,
  mesmoConjunto,
  normalizar,
  resolver,
} from './lib/zona.mjs'

// Caminho a partir da raiz do repositório, como os outros testes de
// `scripts/` já fazem (`scripts/inventario/fontes.test.mjs`): sob o Vitest,
// `import.meta.url` não é URL de esquema `file:` e `readFileSync` a recusa.
const TEMPLATE = readFileSync('infra/lotus-dns.yaml', 'utf8')

describe('leitura textual do template', () => {
  const parametros = lerParametros(TEMPLATE)

  it('lê o Default de cada parâmetro', () => {
    expect(parametros.get('NomeDaZona')).toBe('lotusotec.cl')
    expect(parametros.get('IpDoWordPress')).toBe('185.146.167.195')
    expect(parametros.get('Ipv6DoWordPress')).toBe('2a07:7800::195')
    expect(parametros.get('TtlPadrao')).toBe('3600')
  })

  it('resolve !Ref e !Sub contra os defaults', () => {
    expect(resolver('!Ref IpDoWordPress', parametros)).toBe('185.146.167.195')
    expect(resolver("!Sub 'www.${NomeDaZona}.'", parametros)).toBe(
      'www.lotusotec.cl.',
    )
    expect(resolver("'1 ASPMX.L.GOOGLE.COM.'", parametros)).toBe(
      '1 ASPMX.L.GOOGLE.COM.',
    )
  })

  it('reprova parâmetro sem Default em vez de resolver para vazio', () => {
    expect(() => resolver('!Ref NaoExiste', parametros)).toThrow(/NaoExiste/)
  })

  it('acha exatamente um RecordSet por linha do inventário', () => {
    // Guarda contra o leitor deixar de achar qualquer coisa e o resto do
    // arquivo ficar verde por vacuidade.
    expect(lerRegistros(TEMPLATE)).toHaveLength(INVENTARIO.length)
  })
})

describe('infra/lotus-dns.yaml contra o inventário medido', () => {
  const registros = lerRegistros(TEMPLATE)

  for (const esperado of INVENTARIO) {
    it(`declara ${esperado.tipo} ${esperado.nome}`, () => {
      const achado = registros.find(
        (registro) =>
          registro.nome === esperado.nome && registro.tipo === esperado.tipo,
      )
      expect(
        achado,
        `${esperado.tipo} ${esperado.nome} não está no template`,
      ).toBeDefined()
      expect(mesmoConjunto(achado?.valores ?? [], esperado.valores)).toBe(true)
    })
  }

  it('mantém os cinco MX do Google, com as prioridades medidas', () => {
    const mx = registros.find((registro) => registro.tipo === 'MX')
    const doInventario = INVENTARIO.find((registro) => registro.tipo === 'MX')
    expect(mx?.valores).toHaveLength(5)
    expect((mx?.valores ?? []).map(normalizar).sort()).toEqual(
      (doInventario?.valores ?? []).map(normalizar).sort(),
    )
  })

  it('não declara wildcard', () => {
    expect(registros.filter((registro) => registro.nome.includes('*'))).toEqual(
      [],
    )
  })

  it('não declara NS nem SOA do apex', () => {
    // A zona gera os dois; declará-los briga com o delegation set escolhido
    // pela AWS.
    expect(
      registros.filter(
        (registro) => registro.tipo === 'NS' || registro.tipo === 'SOA',
      ),
    ).toEqual([])
  })

  it('não aponta nada para o CloudFront', () => {
    // Alias do apex e de www são B5. Chegar aqui cedo aponta o domínio antes
    // de existir certificado.
    expect(TEMPLATE).not.toMatch(/cloudfront\.net/)
    expect(TEMPLATE).not.toMatch(/AliasTarget/)
  })

  it('não declara certificado', () => {
    // Pedido pendente do ACM morre em 72h, e com HostedZoneId o stack fica em
    // CREATE_IN_PROGRESS até validar — com a zona ainda não delegada, isso é
    // stack travado até o timeout. Spec §3 D6.
    expect(TEMPLATE).not.toMatch(/AWS::CertificateManager::Certificate/)
  })

  it('protege a zona contra delete-stack', () => {
    expect(lerPoliticasDaZona(TEMPLATE)).toEqual({
      deletionPolicy: 'Retain',
      updateReplacePolicy: 'Retain',
    })
  })

  it('usa o TTL medido da zona atual em todos os registros', () => {
    // Comparado contra o tamanho do INVENTARIO, e nao contra o proprio
    // `registros`: com os dois lados derivados da mesma lista, uma leitura
    // vazia passaria.
    expect(registros.map((registro) => registro.ttl)).toEqual(
      INVENTARIO.map(() => 3600),
    )
  })
})
