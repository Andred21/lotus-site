import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  INVENTARIO,
  NOME_DO_ENSAIO,
  TTL_DO_CORTE,
  WORDPRESS,
  conferirLoteDeRollback,
  convergiu,
  delegacaoEsperada,
  eDoCorte,
  lerParametros,
  lerPoliticasDaZona,
  lerPoliticasDoRecurso,
  lerRegistros,
  linhaConfere,
  mesmoConjunto,
  normalizar,
  respondeComoBorda,
  respostaDosNameservers,
  resolver,
  valoresDaApi,
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
    expect(parametros.get('TtlDoCorte')).toBe(String(TTL_DO_CORTE))
    // Os tres tokens DKIM sao Default de parametro, como os IPs: sem Default
    // `resolver` lanca e a catraca nao consegue ler os CNAME.
    for (const nome of ['TokenDkim1', 'TokenDkim2', 'TokenDkim3']) {
      expect(parametros.get(nome)).toMatch(/^[a-z0-9]{20,64}$/)
    }
    expect(parametros.get('IpDaIntranet')).toBe('18.230.53.197')
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
      expect(Boolean(achado?.alias)).toBe(Boolean(esperado.alias))
    })
  }

  it('mantém os cinco MX do Google, com as prioridades medidas', () => {
    const mx = registros.find(
      (registro) => registro.tipo === 'MX' && registro.nome === 'lotusotec.cl.',
    )
    const doInventario = INVENTARIO.find(
      (registro) => registro.tipo === 'MX' && registro.nome === 'lotusotec.cl.',
    )
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

  it('só ensaio-corte pode ser alias para o CloudFront; apex e www, nunca', () => {
    // Apontar apex e www é B5. O ensaio de B4 (spec §4.4) usa um nome
    // descartável, que nasce e morre dentro do bloco.
    const aliases = registros
      .filter((registro) => registro.alias)
      .map((registro) => registro.nome)
    expect(aliases.filter((nome) => nome !== NOME_DO_ENSAIO)).toEqual([])
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

  it('sistema saiu da zona e do inventário (7.2.5, spec D2)', () => {
    // O nome da intranet é app desde 2026-09-27; sistema só apontava para o
    // WordPress. Ele sai antes do corte, para o rollback mexer só em apex e
    // www, como no ensaio de B4.
    /** @param {{ nome: string }} registro */
    const sistema = (registro) => registro.nome === 'sistema.lotusotec.cl.'
    expect(registros.filter(sistema)).toEqual([])
    expect(INVENTARIO.filter(sistema)).toEqual([])
  })

  it('app tem A para o EIP da intranet e NÃO tem AAAA — o EIP não tem IPv6', () => {
    const app = registros.filter(
      (registro) => registro.nome === 'app.lotusotec.cl.',
    )
    expect(app.map((registro) => registro.tipo)).toEqual(['A'])
    expect(app[0]?.valores).toEqual(['18.230.53.197'])
  })

  it('usa 3600 em todo registro comum, e TTL_DO_CORTE em apex e www (7.2.5, spec D3)', () => {
    // Comparado contra o INVENTARIO, e nao contra o proprio `registros`: com
    // os dois lados derivados da mesma lista, uma leitura vazia passaria.
    // Alias não tem TTL: a AWS fixa em 60 s (spec D12 de B4).
    const comuns = INVENTARIO.filter((registro) => !registro.alias)
    expect(registros.filter((registro) => !registro.alias)).toHaveLength(
      comuns.length,
    )
    for (const esperado of comuns) {
      const achado = registros.find(
        (registro) =>
          registro.nome === esperado.nome && registro.tipo === esperado.tipo,
      )
      expect(achado?.ttl, `TTL de ${esperado.tipo} ${esperado.nome}`).toBe(
        eDoCorte(esperado) ? TTL_DO_CORTE : 3600,
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

describe('convergiu (medir-propagacao, spec §4.4)', () => {
  const wp = { A: [WORDPRESS.A], AAAA: [WORDPRESS.AAAA] }
  const cf = { A: ['3.166.165.48', '3.166.165.9'], AAAA: ['2600:9000:2::1'] }

  it('wordpress exige exatamente o A e o AAAA do apex', () => {
    expect(convergiu('wordpress', wp)).toBe(true)
    expect(convergiu('wordpress', cf)).toBe(false)
    expect(convergiu('wordpress', { A: wp.A, AAAA: [] })).toBe(false)
  })

  it('cloudfront exige resposta nos dois tipos e nenhuma delas do WordPress', () => {
    expect(convergiu('cloudfront', cf)).toBe(true)
    expect(convergiu('cloudfront', { A: cf.A, AAAA: [] })).toBe(false)
  })

  it('convergência parcial não é convergência', () => {
    // Resolvedor que já trocou o A mas ainda serve o AAAA antigo, ou o
    // contrário: o visitante dual-stack ainda pode cair no lado errado.
    expect(convergiu('cloudfront', { A: cf.A, AAAA: wp.AAAA })).toBe(false)
    expect(convergiu('wordpress', { A: cf.A, AAAA: wp.AAAA })).toBe(false)
  })

  it('ausente exige silêncio nos dois tipos', () => {
    expect(convergiu('ausente', { A: [], AAAA: [] })).toBe(true)
    expect(convergiu('ausente', { A: [], AAAA: wp.AAAA })).toBe(false)
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

describe('infra/rollback-corte.json (caminho B do rollback, spec D3 de 7.2.5)', () => {
  /** @typedef {import('./lib/zona.mjs').MudancaDeRegistro} Mudanca */
  /** @type {{ Comment: string, Changes: Mudanca[] }} */
  const lote = JSON.parse(readFileSync('infra/rollback-corte.json', 'utf8'))
  /** @param {(mudanca: Mudanca) => Mudanca} mexer */
  const mexido = (mexer) => ({ ...lote, Changes: lote.Changes.map(mexer) })

  it('devolve apex e www, A e AAAA, ao WordPress por UPSERT, com TTL_DO_CORTE', () => {
    expect(conferirLoteDeRollback(lote)).toEqual([])
  })

  it('TTL diferente de TTL_DO_CORTE reprova com o nome do campo', () => {
    // Com 3600 contra um template de 60, a reconciliação do §5 de
    // rollback-corte.md seria caso não ensaiado (spec D3).
    const problemas = conferirLoteDeRollback(
      mexido((m) => ({
        ...m,
        ResourceRecordSet: { ...m.ResourceRecordSet, TTL: 3600 },
      })),
    )
    expect(problemas).toHaveLength(4)
    expect(problemas).toContain(
      'TTL de A lotusotec.cl.: esperado 60, veio 3600',
    )
  })

  it('outro nome, registro faltando, valor ou ação errados reprovam', () => {
    const comApp = mexido((m) =>
      m.ResourceRecordSet.Name === 'www.lotusotec.cl.' &&
      m.ResourceRecordSet.Type === 'A'
        ? {
            ...m,
            ResourceRecordSet: {
              ...m.ResourceRecordSet,
              Name: 'app.lotusotec.cl.',
            },
          }
        : m,
    )
    expect(conferirLoteDeRollback(comApp)).toEqual([
      'Changes: A app.lotusotec.cl. fora de apex e www, A e AAAA',
      'Changes: falta A www.lotusotec.cl.',
    ])
    const outroIp = mexido((m) =>
      m.ResourceRecordSet.Type === 'A'
        ? {
            ...m,
            ResourceRecordSet: {
              ...m.ResourceRecordSet,
              ResourceRecords: [{ Value: '18.230.53.197' }],
            },
          }
        : m,
    )
    expect(conferirLoteDeRollback(outroIp)).toContain(
      'ResourceRecords de A lotusotec.cl.: esperado 185.146.167.195, veio ["18.230.53.197"]',
    )
    const apagar = mexido((m) => ({ ...m, Action: 'DELETE' }))
    expect(conferirLoteDeRollback(apagar)).toContain(
      'Action de AAAA www.lotusotec.cl.: esperado UPSERT, veio DELETE',
    )
    const repetido = {
      ...lote,
      Changes: [...lote.Changes, ...lote.Changes.slice(0, 1)],
    }
    expect(conferirLoteDeRollback(repetido)).toEqual([
      'Changes: A lotusotec.cl. repetido',
    ])
  })
})
