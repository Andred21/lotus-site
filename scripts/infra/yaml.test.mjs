import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { lerYaml, mapa } from './lib/yaml.mjs'

// Fixture com cada forma que o leitor aceita. Os erros são provados mutando
// texto pequeno: a leitura quebra com o número da linha, nunca em silêncio.
const MODELO = `
# comentário de topo
Nome: valor simples
Aspas: 'com ''aspas'' simples'
Duplas: "com \\"escape\\" e: dois-pontos"
Numero: 30
Tag: !Ref Topico
Sub: !Sub 'arn:aws:cloudfront::\${AWS::AccountId}:distribution/\${Id}'
Fluxo: [check, 'procedencia', deploy]
Vazia: []
Mapa:
  token.actions.githubusercontent.com:aud: sts.amazonaws.com
  Lista:
    - um
    - Chave: dois
      Outra: tres
    - - aninhado
  # comentário no meio
  Literal: |
    linha um
      recuada

    depois da vazia
  Dobrado: >-
    primeira
    segunda

    paragrafo
Junta: !Join
  - ','
  - !GetAtt Zona.NameServers
Fim: ultimo
`

describe('leitura do YAML', () => {
  const lido = lerYaml(MODELO)

  it('lê escalar simples, entre aspas e tag como texto cru', () => {
    expect(lido.Nome).toBe('valor simples')
    expect(lido.Aspas).toBe("com 'aspas' simples")
    expect(lido.Duplas).toBe('com "escape" e: dois-pontos')
    expect(lido.Numero).toBe('30')
    expect(lido.Tag).toBe('!Ref Topico')
    expect(lido.Sub).toBe(
      "!Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${Id}'",
    )
  })

  it('lê lista em fluxo, lista em bloco e mapa dentro de item', () => {
    expect(lido.Fluxo).toEqual(['check', 'procedencia', 'deploy'])
    expect(lido.Vazia).toEqual([])
    const interno = mapa(lido.Mapa, 'Mapa')
    expect(interno['token.actions.githubusercontent.com:aud']).toBe(
      'sts.amazonaws.com',
    )
    expect(interno.Lista).toEqual([
      'um',
      { Chave: 'dois', Outra: 'tres' },
      ['aninhado'],
    ])
  })

  it('lê bloco literal com a quebra final e bloco dobrado sem ela', () => {
    const interno = mapa(lido.Mapa, 'Mapa')
    expect(interno.Literal).toBe('linha um\n  recuada\n\ndepois da vazia\n')
    expect(interno.Dobrado).toBe('primeira segunda\nparagrafo')
  })

  it('lê tag sozinha com bloco embaixo e segue depois dela', () => {
    expect(lido.Junta).toEqual({ '!Join': [',', '!GetAtt Zona.NameServers'] })
    expect(lido.Fim).toBe('ultimo')
  })

  it.each([
    ['tabulação', 'Nome: valor simples', '\tNome: x', 'linha 3: tabulação'],
    ['chave repetida', 'Fim: ultimo', 'Nome: de novo', 'chave repetida: Nome'],
    [
      'comentário no fim da linha',
      'Nome: valor simples',
      'Nome: valor # nota',
      'linha 3: comentário no fim da linha',
    ],
    ['âncora', 'Numero: 30', 'Numero: &n 30', 'linha 6: mapa em fluxo, âncora'],
    ['mapa em fluxo', 'Vazia: []', 'Vazia: {a: 1}', 'linha 10: mapa em fluxo'],
    [
      'aspas sem fechar',
      "Aspas: 'com ''aspas'' simples'",
      "Aspas: 'aberta",
      'linha 4: aspas simples sem fechar',
    ],
    [
      'recuo inesperado',
      'Fim: ultimo',
      'Fim: ultimo\n  solto: x',
      'linha 33: recuo inesperado depois de Fim',
    ],
  ])('%s quebra com o número da linha', (_nome, de, para, mensagem) => {
    expect(MODELO).toContain(de)
    expect(() => lerYaml(MODELO.replace(de, para))).toThrow(mensagem)
  })

  it('raiz que não é mapa quebra', () => {
    expect(() => lerYaml('- um\n- dois\n')).toThrow('o documento não é um mapa')
  })

  it('mapa() devolve o mapa ou quebra com o caminho', () => {
    expect(mapa({ a: 'b' }, 'x')).toEqual({ a: 'b' })
    expect(() => mapa('texto', 'Resources.Topico')).toThrow(
      'Resources.Topico: esperava um mapa',
    )
    expect(() => mapa(undefined, 'Outputs')).toThrow(
      'Outputs: esperava um mapa',
    )
  })
})

// Caminhos a partir da raiz do repositório, como `zona.test.mjs`: sob o
// Vitest, `import.meta.url` não é URL de esquema `file:`.
describe('os arquivos reais do repositório', () => {
  it.each([
    'infra/lotus-site.yaml',
    'infra/lotus-dns.yaml',
    'infra/lotus-contato.yaml',
    'infra/lotus-oidc-github.yaml',
    'infra/lotus-observabilidade.yaml',
    '.github/workflows/ci.yml',
  ])('%s é lido sem erro', (caminho) => {
    expect(() => lerYaml(readFileSync(caminho, 'utf8'))).not.toThrow()
  })

  it('o ci.yml chega com os blocos de shell e o if dobrado intactos', () => {
    const jobs = mapa(
      lerYaml(readFileSync('.github/workflows/ci.yml', 'utf8')).jobs,
      'jobs',
    )
    const deploy = mapa(jobs.deploy, 'deploy')
    expect(deploy.needs).toEqual(['check', 'procedencia'])
    expect(deploy.if).toBe(
      "github.event_name == 'push' && github.ref == 'refs/heads/main' && vars.AWS_DEPLOY_ROLE_ARN != ''",
    )
    const procedencia = mapa(jobs.procedencia, 'procedencia')
    const passos = procedencia.steps
    expect(Array.isArray(passos)).toBe(true)
    const run = Array.isArray(passos) ? mapa(passos[2], 'passo').run : ''
    expect(String(run)).toContain(
      'case "$caminho" in \'\'|\\#*) continue ;; esac',
    )
  })
})
