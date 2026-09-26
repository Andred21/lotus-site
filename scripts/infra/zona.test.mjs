import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  INVENTARIO,
  delegacaoEsperada,
  lerParametros,
  lerPoliticasDaZona,
  lerRegistros,
  mesmoConjunto,
  normalizar,
  resolver,
  wildcardAusente,
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

  it('para a lista de RecordSets no próximo recurso de topo', () => {
    // Com o Certificado no arquivo, um leitor que só para na coluna zero
    // entraria no bloco dele e somaria o SAN aos valores do último
    // RecordSet. A catraca reprovaria o ftp, apontando para o lugar errado.
    const fixture = [
      '',
      'Parameters:',
      '  NomeDaZona:',
      '    Default: exemplo.cl',
      'Resources:',
      '  Registros:',
      '    Properties:',
      '      RecordSets:',
      "        - Name: !Sub 'ftp.${NomeDaZona}.'",
      '          Type: CNAME',
      '          TTL: 3600',
      '          ResourceRecords:',
      '            - ftp.exemplo.',
      '  Certificado:',
      '    Properties:',
      '      SubjectAlternativeNames:',
      "        - !Sub 'www.${NomeDaZona}'",
      'Outputs:',
      '  Nada:',
      '    Value: x',
    ].join('\n')
    const lidos = lerRegistros(fixture)
    expect(lidos).toHaveLength(1)
    expect(lidos[0]?.nome).toBe('ftp.exemplo.cl.')
    expect(lidos[0]?.valores).toEqual(['ftp.exemplo.'])
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

  it('declara o certificado da zona, com SAN explícito e sem wildcard', () => {
    // A proibição anterior existia enquanto a zona não estava delegada:
    // pedido pendente do ACM morre em 72h, e com HostedZoneId o stack fica em
    // CREATE_IN_PROGRESS até validar. A delegação convergiu, então o que a
    // catraca precisa travar agora é a forma do certificado.
    const de = TEMPLATE.indexOf('\n  Certificado:')
    expect(de, 'template sem o recurso Certificado').toBeGreaterThan(-1)
    const bloco = TEMPLATE.slice(de, TEMPLATE.indexOf('\nOutputs:'))
    expect(bloco).toMatch(/Type: AWS::CertificateManager::Certificate/)
    expect(bloco).toMatch(/ValidationMethod: DNS/)
    expect(bloco).toMatch(/- !Sub 'www\.\$\{NomeDaZona\}'/)
    // Os dois nomes validam na própria zona: sem isto o ACM não cria o CNAME
    // de validação e alguém teria de criá-lo à mão, fora do stack.
    expect(bloco.match(/HostedZoneId: !Ref Zona/g)).toHaveLength(2)
    // Wildcard amplia o raio de uma chave comprometida e esconde o inventário
    // de nomes. Spec §4.
    expect(bloco).not.toMatch(/\*/)
  })

  it('exporta o ARN do certificado para o bloco do site', () => {
    // B5 consome isto como parâmetro: CloudFormation não importa valor entre
    // regiões, e a distribuição é sa-east-1.
    expect(TEMPLATE).toMatch(/ArnDoCertificado:/)
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

describe('vereditos que a delegação inverte', () => {
  it('antes da troca, nome inventado só pode resolver do lado da StackDNS', () => {
    expect(wildcardAusente([], ['185.146.167.195'], false)).toBe(true)
    // Resolveu na AWS: o wildcard atravessou.
    expect(
      wildcardAusente(['185.146.167.195'], ['185.146.167.195'], false),
    ).toBe(false)
    // Não resolveu em lado nenhum: ou a StackDNS mudou, ou a pergunta não
    // chegou. Nos dois casos o relatório não pode dar verde.
    expect(wildcardAusente([], [], false)).toBe(false)
  })

  it('depois da troca, nome inventado não pode resolver em lado nenhum', () => {
    // Os dois lados passaram a ser a mesma zona; a assimetria de antes
    // deixaria de ser possível mesmo que tudo estivesse certo.
    expect(wildcardAusente([], [], true)).toBe(true)
    expect(wildcardAusente([], ['185.146.167.195'], true)).toBe(false)
    expect(wildcardAusente(['185.146.167.195'], [], true)).toBe(false)
  })

  it('antes da troca, a delegação esperada é a da StackDNS', () => {
    expect(delegacaoEsperada(['ns-31.awsdns-03.com'], false)).toEqual([
      'ns1.stackdns.com.',
      'ns2.stackdns.com.',
      'ns3.stackdns.com.',
      'ns4.stackdns.com.',
    ])
  })

  it('depois da troca, a delegação esperada são os nameservers do stack', () => {
    // Com ponto final, que é como a resposta DoH chega. Hardcodar os quatro
    // nomes aqui seria mentira a partir da primeira zona recriada.
    expect(
      delegacaoEsperada(['ns-31.awsdns-03.com', 'ns-904.awsdns-49.net.'], true),
    ).toEqual(['ns-31.awsdns-03.com.', 'ns-904.awsdns-49.net.'])
  })
})
