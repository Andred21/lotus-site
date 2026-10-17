import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  conferirChaves,
  escalar,
  lerTemplate,
  lista,
  recurso,
  resolver,
} from './lib/template.mjs'
import { mapa } from './lib/yaml.mjs'

// Template pequeno com as três formas de parâmetro que importam: Default
// textual, Default numérico (chega como texto) e parâmetro sem Default.
const FIXTURE = `
Parameters:
  NomeDaZona:
    Type: String
    Default: exemplo.cl
  Ttl:
    Type: Number
    Default: 3600
  SemPadrao:
    Type: String
Resources:
  Zona:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref NomeDaZona
`

describe('lerTemplate', () => {
  it('lê os Default escalares e ignora parâmetro sem Default', () => {
    expect(Object.fromEntries(lerTemplate(FIXTURE).defaults)).toEqual({
      NomeDaZona: 'exemplo.cl',
      Ttl: '3600',
    })
  })

  it('Resources ausente lança', () => {
    expect(() => lerTemplate('Parameters:\n  A:\n    Default: x\n')).toThrow(
      'template sem Resources',
    )
  })

  it('recurso ausente lança com o nome', () => {
    expect(() => recurso(lerTemplate(FIXTURE), 'NaoExiste')).toThrow(
      'template sem o recurso NaoExiste',
    )
  })
})

describe('resolver', () => {
  it('resolve !Ref e !Sub contra os Default', () => {
    const { defaults } = lerTemplate(FIXTURE)
    expect(resolver('!Ref NomeDaZona', defaults, 'x')).toBe('exemplo.cl')
    expect(resolver("!Sub 'www.${NomeDaZona}.'", defaults, 'x')).toBe(
      'www.exemplo.cl.',
    )
    expect(resolver('1 ASPMX.L.GOOGLE.COM.', defaults, 'x')).toBe(
      '1 ASPMX.L.GOOGLE.COM.',
    )
  })

  it('decodifica o payload do !Sub pelas regras do YAML', () => {
    const { defaults } = lerTemplate(FIXTURE)
    expect(resolver("!Sub 'it''s ${NomeDaZona}'", defaults, 'x')).toBe(
      "it's exemplo.cl",
    )
    expect(resolver('!Sub "a\\"${NomeDaZona}"', defaults, 'x')).toBe(
      'a"exemplo.cl',
    )
  })

  it('parâmetro sem Default lança em vez de resolver para vazio', () => {
    expect(() =>
      resolver('!Ref SemPadrao', lerTemplate(FIXTURE).defaults, 'x'),
    ).toThrow(/SemPadrao/)
  })

  it('tag sem resolução e valor não escalar lançam com o caminho', () => {
    const { defaults } = lerTemplate(FIXTURE)
    expect(() => resolver('!GetAtt A.B', defaults, 'Registros.0.Name')).toThrow(
      'Registros.0.Name: sem resolução',
    )
    expect(() => resolver({ '!Join': [] }, defaults, 'y')).toThrow(
      'y: sem resolução',
    )
  })
})

describe('conferências de forma', () => {
  it('conferirChaves lança com o nome do campo fora do conjunto', () => {
    expect(() =>
      conferirChaves({ Name: 'a', Weight: '10' }, ['Name'], 'RecordSet a'),
    ).toThrow('RecordSet a com campo desconhecido: Weight')
  })

  it('escalar e lista lançam com o caminho', () => {
    expect(() => escalar(['a'], 'p')).toThrow('p: esperava um escalar')
    expect(() => lista('a', 'q')).toThrow('q: esperava uma lista')
  })
})

// Caminhos a partir da raiz do repositório, como `zona.test.mjs`: sob o
// Vitest, `import.meta.url` não é URL de esquema `file:`.
describe('os templates reais', () => {
  it('lê os cinco templates reais', () => {
    for (const nome of [
      'dns',
      'site',
      'observabilidade',
      'contato',
      'oidc-github',
    ]) {
      expect(() =>
        lerTemplate(readFileSync(`infra/lotus-${nome}.yaml`, 'utf8')),
      ).not.toThrow()
    }
  })

  it('resolve todo Name dos RecordSets do lotus-dns', () => {
    const t = lerTemplate(readFileSync('infra/lotus-dns.yaml', 'utf8'))
    const itens = lista(
      mapa(recurso(t, 'Registros').Properties, 'Registros.Properties')
        .RecordSets,
      'RecordSets',
    )
    expect(itens).toHaveLength(19)
    for (const [i, item] of itens.entries()) {
      expect(
        resolver(
          mapa(item, `RecordSets.${i}`).Name,
          t.defaults,
          `RecordSets.${i}.Name`,
        ),
      ).toMatch(/(^|\.)lotusotec\.cl\.$/)
    }
  })
})
