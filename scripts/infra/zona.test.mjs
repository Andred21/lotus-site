import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  MX_DO_GOOGLE,
  REGISTROS_DA_ZONA,
  WORDPRESS,
  conferirAliasesDoCorte,
  conferirRegistrosDaZona,
  convergiu,
  delegacaoEsperada,
  lerPoliticasDaZona,
  lerPoliticasDoRecurso,
  lerRegistros,
  linhaConfere,
  normalizar,
  respondeComoBorda,
  respostaDosNameservers,
  valoresDaApi,
  wildcardAusente,
} from './lib/zona.mjs'
import { lerTemplate, lista, recurso, resolver } from './lib/template.mjs'
import { mapa } from './lib/yaml.mjs'

// Caminho a partir da raiz do repositório, como os outros testes de
// `scripts/` já fazem (`scripts/inventario/fontes.test.mjs`): sob o Vitest,
// `import.meta.url` não é URL de esquema `file:` e `readFileSync` a recusa.
const TEMPLATE = readFileSync('infra/lotus-dns.yaml', 'utf8')

describe('leitura do template', () => {
  const parametros = lerTemplate(TEMPLATE).defaults

  it('lê o Default de cada parâmetro', () => {
    expect(parametros.get('NomeDaZona')).toBe('lotusotec.cl')
    expect(parametros.get('TtlPadrao')).toBe('3600')
    // Desde o corte (7.2.5, spec D6), apex e www são alias da distribuição; o
    // endereço antigo do WordPress mora em WORDPRESS, no zona.mjs.
    expect(parametros.get('DominioDaDistribuicao')).toBe(
      'dhpoztt69jydz.cloudfront.net',
    )
    for (const nome of ['IpDoWordPress', 'Ipv6DoWordPress', 'TtlDoCorte']) {
      expect(parametros.has(nome), `${nome} saiu no corte`).toBe(false)
    }
    // Os tres tokens DKIM sao Default de parametro, como os IPs: sem Default
    // `resolver` lanca e a catraca nao consegue ler os CNAME.
    for (const nome of ['TokenDkim1', 'TokenDkim2', 'TokenDkim3']) {
      expect(parametros.get(nome)).toMatch(/^[a-z0-9]{20,64}$/)
    }
    expect(parametros.get('IpDaIntranet')).toBe('18.230.53.197')
  })

  it('resolve !Ref e !Sub contra os defaults', () => {
    expect(resolver('!Ref IpDaIntranet', parametros, 'teste')).toBe(
      '18.230.53.197',
    )
    expect(resolver("!Sub 'www.${NomeDaZona}.'", parametros, 'teste')).toBe(
      'www.lotusotec.cl.',
    )
    // Valor sem tag chega do `lerYaml` já sem as aspas e volta igual.
    expect(resolver('1 ASPMX.L.GOOGLE.COM.', parametros, 'teste')).toBe(
      '1 ASPMX.L.GOOGLE.COM.',
    )
  })

  it('reprova parâmetro sem Default em vez de resolver para vazio', () => {
    expect(() => resolver('!Ref NaoExiste', parametros, 'teste')).toThrow(
      /NaoExiste/,
    )
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

  it('lê AliasTarget como alias, com o DNSName resolvido e sem TTL', () => {
    // Forma do estágio 2 do ensaio (spec §4.4) e do corte em B5.
    const fixture = [
      '',
      'Parameters:',
      '  NomeDaZona:',
      '    Default: exemplo.cl',
      '  DominioDaDistribuicao:',
      '    Default: d123.cloudfront.net',
      'Resources:',
      '  Registros:',
      '    Properties:',
      '      RecordSets:',
      "        - Name: !Sub 'ensaio-corte.${NomeDaZona}.'",
      '          Type: A',
      '          AliasTarget:',
      '            DNSName: !Ref DominioDaDistribuicao',
      '            # hosted zone fixa do CloudFront',
      '            HostedZoneId: Z2FDTNDATAQYW2',
      '            EvaluateTargetHealth: false',
      "        - Name: !Sub 'app.${NomeDaZona}.'",
      '          Type: A',
      '          TTL: 3600',
      '          ResourceRecords:',
      '            - 18.230.53.197',
      'Outputs:',
    ].join('\n')
    const [alias, comum] = lerRegistros(fixture)
    expect(alias).toEqual({
      nome: 'ensaio-corte.exemplo.cl.',
      tipo: 'A',
      ttl: 0,
      valores: ['d123.cloudfront.net'],
      alias: true,
    })
    expect(comum?.alias).toBe(false)
    expect(comum?.ttl).toBe(3600)
  })

  it('campo desconhecido num RecordSet quebra com o nome do campo', () => {
    // Sem isto, `SetIdentifier`, `Weight` ou um erro de digitação viraria
    // registro lido pela metade e catraca verde por vacuidade.
    const fixture = [
      '',
      'Parameters:',
      '  NomeDaZona:',
      '    Default: exemplo.cl',
      'Resources:',
      '  Registros:',
      '    Properties:',
      '      RecordSets:',
      "        - Name: !Sub 'x.${NomeDaZona}.'",
      '          Type: A',
      '          Weight: 10',
      'Outputs:',
    ].join('\n')
    expect(() => lerRegistros(fixture)).toThrow(
      'RecordSet x.exemplo.cl. com campo desconhecido: Weight',
    )
  })

  it('campo desconhecido no AliasTarget quebra com o nome do campo', () => {
    const fixture = [
      '',
      'Parameters:',
      '  NomeDaZona:',
      '    Default: exemplo.cl',
      'Resources:',
      '  Registros:',
      '    Properties:',
      '      RecordSets:',
      "        - Name: !Sub 'ensaio-corte.${NomeDaZona}.'",
      '          Type: A',
      '          AliasTarget:',
      '            DNSName: d123.cloudfront.net',
      '            Weight: 10',
      'Outputs:',
    ].join('\n')
    expect(() => lerRegistros(fixture)).toThrow(
      'AliasTarget de ensaio-corte.exemplo.cl. com campo desconhecido: Weight',
    )
  })

  it('RecordSet com AliasTarget e ResourceRecords juntos quebra', () => {
    // O leitor por coluna somava os dois em `valores` e a catraca reprovava;
    // descartar um deles em silêncio esconderia o erro do template.
    const fixture = [
      '',
      'Parameters:',
      '  NomeDaZona:',
      '    Default: exemplo.cl',
      'Resources:',
      '  Registros:',
      '    Properties:',
      '      RecordSets:',
      "        - Name: !Sub 'ensaio-corte.${NomeDaZona}.'",
      '          Type: A',
      '          ResourceRecords:',
      '            - 1.2.3.4',
      '          AliasTarget:',
      '            DNSName: d.cloudfront.net',
      'Outputs:',
    ].join('\n')
    expect(() => lerRegistros(fixture)).toThrow(
      'RecordSet ensaio-corte.exemplo.cl. com AliasTarget e ResourceRecords',
    )
  })
})

describe('infra/lotus-dns.yaml contra as regras da zona', () => {
  const registros = lerRegistros(TEMPLATE)

  it('o template declara exatamente os registros da lista', () => {
    // Guarda contra o leitor deixar de achar qualquer coisa e o resto do
    // arquivo ficar verde por vacuidade. O valor de cada registro é o
    // `conferir-zona` que confere, contra a zona no ar.
    expect(REGISTROS_DA_ZONA).toHaveLength(19)
    expect(conferirRegistrosDaZona(registros)).toEqual([])
  })

  it('leitura vazia e registro sumido reprovam', () => {
    expect(conferirRegistrosDaZona([])).toHaveLength(19)
    const semFtp = registros.filter((r) => r.nome !== 'ftp.lotusotec.cl.')
    expect(conferirRegistrosDaZona(semFtp)).toEqual([
      'ausente: CNAME ftp.lotusotec.cl.',
    ])
    const comExtra = [
      ...registros,
      {
        nome: 'x.lotusotec.cl.',
        tipo: 'A',
        ttl: 3600,
        valores: [],
        alias: false,
      },
    ]
    expect(conferirRegistrosDaZona(comExtra)).toEqual([
      'fora da lista: A x.lotusotec.cl.',
    ])
  })

  it('mantém os cinco MX do Google, com as prioridades medidas', () => {
    // E-mail no Google Workspace é invariante da ADR-SITE-006.
    const mx = registros.find(
      (registro) => registro.tipo === 'MX' && registro.nome === 'lotusotec.cl.',
    )
    expect(mx?.valores).toHaveLength(5)
    expect(mx?.valores.map(normalizar).sort()).toEqual(
      MX_DO_GOOGLE.map(normalizar).sort(),
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

  it('exatamente apex e www, A e AAAA, são alias (7.2.5, spec §4.3)', () => {
    // Para onde apontam é o `conferir-zona` que confere, contra a zona no ar.
    expect(conferirAliasesDoCorte(registros)).toEqual([])
  })

  it('alias fora de apex e www, apex ou www sem alias e TTL em alias reprovam', () => {
    /** @typedef {import('./lib/zona.mjs').RegistroLido} RegistroLido */
    /**
     * @param {(registro: RegistroLido) => boolean} qual
     * @param {Partial<RegistroLido>} mudanca
     */
    const mexendo = (qual, mudanca) =>
      registros.map((registro) =>
        qual(registro) ? { ...registro, ...mudanca } : registro,
      )
    expect(
      conferirAliasesDoCorte(
        mexendo((r) => r.nome === 'app.lotusotec.cl.', {
          alias: true,
          ttl: 0,
        }),
      ),
    ).toEqual(['alias fora de apex e www: A app.lotusotec.cl.'])
    expect(
      conferirAliasesDoCorte(
        mexendo((r) => r.nome === 'www.lotusotec.cl.' && r.tipo === 'AAAA', {
          alias: false,
          ttl: 60,
        }),
      ),
    ).toEqual(['sem alias: AAAA www.lotusotec.cl.'])
    expect(
      conferirAliasesDoCorte(
        mexendo((r) => r.nome === 'lotusotec.cl.' && r.tipo === 'A', {
          ttl: 60,
        }),
      ),
    ).toEqual(['TTL em alias: A lotusotec.cl.'])
  })

  it('declara o certificado da zona, com SAN explícito e sem wildcard', () => {
    // A proibição anterior existia enquanto a zona não estava delegada:
    // pedido pendente do ACM morre em 72h, e com HostedZoneId o stack fica em
    // CREATE_IN_PROGRESS até validar. A delegação convergiu, então o que a
    // catraca precisa travar agora é a forma do certificado.
    const certificado = recurso(lerTemplate(TEMPLATE), 'Certificado')
    expect(certificado.Type).toBe('AWS::CertificateManager::Certificate')
    const propriedades = mapa(certificado.Properties, 'Certificado.Properties')
    expect(propriedades.ValidationMethod).toBe('DNS')
    expect(propriedades.SubjectAlternativeNames).toContain(
      "!Sub 'www.${NomeDaZona}'",
    )
    // Os dois nomes validam na própria zona: sem isto o ACM não cria o CNAME
    // de validação e alguém teria de criá-lo à mão, fora do stack.
    const validacoes = lista(
      propriedades.DomainValidationOptions,
      'DomainValidationOptions',
    )
    expect(validacoes).toHaveLength(2)
    for (const [i, validacao] of validacoes.entries()) {
      expect(mapa(validacao, `DomainValidationOptions.${i}`).HostedZoneId).toBe(
        '!Ref Zona',
      )
    }
    // Wildcard amplia o raio de uma chave comprometida e esconde o inventário
    // de nomes. Spec §4.
    expect(JSON.stringify(certificado)).not.toMatch(/\*/)
  })

  it('exporta o ARN do certificado para o bloco do site', () => {
    // B5 consome isto como parâmetro: CloudFormation não importa valor entre
    // regiões, e a distribuição é sa-east-1.
    expect(lerTemplate(TEMPLATE).saidas).toHaveProperty('ArnDoCertificado')
  })

  it('protege a zona contra delete-stack', () => {
    expect(lerPoliticasDaZona(TEMPLATE)).toEqual({
      deletionPolicy: 'Retain',
      updateReplacePolicy: 'Retain',
    })
  })

  it('protege os registros contra delete-stack (D-52)', () => {
    // A zona já era Retain; os registros não. Um delete-stack apagaria MX,
    // SPF e o resto e deixaria a zona retida vazia, com o e-mail fora do ar.
    expect(lerPoliticasDoRecurso(TEMPLATE, 'Registros')).toEqual({
      deletionPolicy: 'Retain',
      updateReplacePolicy: 'Retain',
    })
  })

  it('lerPoliticasDaZona continua sendo o recurso Zona', () => {
    expect(lerPoliticasDaZona(TEMPLATE)).toEqual(
      lerPoliticasDoRecurso(TEMPLATE, 'Zona'),
    )
  })

  it('reprova recurso que não existe em vez de devolver políticas vazias', () => {
    expect(() => lerPoliticasDoRecurso(TEMPLATE, 'NaoExiste')).toThrow(
      /NaoExiste/,
    )
  })

  it('sistema saiu da zona (7.2.5, spec D2)', () => {
    // O nome da intranet é app desde 2026-09-27; sistema só apontava para o
    // WordPress. Ele sai antes do corte, para o rollback mexer só em apex e
    // www, como no ensaio de B4.
    /** @param {{ nome: string }} registro */
    const sistema = (registro) => registro.nome === 'sistema.lotusotec.cl.'
    expect(registros.filter(sistema)).toEqual([])
  })

  it('app tem A para o EIP da intranet e NÃO tem AAAA — o EIP não tem IPv6', () => {
    const app = registros.filter(
      (registro) => registro.nome === 'app.lotusotec.cl.',
    )
    expect(app.map((registro) => registro.tipo)).toEqual(['A'])
    expect(app[0]?.valores).toEqual(['18.230.53.197'])
  })

  it('usa 3600 em todo registro que não é alias; apex e www são alias desde o corte', () => {
    // A contagem fixa é o que impede uma leitura vazia de passar: 19
    // registros menos os 4 do corte. Alias não tem TTL: a AWS fixa em 60 s
    // (spec D12 de B4).
    const comuns = registros.filter((registro) => registro.alias === false)
    expect(comuns).toHaveLength(15)
    for (const registro of comuns) {
      expect(registro.ttl, `TTL de ${registro.tipo} ${registro.nome}`).toBe(
        3600,
      )
    }
  })

  it('publica o DMARC em p=none, com relatorio em contacto@', () => {
    // p=none nao muda a entrega de nenhuma mensagem; e o que a ADR-SITE-005
    // pediu para enxergar o efeito do remetente novo (spec D11). Endurecer
    // para quarantine ou reject e decisao, nao edicao.
    const dmarc = registros.find(
      (registro) => registro.nome === '_dmarc.lotusotec.cl.',
    )
    expect(dmarc?.tipo).toBe('TXT')
    expect(normalizar(dmarc?.valores[0] ?? '')).toBe(
      'v=dmarc1; p=none; rua=mailto:contacto@lotusotec.cl',
    )
  })

  it('aponta os tres CNAME do DKIM para o SES, e para mais nada', () => {
    const dkim = registros.filter((registro) =>
      registro.nome.endsWith('._domainkey.lotusotec.cl.'),
    )
    expect(dkim).toHaveLength(3)
    for (const registro of dkim) {
      expect(registro.tipo).toBe('CNAME')
      expect(registro.valores).toHaveLength(1)
      expect(registro.valores[0]).toMatch(/^[a-z0-9]+\.dkim\.amazonses\.com\.$/)
    }
  })

  it('o MAIL FROM tem MX do SES em sa-east-1 e SPF proprio', () => {
    // A regiao esta no nome do MX: mudar a regiao do stack lotus-contato sem
    // mudar esta linha deixaria o MAIL FROM apontando para o lugar errado.
    const mx = registros.find(
      (registro) =>
        registro.nome === 'ses.lotusotec.cl.' && registro.tipo === 'MX',
    )
    const txt = registros.find(
      (registro) =>
        registro.nome === 'ses.lotusotec.cl.' && registro.tipo === 'TXT',
    )
    expect((mx?.valores ?? []).map(normalizar)).toEqual([
      '10 feedback-smtp.sa-east-1.amazonses.com.',
    ])
    expect(normalizar(txt?.valores[0] ?? '')).toBe(
      'v=spf1 include:amazonses.com ~all',
    )
  })
})

describe('vereditos depois da delegação', () => {
  it('nome inventado não pode resolver em lado nenhum', () => {
    // Os dois lados são a mesma zona, lida por caminhos diferentes.
    // Resolver na AWS é o wildcard tendo atravessado.
    expect(wildcardAusente([], [])).toBe(true)
    expect(wildcardAusente([], ['185.146.167.195'])).toBe(false)
    expect(wildcardAusente(['185.146.167.195'], [])).toBe(false)
  })

  it('a delegação esperada são os nameservers do stack', () => {
    // Com ponto final, que é como a resposta DoH chega. Hardcodar os quatro
    // nomes aqui seria mentira a partir da primeira zona recriada.
    expect(
      delegacaoEsperada(['ns-31.awsdns-03.com', 'ns-904.awsdns-49.net.']),
    ).toEqual(['ns-31.awsdns-03.com.', 'ns-904.awsdns-49.net.'])
  })
})

describe('convergiu (medir-propagacao, spec §4.4)', () => {
  const wp = { A: [WORDPRESS.A], AAAA: [WORDPRESS.AAAA] }
  const cf = { A: ['3.166.165.48', '3.166.165.9'], AAAA: ['2600:9000:2::1'] }

  it('cloudfront exige resposta nos dois tipos e nenhuma delas do WordPress', () => {
    expect(convergiu('cloudfront', cf)).toBe(true)
    expect(convergiu('cloudfront', { A: cf.A, AAAA: [] })).toBe(false)
  })

  it('convergência parcial não é convergência', () => {
    // Resolvedor que já trocou o A mas ainda serve o AAAA antigo, ou o
    // contrário: o visitante dual-stack ainda pode cair no lado errado.
    expect(convergiu('cloudfront', { A: cf.A, AAAA: wp.AAAA })).toBe(false)
  })

  it('ausente exige silêncio nos dois tipos', () => {
    expect(convergiu('ausente', { A: [], AAAA: [] })).toBe(true)
    expect(convergiu('ausente', { A: [], AAAA: wp.AAAA })).toBe(false)
  })

  it('wordpress deixou de ser esperado em B7: não há mais WordPress', () => {
    // @ts-expect-error valor fora do tipo, de propósito
    expect(() => convergiu('wordpress', wp)).toThrow(
      'esperado desconhecido: wordpress',
    )
  })
})

describe('alias no conferir-zona (7.2.5, spec §4.5)', () => {
  // Duas das oito respostas AAAA que cada nameserver deu ao alias de
  // ensaio-corte no estágio 2 de B4 (evidência §3.2): o IPv4 veio igual nos
  // quatro, o IPv6 não.
  const AAAA_POR_NAMESERVER = [
    [
      '2600:9000:27a4:f800:13:9e71:75c0:21',
      '2600:9000:27a4:6800:13:9e71:75c0:21',
    ],
    [
      '2600:9000:27a4:7200:13:9e71:75c0:21',
      '2600:9000:27a4:2600:13:9e71:75c0:21',
    ],
    [
      '2600:9000:27a4:ec00:13:9e71:75c0:21',
      '2600:9000:27a4:c00:13:9e71:75c0:21',
    ],
    [
      '2600:9000:27a4:de00:13:9e71:75c0:21',
      '2600:9000:27a4:9a00:13:9e71:75c0:21',
    ],
  ]
  const ALIAS_AAAA = {
    nome: 'lotusotec.cl.',
    tipo: 'AAAA',
    valores: ['dhpoztt69jydz.cloudfront.net'],
    alias: true,
  }
  const COMUM = {
    nome: 'app.lotusotec.cl.',
    tipo: 'A',
    valores: ['18.230.53.197'],
  }

  it('borda é resposta não vazia e sem o WordPress daquele tipo', () => {
    expect(respondeComoBorda('A', ['3.166.160.79'])).toBe(true)
    expect(respondeComoBorda('A', [])).toBe(false)
    expect(respondeComoBorda('A', ['3.166.160.79', WORDPRESS.A])).toBe(false)
    expect(respondeComoBorda('AAAA', [WORDPRESS.AAAA.toUpperCase()])).toBe(
      false,
    )
  })

  it('alias com IPv6 diferente em cada nameserver confere, com a união na coluna', () => {
    const lado = respostaDosNameservers(ALIAS_AAAA, AAAA_POR_NAMESERVER)
    expect(lado).toHaveLength(8)
    expect(
      linhaConfere(ALIAS_AAAA, lado, AAAA_POR_NAMESERVER[0] ?? [], false),
    ).toBe(true)
  })

  it('alias com um nameserver vazio ou no WordPress mostra essa resposta e reprova', () => {
    const vazio = [...AAAA_POR_NAMESERVER.slice(0, 3), []]
    expect(respostaDosNameservers(ALIAS_AAAA, vazio)).toEqual([])
    const noWordPress = [[WORDPRESS.AAAA], ...AAAA_POR_NAMESERVER.slice(1)]
    const lado = respostaDosNameservers(ALIAS_AAAA, noWordPress)
    expect(lado).toEqual([WORDPRESS.AAAA])
    expect(
      linhaConfere(ALIAS_AAAA, lado, AAAA_POR_NAMESERVER[1] ?? [], false),
    ).toBe(false)
  })

  it('registro comum com nameservers discordando continua lançando', () => {
    expect(() =>
      respostaDosNameservers(COMUM, [['18.230.53.197'], ['18.230.53.198']]),
    ).toThrow('os nameservers da AWS discordam entre si em A app.lotusotec.cl.')
    expect(
      respostaDosNameservers(COMUM, [['18.230.53.197'], ['18.230.53.197']]),
    ).toEqual(['18.230.53.197'])
  })

  it('linha comum confere quando inventário, AWS e servido batem', () => {
    expect(
      linhaConfere(COMUM, ['18.230.53.197'], ['18.230.53.197'], false),
    ).toBe(true)
    expect(linhaConfere(COMUM, ['18.230.53.197'], [], false)).toBe(false)
  })

  it('alias com o lado servido ainda no WordPress não confere', () => {
    // Resolvedor público com o registro de antes em cache.
    expect(
      linhaConfere(
        ALIAS_AAAA,
        AAAA_POR_NAMESERVER[0] ?? [],
        [WORDPRESS.AAAA],
        false,
      ),
    ).toBe(false)
  })

  it('alias lido pela API compara o DNSName, com ou sem ponto e sem caixa', () => {
    const servido = AAAA_POR_NAMESERVER[2] ?? []
    expect(
      linhaConfere(
        ALIAS_AAAA,
        ['dhpoztt69jydz.cloudfront.net.'],
        servido,
        true,
      ),
    ).toBe(true)
    expect(
      linhaConfere(ALIAS_AAAA, ['DHPOZTT69JYDZ.cloudfront.net'], servido, true),
    ).toBe(true)
    expect(
      linhaConfere(
        ALIAS_AAAA,
        ['d111111abcdef8.cloudfront.net.'],
        servido,
        true,
      ),
    ).toBe(false)
  })

  it('valoresDaApi lê o DNSName do alias e os ResourceRecords do resto', () => {
    expect(
      valoresDaApi({
        AliasTarget: { DNSName: 'dhpoztt69jydz.cloudfront.net.' },
      }),
    ).toEqual(['dhpoztt69jydz.cloudfront.net.'])
    expect(
      valoresDaApi({ ResourceRecords: [{ Value: '18.230.53.197' }] }),
    ).toEqual(['18.230.53.197'])
    expect(valoresDaApi({})).toEqual([])
  })

  it('alias fora de A e AAAA é erro de quem escreveu o inventário', () => {
    expect(() =>
      linhaConfere({ ...ALIAS_AAAA, tipo: 'CNAME' }, [], [], false),
    ).toThrow('alias para o CloudFront só existe em A e AAAA: CNAME')
  })
})
