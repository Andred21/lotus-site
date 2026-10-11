// A forma que `infra/lotus-observabilidade.yaml` precisa ter (bloco `B6`,
// spec `docs/superpowers/specs/2026-10-05-7.2.6-observabilidade-minima-design.md`
// §4.3), conferida sobre a árvore que `yaml.mjs` lê. Cada regra devolve um
// problema com o caminho do campo e os dois valores; vazio é template na forma.
// Os valores esperados são texto, como o leitor os devolve (`'60'`, `'true'`).
import { lerYaml, mapa } from './yaml.mjs'

/** @typedef {import('./yaml.mjs').Valor} Valor */
/** @typedef {import('./yaml.mjs').Mapa} Mapa */

export const TOPICO = '!Ref Topico'
export const ID_DA_DISTRIBUICAO = 'E1R7SPH4OLUIEQ'

/** Os doze campos de D8, na ordem do template. */
export const CAMPOS_DO_LOG = Object.freeze([
  'date',
  'time',
  'x-edge-location',
  'c-country',
  'cs-method',
  'cs-uri-stem',
  'sc-status',
  'x-edge-result-type',
  'time-taken',
  'time-to-first-byte',
  'cs(User-Agent)',
  'cache-behavior-path-pattern',
])

/** Dado pessoal que nenhuma consulta lê (D8). */
export const CAMPOS_PROIBIDOS = Object.freeze([
  'c-ip',
  'x-forwarded-for',
  'cs(Cookie)',
])

/**
 * A primeira linha de toda consulta salva (D9). A expressão pega o
 * user-agent documentado, `Amazon-Route53-Health-Check-Service`, e as
 * variantes com espaço ou `%20`.
 */
export const FILTRO_DO_HEALTH_CHECK =
  'filter `cs(User-Agent)` not like /Amazon.{0,3}Route.{0,3}53.{0,3}Health/'

/** Recurso lógico → nome da consulta salva (D9). */
export const CONSULTAS = Object.freeze({
  Consulta5xx: 'lotus-site/5xx-por-caminho',
  ConsultaLatencia: 'lotus-site/latencia-por-borda',
  ConsultaCache: 'lotus-site/cache-do-index',
  ConsultaReleases: 'lotus-site/acessos-a-releases',
})

/**
 * Tipo que aceita tag → propriedade onde a tag mora (spec §4.1).
 * @type {Readonly<Record<string, string>>}
 */
const TAGS_POR_TIPO = Object.freeze({
  'AWS::SNS::Topic': 'Tags',
  'AWS::Route53::HealthCheck': 'HealthCheckTags',
  'AWS::CloudWatch::Alarm': 'Tags',
  'AWS::Logs::LogGroup': 'Tags',
  'AWS::Logs::DeliverySource': 'Tags',
  'AWS::Logs::DeliveryDestination': 'Tags',
  'AWS::Logs::Delivery': 'Tags',
  'AWS::IAM::Role': 'Tags',
})

const DIMENSOES_DA_DISTRIBUICAO = [
  { Name: 'DistributionId', Value: '!Ref IdDaDistribuicao' },
  { Name: 'Region', Value: 'Global' },
]

/**
 * `m1` conta pedidos, `m2` é a taxa de 5xx em %, `e1` é a contagem (D5).
 * @type {Valor[]}
 */
const METRICAS_DO_5XX = [
  {
    Id: 'm1',
    MetricStat: {
      Metric: {
        Namespace: 'AWS/CloudFront',
        MetricName: 'Requests',
        Dimensions: DIMENSOES_DA_DISTRIBUICAO,
      },
      Period: '60',
      Stat: 'Sum',
    },
    ReturnData: 'false',
  },
  {
    Id: 'm2',
    MetricStat: {
      Metric: {
        Namespace: 'AWS/CloudFront',
        MetricName: '5xxErrorRate',
        Dimensions: DIMENSOES_DA_DISTRIBUICAO,
      },
      Period: '60',
      Stat: 'Average',
    },
    ReturnData: 'false',
  },
  { Id: 'e1', Expression: 'm1 * m2 / 100', ReturnData: 'true' },
]

/**
 * O subconjunto que cada recurso precisa ter. Chave a mais no template não
 * reprova aqui (nomes, descrições, tags); as regras de "nada além disso"
 * estão em `conferirObservabilidade`.
 * @type {Readonly<Record<string, Valor>>}
 */
export const RECURSOS_ESPERADOS = Object.freeze({
  Topico: {
    Type: 'AWS::SNS::Topic',
    Properties: { TopicName: 'lotus-site-alertas' },
  },
  Assinatura: {
    Type: 'AWS::SNS::Subscription',
    Properties: {
      TopicArn: TOPICO,
      Protocol: 'email',
      Endpoint: '!Ref EmailDeAlerta',
    },
  },
  SaudeDoSite: {
    Type: 'AWS::Route53::HealthCheck',
    Properties: {
      HealthCheckConfig: {
        Type: 'HTTPS',
        FullyQualifiedDomainName: '!Ref Dominio',
        Port: '443',
        ResourcePath: '!Ref CaminhoDaSonda',
        EnableSNI: 'true',
        RequestInterval: '30',
        FailureThreshold: '3',
      },
    },
  },
  AlarmeDeSaude: {
    Type: 'AWS::CloudWatch::Alarm',
    Properties: {
      Namespace: 'AWS/Route53',
      MetricName: 'HealthCheckStatus',
      Dimensions: [{ Name: 'HealthCheckId', Value: '!Ref SaudeDoSite' }],
      Statistic: 'Minimum',
      Period: '60',
      EvaluationPeriods: '1',
      DatapointsToAlarm: '1',
      Threshold: '1',
      ComparisonOperator: 'LessThanThreshold',
      TreatMissingData: 'breaching',
      AlarmActions: [TOPICO],
      OKActions: [TOPICO],
    },
  },
  Alarme5xx: {
    Type: 'AWS::CloudWatch::Alarm',
    Properties: {
      Metrics: METRICAS_DO_5XX,
      EvaluationPeriods: '1',
      DatapointsToAlarm: '1',
      Threshold: '0.5',
      ComparisonOperator: 'GreaterThanThreshold',
      TreatMissingData: 'notBreaching',
      AlarmActions: [TOPICO],
      OKActions: [TOPICO],
    },
  },
  Acessos: {
    Type: 'AWS::Logs::LogGroup',
    Properties: { LogGroupName: 'lotus-site-acessos', RetentionInDays: '90' },
  },
  OrigemDoLog: {
    Type: 'AWS::Logs::DeliverySource',
    Properties: {
      Name: 'lotus-site-acessos-origem',
      ResourceArn:
        "!Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${IdDaDistribuicao}'",
      LogType: 'ACCESS_LOGS',
    },
  },
  DestinoDoLog: {
    Type: 'AWS::Logs::DeliveryDestination',
    Properties: {
      Name: 'lotus-site-acessos-destino',
      DestinationResourceArn:
        "!Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${Acessos}'",
      OutputFormat: 'json',
    },
  },
  EntregaDoLog: {
    Type: 'AWS::Logs::Delivery',
    Properties: {
      DeliverySourceName: '!Ref OrigemDoLog',
      DeliveryDestinationArn: '!GetAtt DestinoDoLog.Arn',
      RecordFields: [...CAMPOS_DO_LOG],
    },
  },
  PapelDeAlerta: {
    Type: 'AWS::IAM::Role',
    Properties: { RoleName: 'lotus-site-alerta' },
  },
})

/** Default que cada parâmetro precisa ter (spec §4.1, D6 e D7). */
export const PADROES_ESPERADOS = Object.freeze({
  IdDaDistribuicao: ID_DA_DISTRIBUICAO,
  Dominio: 'lotusotec.cl',
  CaminhoDaSonda: '/',
})

/** Output → valor (spec §4.1); o runbook lê os quatro pelo nome. */
export const SAIDAS_ESPERADAS = Object.freeze({
  ArnDoTopico: TOPICO,
  ArnDoPapelDeAlerta: '!GetAtt PapelDeAlerta.Arn',
  NomeDoLogDeAcesso: '!Ref Acessos',
  IdDoHealthCheck: '!Ref SaudeDoSite',
})

/** @param {Valor | undefined} valor */
function descrever(valor) {
  if (valor === undefined) return 'ausente'
  return typeof valor === 'string' ? valor : JSON.stringify(valor)
}

/**
 * Compara `veio` com o subconjunto `esperado`, folha a folha. Lista compara o
 * tamanho e cada item; mapa compara só as chaves de `esperado`.
 * @param {string} caminho
 * @param {Valor} esperado
 * @param {Valor | undefined} veio
 * @param {string[]} problemas
 */
export function conferirCampos(caminho, esperado, veio, problemas) {
  if (typeof esperado === 'string') {
    if (veio !== esperado) {
      problemas.push(
        `${caminho}: esperado ${esperado}, veio ${descrever(veio)}`,
      )
    }
    return
  }
  if (Array.isArray(esperado)) {
    if (!Array.isArray(veio) || veio.length !== esperado.length) {
      problemas.push(
        `${caminho}: esperado ${JSON.stringify(esperado)}, veio ${descrever(veio)}`,
      )
      return
    }
    esperado.forEach((item, i) =>
      conferirCampos(`${caminho}[${i}]`, item, veio[i], problemas),
    )
    return
  }
  if (typeof veio !== 'object' || Array.isArray(veio)) {
    problemas.push(`${caminho}: esperado um mapa, veio ${descrever(veio)}`)
    return
  }
  for (const [chave, valor] of Object.entries(esperado)) {
    conferirCampos(`${caminho}.${chave}`, valor, veio[chave], problemas)
  }
}

/**
 * `Action` e `Resource` de IAM aceitam texto ou lista.
 * @param {Valor | undefined} valor
 * @returns {Valor[]}
 */
function emLista(valor) {
  if (valor === undefined) return []
  return Array.isArray(valor) ? valor : [valor]
}

/**
 * `Properties` do recurso, ou `{}` quando ele falta: a falta já sai como
 * problema na comparação com `RECURSOS_ESPERADOS`.
 * @param {Mapa} recursos
 * @param {string} nome
 * @returns {Mapa}
 */
function propriedades(recursos, nome) {
  const recurso = recursos[nome]
  if (typeof recurso !== 'object' || Array.isArray(recurso)) return {}
  const dentro = recurso.Properties
  return typeof dentro === 'object' && !Array.isArray(dentro) ? dentro : {}
}

/**
 * Defaults medidos e o e-mail fora do repositório (D2, D6, D7).
 * @param {Mapa} parametros
 * @param {string[]} problemas
 */
function conferirParametros(parametros, problemas) {
  for (const [nome, padrao] of Object.entries(PADROES_ESPERADOS)) {
    const veio = mapa(parametros[nome], `Parameters.${nome}`).Default
    if (veio !== padrao) {
      problemas.push(
        `Parameters.${nome}.Default: esperado ${padrao}, veio ${descrever(veio)}`,
      )
    }
  }
  if (mapa(parametros.EmailDeAlerta, 'Parameters.EmailDeAlerta').Default) {
    problemas.push(
      'Parameters.EmailDeAlerta.Default: o endereço não entra no repositório (D2)',
    )
  }
}

/**
 * O que a comparação por subconjunto não pega: tópico sem SSE (D11), regiões
 * do health check (D7), nome do log group e campos do log (D8).
 * @param {Mapa} recursos
 * @param {string[]} problemas
 */
function conferirRestricoes(recursos, problemas) {
  if (propriedades(recursos, 'Topico').KmsMasterKeyId !== undefined) {
    problemas.push(
      'Topico.Properties.KmsMasterKeyId: com SSE o CloudWatch não publica (D11)',
    )
  }
  const saude = propriedades(recursos, 'SaudeDoSite').HealthCheckConfig
  const regioes = emLista(
    typeof saude === 'object' && !Array.isArray(saude)
      ? saude.Regions
      : undefined,
  )
  if (!regioes.includes('sa-east-1') || regioes.length < 3) {
    problemas.push(
      `SaudeDoSite.Properties.HealthCheckConfig.Regions: esperado sa-east-1 entre pelo menos três, veio ${descrever(regioes)}`,
    )
  }
  const nomeDoGrupo = propriedades(recursos, 'Acessos').LogGroupName
  if (!/^[\w-]+$/.test(String(nomeDoGrupo))) {
    problemas.push(
      `Acessos.Properties.LogGroupName: o guia do CloudFront pede [\\w-] no nome do log group, veio ${descrever(nomeDoGrupo)}`,
    )
  }
  const campos = propriedades(recursos, 'EntregaDoLog').RecordFields
  if (campos === undefined) {
    problemas.push(
      'EntregaDoLog.Properties.RecordFields: ausente; a lista padrão traz c-ip e cs(Cookie) (D8)',
    )
  }
  for (const campo of emLista(campos)) {
    if (typeof campo === 'string' && CAMPOS_PROIBIDOS.includes(campo)) {
      problemas.push(
        `EntregaDoLog.Properties.RecordFields: ${campo} é dado pessoal (D8)`,
      )
    }
  }
}

/**
 * As quatro consultas de D9, e o filtro do health check abrindo toda consulta
 * do template, inclusive uma quinta que alguém acrescente.
 * @param {Mapa} recursos
 * @param {string[]} problemas
 */
function conferirConsultas(recursos, problemas) {
  for (const [nome, consulta] of Object.entries(CONSULTAS)) {
    conferirCampos(
      nome,
      {
        Type: 'AWS::Logs::QueryDefinition',
        Properties: { Name: consulta, LogGroupNames: ['!Ref Acessos'] },
      },
      recursos[nome],
      problemas,
    )
  }
  for (const [nome, recurso] of Object.entries(recursos)) {
    if (mapa(recurso, nome).Type !== 'AWS::Logs::QueryDefinition') continue
    // Primeira linha, e não só presente: depois do `stats`, o filtro olharia
    // a agregação e não tiraria nada.
    const texto = String(propriedades(recursos, nome).QueryString)
    if (!texto.startsWith(`${FILTRO_DO_HEALTH_CHECK}\n`)) {
      problemas.push(
        `${nome}.Properties.QueryString: não abre com o filtro do health check (D9): ${FILTRO_DO_HEALTH_CHECK}`,
      )
    }
  }
}

/**
 * A role de alerta: só `sns:Publish`, só no tópico, e a trust igual à da role
 * de deploy do `lotus-site`, com os mesmos `Default` de repositório (D10).
 * @param {Mapa} template
 * @param {Mapa} site
 * @param {string[]} problemas
 */
function conferirPapelDeAlerta(template, site, problemas) {
  const papel = propriedades(
    mapa(template.Resources, 'Resources'),
    'PapelDeAlerta',
  )
  for (const proibida of ['ManagedPolicyArns', 'PermissionsBoundary']) {
    if (papel[proibida] !== undefined) {
      problemas.push(
        `PapelDeAlerta.Properties.${proibida}: a role só publica no tópico (D10)`,
      )
    }
  }
  const politicas = emLista(papel.Policies)
  if (politicas.length === 0) {
    problemas.push('PapelDeAlerta.Properties.Policies: ausente')
  }
  politicas.forEach((politica, i) => {
    const onde = `PapelDeAlerta.Policies[${i}]`
    const documento = mapa(mapa(politica, onde).PolicyDocument, onde)
    emLista(documento.Statement).forEach((bruta, j) => {
      const declaracao = mapa(bruta, `${onde}.Statement[${j}]`)
      for (const aberta of ['NotAction', 'NotResource']) {
        if (declaracao[aberta] !== undefined) {
          problemas.push(
            `${onde}.Statement[${j}].${aberta}: abre tudo menos o listado`,
          )
        }
      }
      for (const acao of emLista(declaracao.Action)) {
        if (acao !== 'sns:Publish') {
          problemas.push(
            `${onde}.Statement[${j}].Action: ação além de sns:Publish: ${descrever(acao)}`,
          )
        }
      }
      for (const recurso of emLista(declaracao.Resource)) {
        if (recurso !== TOPICO) {
          problemas.push(
            `${onde}.Statement[${j}].Resource: recurso além do tópico: ${descrever(recurso)}`,
          )
        }
      }
    })
  })

  const deploy = propriedades(
    mapa(site.Resources, 'lotus-site Resources'),
    'PapelDeDeploy',
  )
  if (deploy.AssumeRolePolicyDocument === undefined) {
    throw new Error(
      'infra/lotus-site.yaml sem PapelDeDeploy.AssumeRolePolicyDocument',
    )
  }
  if (
    JSON.stringify(papel.AssumeRolePolicyDocument) !==
    JSON.stringify(deploy.AssumeRolePolicyDocument)
  ) {
    problemas.push(
      'PapelDeAlerta.Properties.AssumeRolePolicyDocument: difere da trust de PapelDeDeploy em infra/lotus-site.yaml (D10)',
    )
  }
  const aqui = mapa(template.Parameters, 'Parameters')
  const la = mapa(site.Parameters, 'lotus-site Parameters')
  for (const nome of ['RepositorioDeDeploy', 'RepositorioDeDeployImutavel']) {
    const deAqui = mapa(aqui[nome], `Parameters.${nome}`).Default
    const deLa = mapa(la[nome], `lotus-site Parameters.${nome}`).Default
    if (deAqui !== deLa) {
      problemas.push(
        `Parameters.${nome}.Default: lotus-site tem ${descrever(deLa)}, aqui veio ${descrever(deAqui)} (D10)`,
      )
    }
  }
}

/**
 * `Projeto: lotus-site` em todo recurso que aceita tag (spec §4.1).
 * @param {Mapa} recursos
 * @param {string[]} problemas
 */
function conferirTags(recursos, problemas) {
  for (const [nome, recurso] of Object.entries(recursos)) {
    const chave = TAGS_POR_TIPO[String(mapa(recurso, nome).Type)]
    if (!chave) continue
    const temProjeto = emLista(propriedades(recursos, nome)[chave]).some(
      (tag) => {
        const par = mapa(tag, `${nome}.Properties.${chave}`)
        return par.Key === 'Projeto' && par.Value === 'lotus-site'
      },
    )
    if (!temProjeto) {
      problemas.push(`${nome}.Properties.${chave}: sem Projeto: lotus-site`)
    }
  }
}

/**
 * Os quatro outputs que o runbook lê pelo nome (spec §4.1).
 * @param {Mapa} template
 * @param {string[]} problemas
 */
function conferirSaidas(template, problemas) {
  const saidas = mapa(template.Outputs, 'Outputs')
  for (const [nome, valor] of Object.entries(SAIDAS_ESPERADAS)) {
    const saida = saidas[nome]
    const veio =
      typeof saida === 'object' && !Array.isArray(saida)
        ? saida.Value
        : undefined
    if (veio !== valor) {
      problemas.push(
        `Outputs.${nome}.Value: esperado ${valor}, veio ${descrever(veio)}`,
      )
    }
  }
}

/**
 * A catraca inteira (spec §4.3): vazio quando o template está na forma; senão,
 * um problema por campo, com o caminho dele e os dois valores.
 * @param {string} textoObservabilidade conteúdo de `infra/lotus-observabilidade.yaml`
 * @param {string} textoSite conteúdo de `infra/lotus-site.yaml`
 * @returns {string[]}
 */
export function conferirObservabilidade(textoObservabilidade, textoSite) {
  /** @type {string[]} */
  const problemas = []
  const template = lerYaml(textoObservabilidade)
  const site = lerYaml(textoSite)
  const recursos = mapa(template.Resources, 'Resources')
  for (const [nome, esperado] of Object.entries(RECURSOS_ESPERADOS)) {
    conferirCampos(nome, esperado, recursos[nome], problemas)
  }
  conferirParametros(mapa(template.Parameters, 'Parameters'), problemas)
  conferirRestricoes(recursos, problemas)
  conferirConsultas(recursos, problemas)
  conferirPapelDeAlerta(template, site, problemas)
  conferirTags(recursos, problemas)
  conferirSaidas(template, problemas)
  return problemas
}
