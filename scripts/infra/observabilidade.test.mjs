import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  CAMPOS_DO_LOG,
  CONSULTAS,
  FILTRO_DO_HEALTH_CHECK,
  conferirCampos,
  conferirObservabilidade,
} from './lib/observabilidade.mjs'

describe('comparação por subconjunto', () => {
  it('reprova folha diferente, item a menos e mapa no lugar errado, com o caminho', () => {
    /** @type {string[]} */
    const problemas = []
    conferirCampos(
      'R',
      { A: 'x', L: ['1', '2'], M: { B: 'y' } },
      { A: 'z', L: ['1'], M: 'texto', Extra: 'ignorada' },
      problemas,
    )
    expect(problemas).toEqual([
      'R.A: esperado x, veio z',
      'R.L: esperado ["1","2"], veio ["1"]',
      'R.M: esperado um mapa, veio texto',
    ])
  })

  it('campo ausente aparece como ausente', () => {
    /** @type {string[]} */
    const problemas = []
    conferirCampos('R', { A: 'x' }, {}, problemas)
    expect(problemas).toEqual(['R.A: esperado x, veio ausente'])
  })
})

// Caminhos a partir da raiz do repositório, como `zona.test.mjs`: sob o
// Vitest, `import.meta.url` não é URL de esquema `file:`.
const OBSERVABILIDADE = readFileSync('infra/lotus-observabilidade.yaml', 'utf8')
const SITE = readFileSync('infra/lotus-site.yaml', 'utf8')

describe('catraca: infra/lotus-observabilidade.yaml ≡ spec §4.3', () => {
  it('passa no template real', () => {
    expect(conferirObservabilidade(OBSERVABILIDADE, SITE)).toEqual([])
  })

  it('o template declara as quatro consultas e os doze campos de D8', () => {
    for (const nome of Object.values(CONSULTAS)) {
      expect(OBSERVABILIDADE).toContain(`Name: ${nome}\n`)
    }
    expect(CAMPOS_DO_LOG).toHaveLength(12)
    expect(
      OBSERVABILIDADE.split(FILTRO_DO_HEALTH_CHECK).length - 1,
    ).toBeGreaterThanOrEqual(4)
  })

  // Um campo trocado de cada vez; cada um reprova com o nome dele.
  it.each([
    {
      caso: 'expressão do 5xx',
      de: 'Expression: m1 * m2 / 100',
      para: 'Expression: m2',
      mensagem:
        'Alarme5xx.Properties.Metrics[2].Expression: esperado m1 * m2 / 100, veio m2',
    },
    {
      caso: 'estatística da taxa',
      de: '            Stat: Average\n',
      para: '            Stat: Maximum\n',
      mensagem:
        'Alarme5xx.Properties.Metrics[1].MetricStat.Stat: esperado Average, veio Maximum',
    },
    {
      caso: 'período da contagem',
      de: '            Period: 60\n            Stat: Sum\n',
      para: '            Period: 300\n            Stat: Sum\n',
      mensagem:
        'Alarme5xx.Properties.Metrics[0].MetricStat.Period: esperado 60, veio 300',
    },
    {
      caso: 'região da métrica do 5xx',
      de: '                  Value: Global\n            Period: 60\n            Stat: Sum\n',
      para: '                  Value: us-east-1\n            Period: 60\n            Stat: Sum\n',
      mensagem:
        'Alarme5xx.Properties.Metrics[0].MetricStat.Metric.Dimensions[1].Value: esperado Global, veio us-east-1',
    },
    {
      caso: 'limiar do 5xx',
      de: 'Threshold: 0.5\n',
      para: 'Threshold: 1\n',
      mensagem: 'Alarme5xx.Properties.Threshold: esperado 0.5, veio 1',
    },
    {
      caso: 'comparação do 5xx',
      de: 'ComparisonOperator: GreaterThanThreshold\n',
      para: 'ComparisonOperator: GreaterThanOrEqualToThreshold\n',
      mensagem:
        'Alarme5xx.Properties.ComparisonOperator: esperado GreaterThanThreshold, veio GreaterThanOrEqualToThreshold',
    },
    {
      caso: 'dado ausente no 5xx',
      de: 'TreatMissingData: notBreaching\n',
      para: 'TreatMissingData: missing\n',
      mensagem:
        'Alarme5xx.Properties.TreatMissingData: esperado notBreaching, veio missing',
    },
    {
      caso: 'OKActions do 5xx',
      de: '      TreatMissingData: notBreaching\n      AlarmActions:\n        - !Ref Topico\n      OKActions:\n        - !Ref Topico\n',
      para: '      TreatMissingData: notBreaching\n      AlarmActions:\n        - !Ref Topico\n',
      mensagem:
        'Alarme5xx.Properties.OKActions: esperado ["!Ref Topico"], veio ausente',
    },
    {
      caso: 'métrica da saúde',
      de: 'MetricName: HealthCheckStatus\n',
      para: 'MetricName: HealthCheckPercentageHealthy\n',
      mensagem:
        'AlarmeDeSaude.Properties.MetricName: esperado HealthCheckStatus, veio HealthCheckPercentageHealthy',
    },
    {
      caso: 'limiar da saúde',
      de: '      Threshold: 1\n',
      para: '      Threshold: 0\n',
      mensagem: 'AlarmeDeSaude.Properties.Threshold: esperado 1, veio 0',
    },
    {
      caso: 'dado ausente na saúde',
      de: 'TreatMissingData: breaching\n',
      para: 'TreatMissingData: notBreaching\n',
      mensagem:
        'AlarmeDeSaude.Properties.TreatMissingData: esperado breaching, veio notBreaching',
    },
    {
      caso: 'AlarmActions da saúde',
      de: '      TreatMissingData: breaching\n      AlarmActions:\n        - !Ref Topico\n',
      para: '      TreatMissingData: breaching\n      AlarmActions:\n        - arn:aws:sns:sa-east-1:760144413534:lotus-alertas\n',
      mensagem:
        'AlarmeDeSaude.Properties.AlarmActions[0]: esperado !Ref Topico, veio arn:aws:sns:sa-east-1:760144413534:lotus-alertas',
    },
    {
      caso: 'health check sem HTTPS',
      de: 'Type: HTTPS\n',
      para: 'Type: HTTP\n',
      mensagem:
        'SaudeDoSite.Properties.HealthCheckConfig.Type: esperado HTTPS, veio HTTP',
    },
    {
      caso: 'porta do health check',
      de: 'Port: 443\n',
      para: 'Port: 80\n',
      mensagem:
        'SaudeDoSite.Properties.HealthCheckConfig.Port: esperado 443, veio 80',
    },
    {
      caso: 'health check sem SNI',
      de: 'EnableSNI: true\n',
      para: 'EnableSNI: false\n',
      mensagem:
        'SaudeDoSite.Properties.HealthCheckConfig.EnableSNI: esperado true, veio false',
    },
    {
      caso: 'limiar de falha do health check',
      de: 'FailureThreshold: 3\n',
      para: 'FailureThreshold: 5\n',
      mensagem:
        'SaudeDoSite.Properties.HealthCheckConfig.FailureThreshold: esperado 3, veio 5',
    },
    {
      caso: 'intervalo do health check',
      de: 'RequestInterval: 30\n',
      para: 'RequestInterval: 10\n',
      mensagem:
        'SaudeDoSite.Properties.HealthCheckConfig.RequestInterval: esperado 30, veio 10',
    },
    {
      caso: 'health check sem sa-east-1',
      de: '          - sa-east-1\n',
      para: '          - eu-west-1\n',
      mensagem:
        'SaudeDoSite.Properties.HealthCheckConfig.Regions: esperado sa-east-1 entre pelo menos três',
    },
    {
      caso: 'caminho da sonda esquecido na prova',
      de: '    Default: /\n',
      para: '    Default: /prova-b6-inexistente\n',
      mensagem:
        'Parameters.CaminhoDaSonda.Default: esperado /, veio /prova-b6-inexistente',
    },
    {
      caso: 'retenção do log',
      de: 'RetentionInDays: 90\n',
      para: 'RetentionInDays: 30\n',
      mensagem: 'Acessos.Properties.RetentionInDays: esperado 90, veio 30',
    },
    {
      caso: 'log group com barra',
      de: 'LogGroupName: lotus-site-acessos\n',
      para: 'LogGroupName: /lotus-site/acessos\n',
      mensagem:
        'Acessos.Properties.LogGroupName: o guia do CloudFront pede [\\w-] no nome do log group, veio /lotus-site/acessos',
    },
    {
      caso: 'IP do visitante no log',
      de: '        - cache-behavior-path-pattern\n',
      para: '        - cache-behavior-path-pattern\n        - c-ip\n',
      mensagem:
        'EntregaDoLog.Properties.RecordFields: c-ip é dado pessoal (D8)',
    },
    {
      caso: 'cookie no lugar de um campo',
      de: '        - cs(User-Agent)\n',
      para: '        - cs(Cookie)\n',
      mensagem:
        'EntregaDoLog.Properties.RecordFields: cs(Cookie) é dado pessoal (D8)',
    },
    {
      caso: 'RecordFields ausente',
      de: '      RecordFields:\n',
      para: '      SemCampos:\n',
      mensagem:
        'EntregaDoLog.Properties.RecordFields: ausente; a lista padrão traz c-ip e cs(Cookie) (D8)',
    },
    {
      caso: 'destino com o ARN do !GetAtt',
      de: "      DestinationResourceArn: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${Acessos}'\n",
      para: '      DestinationResourceArn: !GetAtt Acessos.Arn\n',
      mensagem:
        "DestinoDoLog.Properties.DestinationResourceArn: esperado !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${Acessos}', veio !GetAtt Acessos.Arn",
    },
    {
      caso: 'origem do log renomeada',
      de: 'Name: lotus-site-acessos-origem\n',
      para: 'Name: lotus-site-origem\n',
      mensagem:
        'OrigemDoLog.Properties.Name: esperado lotus-site-acessos-origem, veio lotus-site-origem',
    },
    {
      caso: 'formato do log',
      de: 'OutputFormat: json\n',
      para: 'OutputFormat: plain\n',
      mensagem:
        'DestinoDoLog.Properties.OutputFormat: esperado json, veio plain',
    },
    {
      caso: 'consulta sem o filtro do health check',
      de: `${FILTRO_DO_HEALTH_CHECK}\n        | filter \`sc-status\``,
      para: 'filter `sc-status`',
      mensagem:
        'Consulta5xx.Properties.QueryString: não abre com o filtro do health check (D9)',
    },
    {
      caso: 'filtro do health check fora da primeira linha',
      de: `QueryString: |-\n        ${FILTRO_DO_HEALTH_CHECK}\n        | filter \`sc-status\` like /^5/\n`,
      para: `QueryString: |-\n        filter \`sc-status\` like /^5/\n        | ${FILTRO_DO_HEALTH_CHECK}\n`,
      mensagem:
        'Consulta5xx.Properties.QueryString: não abre com o filtro do health check (D9)',
    },
    {
      caso: 'consulta com outro nome',
      de: 'Name: lotus-site/cache-do-index\n',
      para: 'Name: cache\n',
      mensagem:
        'ConsultaCache.Properties.Name: esperado lotus-site/cache-do-index, veio cache',
    },
    {
      caso: 'ação além de sns:Publish',
      de: 'Action: sns:Publish\n',
      para: 'Action: sns:*\n',
      mensagem:
        'PapelDeAlerta.Policies[0].Statement[0].Action: ação além de sns:Publish: sns:*',
    },
    {
      caso: 'recurso além do tópico',
      de: '                Resource: !Ref Topico\n',
      para: "                Resource: '*'\n",
      mensagem:
        'PapelDeAlerta.Policies[0].Statement[0].Resource: recurso além do tópico: *',
    },
    {
      caso: 'policy gerenciada na role de alerta',
      de: '      Policies:\n        - PolicyName: publicar-no-topico-de-alerta\n',
      para: '      ManagedPolicyArns:\n        - arn:aws:iam::aws:policy/AdministratorAccess\n      Policies:\n        - PolicyName: publicar-no-topico-de-alerta\n',
      mensagem:
        'PapelDeAlerta.Properties.ManagedPolicyArns: a role só publica no tópico (D10)',
    },
    {
      caso: 'trust com curinga',
      de: "                  - !Sub 'repo:${RepositorioDeDeploy}:ref:refs/heads/main'\n",
      para: "                  - !Sub 'repo:${RepositorioDeDeploy}:ref:refs/heads/*'\n",
      mensagem:
        'PapelDeAlerta.Properties.AssumeRolePolicyDocument: difere da trust de PapelDeDeploy em infra/lotus-site.yaml (D10)',
    },
    {
      caso: 'repositório divergente do lotus-site',
      de: '    Default: Gatika-CL/lotus-site\n',
      para: '    Default: Andred21/lotus-site\n',
      mensagem:
        'Parameters.RepositorioDeDeploy.Default: lotus-site tem Gatika-CL/lotus-site, aqui veio Andred21/lotus-site (D10)',
    },
    {
      caso: 'tópico com SSE',
      de: '      TopicName: lotus-site-alertas\n',
      para: '      TopicName: lotus-site-alertas\n      KmsMasterKeyId: alias/aws/sns\n',
      mensagem:
        'Topico.Properties.KmsMasterKeyId: com SSE o CloudWatch não publica (D11)',
    },
    {
      caso: 'e-mail no repositório',
      de: '  EmailDeAlerta:\n    Type: String\n',
      para: '  EmailDeAlerta:\n    Type: String\n    Default: alguem@exemplo.cl\n',
      mensagem:
        'Parameters.EmailDeAlerta.Default: o endereço não entra no repositório (D2)',
    },
    {
      caso: 'outra distribuição',
      de: '    Default: E1R7SPH4OLUIEQ\n',
      para: '    Default: EXXXXXXXXXXXXX\n',
      mensagem:
        'Parameters.IdDaDistribuicao.Default: esperado E1R7SPH4OLUIEQ, veio EXXXXXXXXXXXXX',
    },
    {
      caso: 'recurso sem a tag do projeto',
      de: '      OutputFormat: json\n      Tags:\n        - Key: Projeto\n          Value: lotus-site\n',
      para: '      OutputFormat: json\n',
      mensagem: 'DestinoDoLog.Properties.Tags: sem Projeto: lotus-site',
    },
    {
      caso: 'output que o runbook lê',
      de: '    Value: !GetAtt PapelDeAlerta.Arn\n',
      para: '    Value: !Ref PapelDeAlerta\n',
      mensagem:
        'Outputs.ArnDoPapelDeAlerta.Value: esperado !GetAtt PapelDeAlerta.Arn, veio !Ref PapelDeAlerta',
    },
  ])('$caso reprova com o nome do campo', ({ de, para, mensagem }) => {
    // Uma vez só: com o trecho repetido, a troca podia cair em outro recurso.
    expect(OBSERVABILIDADE.split(de)).toHaveLength(2)
    const problemas = conferirObservabilidade(
      OBSERVABILIDADE.replace(de, para),
      SITE,
    )
    expect(problemas.join('\n')).toContain(mensagem)
  })

  it('recurso que some vira problema com o nome, não exceção', () => {
    const semAssinatura = OBSERVABILIDADE.replace(
      /\n  Assinatura:\n(?: {4}.*\n)+/,
      '\n',
    )
    expect(semAssinatura).not.toContain('Assinatura:')
    expect(conferirObservabilidade(semAssinatura, SITE)).toContain(
      'Assinatura: esperado um mapa, veio ausente',
    )
  })

  it('uma quinta consulta sem o filtro do health check também reprova', () => {
    const quinta = OBSERVABILIDADE.replace(
      '\nOutputs:\n',
      `
  ConsultaExtra:
    Type: AWS::Logs::QueryDefinition
    Properties:
      Name: lotus-site/extra
      LogGroupNames:
        - !Ref Acessos
      QueryString: |-
        stats count(*) by \`sc-status\`

Outputs:
`,
    )
    expect(conferirObservabilidade(quinta, SITE)).toContain(
      `ConsultaExtra.Properties.QueryString: não abre com o filtro do health check (D9): ${FILTRO_DO_HEALTH_CHECK}`,
    )
  })

  it('trust do lotus-site mudando sozinha também reprova', () => {
    const outraTrust = SITE.replace(
      'token.actions.githubusercontent.com:aud: sts.amazonaws.com',
      'token.actions.githubusercontent.com:aud: outra-audiencia',
    )
    expect(conferirObservabilidade(OBSERVABILIDADE, outraTrust)).toContain(
      'PapelDeAlerta.Properties.AssumeRolePolicyDocument: difere da trust de PapelDeDeploy em infra/lotus-site.yaml (D10)',
    )
  })
})
