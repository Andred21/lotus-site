// A forma que `Distribuicao` e `RedirecionarWww` de `infra/lotus-site.yaml`
// precisam ter para o domínio próprio (7.2.4, spec §4.2), e como ler isso de
// volta pela árvore de `template.mjs`: campo esperado ausente, ou campo
// desconhecido numa associação de função, quebra ruidosamente com o nome do
// campo. A função do redirect é extraída do template e executada em
// `node:vm`: o que a catraca prova é o código que vai para a borda, não uma
// cópia dele.
import vm from 'node:vm'
import {
  conferirChaves,
  escalar,
  lerTemplate,
  lista,
  recurso,
  resolver,
} from './template.mjs'
import { mapa } from './yaml.mjs'
import { mesmoConjunto } from './zona.mjs'

/** @typedef {import('./yaml.mjs').Mapa} Mapa */
/** @typedef {{ evento: string, arn: string }} Funcao */
/** @typedef {{ caminho: string, funcoes: Funcao[] }} Comportamento */
/**
 * @typedef {{ value: string, multiValue?: { value: string }[] }} ParametroDeQuery
 * @typedef {{ request: { method: string, uri: string, querystring: Record<string, ParametroDeQuery>, headers: Record<string, { value: string }>, cookies: Record<string, never> } }} Evento
 */

/** O que `ViewerCertificate` precisa dizer (spec §4.2). */
export const CERTIFICADO_ESPERADO = Object.freeze({
  AcmCertificateArn: '!Ref ArnDoCertificadoDoDominio',
  SslSupportMethod: 'sni-only',
  MinimumProtocolVersion: 'TLSv1.2_2021',
})
/**
 * Só `PriceClass_All` tem borda na América do Sul, e o visitante é chileno
 * (`D-39`, decidido em 7.2.5 por medição: spec D4).
 */
export const PRICE_CLASS = 'PriceClass_All'
export const ARN_DA_FUNCAO =
  '!GetAtt RedirecionarWww.FunctionMetadata.FunctionARN'
export const APEX = 'lotusotec.cl'
export const WWW = 'www.lotusotec.cl'

/**
 * As `FunctionAssociations` de um behavior, cruas como estão no template
 * (`ARN_DA_FUNCAO`, e não o ARN resolvido). Behavior sem o campo não tem
 * função.
 * @param {Mapa} comportamento
 * @param {string} caminho
 * @returns {Funcao[]}
 */
function lerAssociacoes(comportamento, caminho) {
  if (comportamento.FunctionAssociations === undefined) return []
  const itens = lista(
    comportamento.FunctionAssociations,
    `${caminho}.FunctionAssociations`,
  )
  return itens.map((bruto, i) => {
    const onde = `${caminho}.FunctionAssociations.${i}`
    const item = mapa(bruto, onde)
    conferirChaves(item, ['EventType', 'FunctionARN'], 'FunctionAssociations')
    if (item.EventType === undefined || item.FunctionARN === undefined) {
      throw new Error(
        `FunctionAssociations com item incompleto: ${JSON.stringify(item)}`,
      )
    }
    return {
      evento: escalar(item.EventType, `${onde}.EventType`),
      arn: escalar(item.FunctionARN, `${onde}.FunctionARN`),
    }
  })
}

/**
 * Lê de `Distribuicao` o que a catraca confere: aliases, classe de preço,
 * certificado, e as funções associadas ao behavior padrão e a cada
 * `CacheBehaviors`.
 * @param {string} texto conteúdo de `infra/lotus-site.yaml`
 */
export function lerDistribuicao(texto) {
  const propriedades = mapa(
    recurso(lerTemplate(texto), 'Distribuicao').Properties,
    'Distribuicao.Properties',
  )
  const config = mapa(propriedades.DistributionConfig, 'DistributionConfig')
  const aliases =
    config.Aliases === undefined
      ? []
      : lista(config.Aliases, 'Aliases').map((alias, i) =>
          escalar(alias, `Aliases.${i}`),
        )
  const priceClass =
    config.PriceClass === undefined
      ? ''
      : escalar(config.PriceClass, 'PriceClass')
  /** @type {Record<string, string>} */
  const certificado = {}
  if (config.ViewerCertificate !== undefined) {
    const lido = mapa(config.ViewerCertificate, 'ViewerCertificate')
    for (const [campo, valor] of Object.entries(lido)) {
      certificado[campo] = escalar(valor, `ViewerCertificate.${campo}`)
    }
  }
  const funcoesPadrao =
    config.DefaultCacheBehavior === undefined
      ? []
      : lerAssociacoes(
          mapa(config.DefaultCacheBehavior, 'DefaultCacheBehavior'),
          'DefaultCacheBehavior',
        )
  /** @type {Comportamento[]} */
  const comportamentos =
    config.CacheBehaviors === undefined
      ? []
      : lista(config.CacheBehaviors, 'CacheBehaviors').map((bruto, i) => {
          const caminho = `CacheBehaviors.${i}`
          const comportamento = mapa(bruto, caminho)
          return {
            caminho: escalar(
              comportamento.PathPattern,
              `${caminho}.PathPattern`,
            ),
            funcoes: lerAssociacoes(comportamento, caminho),
          }
        })
  return { aliases, priceClass, certificado, funcoesPadrao, comportamentos }
}

/**
 * Lê um `AWS::CloudFront::Function`: tipo, `AutoPublish`, runtime e o código
 * do bloco `FunctionCode`.
 * @param {string} texto
 * @param {string} nome nome lógico do recurso
 */
export function lerFuncao(texto, nome) {
  const lido = recurso(lerTemplate(texto), nome)
  if (lido.Type === undefined) throw new Error(`${nome} sem Type`)
  const propriedades =
    lido.Properties === undefined
      ? {}
      : mapa(lido.Properties, `${nome}.Properties`)
  if (propriedades.AutoPublish === undefined) {
    throw new Error(`${nome} sem AutoPublish`)
  }
  const config =
    propriedades.FunctionConfig === undefined
      ? {}
      : mapa(propriedades.FunctionConfig, `${nome}.FunctionConfig`)
  if (config.Runtime === undefined) throw new Error(`${nome} sem Runtime`)
  const codigo =
    propriedades.FunctionCode === undefined
      ? ''
      : escalar(propriedades.FunctionCode, `${nome}.FunctionCode`)
  if (codigo.trim() === '') throw new Error(`${nome} sem FunctionCode`)
  return {
    tipo: escalar(lido.Type, `${nome}.Type`),
    autoPublish:
      escalar(propriedades.AutoPublish, `${nome}.AutoPublish`) === 'true',
    runtime: escalar(config.Runtime, `${nome}.Runtime`),
    codigo,
  }
}

/**
 * Roda o código da função como a borda o rodaria: `handler(event)`. O
 * pedido devolvido intacto mantém identidade (é o mesmo objeto); resposta
 * nova volta como objeto simples deste realm.
 * @param {string} codigo
 * @param {Evento} evento
 * @returns {any}
 */
export function executarFuncao(codigo, evento) {
  const contexto = vm.createContext({ event: evento })
  const resultado = vm.runInContext(`${codigo}\n;handler(event)`, contexto, {
    timeout: 1_000,
  })
  return resultado === evento.request
    ? resultado
    : JSON.parse(JSON.stringify(resultado))
}

/**
 * `DomainName` + `SubjectAlternativeNames` do `Certificado` de
 * `infra/lotus-dns.yaml`, com `!Ref`/`!Sub` resolvidos.
 * @param {string} textoDns
 * @returns {string[]}
 */
export function nomesDoCertificado(textoDns) {
  const template = lerTemplate(textoDns)
  const { defaults } = template
  const propriedades = mapa(
    recurso(template, 'Certificado').Properties,
    'Certificado.Properties',
  )
  if (propriedades.DomainName === undefined) {
    throw new Error('Certificado sem DomainName')
  }
  const sans =
    propriedades.SubjectAlternativeNames === undefined
      ? []
      : lista(propriedades.SubjectAlternativeNames, 'SubjectAlternativeNames')
  return [
    resolver(propriedades.DomainName, defaults, 'Certificado.DomainName'),
    ...sans.map((nome, i) =>
      resolver(nome, defaults, `SubjectAlternativeNames.${i}`),
    ),
  ]
}

/**
 * `AllowedPattern` de um parâmetro, já sem as aspas do YAML.
 * @param {string} texto
 * @param {string} nome
 */
export function lerPadraoDoParametro(texto, nome) {
  const { parametros } = lerTemplate(texto)
  if (!Object.hasOwn(parametros, nome)) {
    throw new Error(`template sem o parâmetro ${nome}`)
  }
  const padrao = mapa(parametros[nome], `Parameters.${nome}`).AllowedPattern
  if (padrao === undefined) {
    throw new Error(`parâmetro ${nome} sem AllowedPattern`)
  }
  return escalar(padrao, `${nome}.AllowedPattern`)
}

/**
 * Evento de viewer-request na forma que o CloudFront entrega.
 * @param {string | undefined} host `undefined` = sem cabeçalho host
 * @param {string} uri
 * @param {Record<string, ParametroDeQuery>} [querystring]
 * @returns {Evento}
 */
export function evento(host, uri, querystring = {}) {
  return {
    request: {
      method: 'GET',
      uri,
      querystring,
      headers: host === undefined ? {} : { host: { value: host } },
      cookies: {},
    },
  }
}

/** Os `location` que a função precisa produzir (spec §4.2). */
export const CASOS_DO_REDIRECT = Object.freeze([
  {
    nome: 'www com caminho',
    evento: evento(WWW, '/cursos/'),
    location: `https://${APEX}/cursos/`,
  },
  {
    nome: 'www na raiz',
    evento: evento(WWW, '/'),
    location: `https://${APEX}/`,
  },
  {
    nome: 'www com query de chave repetida',
    evento: evento(WWW, '/', {
      a: { value: '1', multiValue: [{ value: '1' }, { value: '2' }] },
      b: { value: 'x' },
    }),
    location: `https://${APEX}/?a=1&a=2&b=x`,
  },
  {
    nome: 'www com chave sem valor',
    evento: evento(WWW, '/x', { vazio: { value: '' } }),
    location: `https://${APEX}/x?vazio=`,
  },
])

/** Hosts que a função não pode tocar. */
export const HOSTS_INTOCADOS = Object.freeze([
  APEX,
  'dhpoztt69jydz.cloudfront.net',
  undefined,
])

/**
 * A catraca inteira (spec §4.2): vazio quando o template está na forma
 * exigida; senão, um problema por campo, com o nome dele e os dois valores.
 * @param {string} textoSite conteúdo de `infra/lotus-site.yaml`
 * @param {string} textoDns conteúdo de `infra/lotus-dns.yaml`
 * @returns {string[]}
 */
export function conferirDistribuicao(textoSite, textoDns) {
  /** @type {string[]} */
  const problemas = []
  const distribuicao = lerDistribuicao(textoSite)
  const nomes = nomesDoCertificado(textoDns)
  if (!mesmoConjunto(distribuicao.aliases, nomes)) {
    problemas.push(
      `Aliases: ${JSON.stringify(distribuicao.aliases)} ≠ certificado ${JSON.stringify(nomes)}`,
    )
  }
  for (const [campo, esperado] of Object.entries(CERTIFICADO_ESPERADO)) {
    const veio = distribuicao.certificado[campo]
    if (veio !== esperado) {
      problemas.push(
        `ViewerCertificate.${campo}: esperado ${esperado}, veio ${veio ?? 'ausente'}`,
      )
    }
  }
  if (distribuicao.priceClass !== PRICE_CLASS) {
    problemas.push(
      `PriceClass: esperado ${PRICE_CLASS} (D-39, borda na América do Sul), veio ${distribuicao.priceClass || 'ausente'}`,
    )
  }
  const padrao = distribuicao.funcoesPadrao
  if (
    padrao.length !== 1 ||
    padrao[0]?.evento !== 'viewer-request' ||
    padrao[0]?.arn !== ARN_DA_FUNCAO
  ) {
    problemas.push(
      `DefaultCacheBehavior.FunctionAssociations: esperado só [viewer-request → RedirecionarWww], veio ${JSON.stringify(padrao)}`,
    )
  }
  for (const comportamento of distribuicao.comportamentos) {
    if (comportamento.funcoes.length > 0) {
      problemas.push(
        `CacheBehaviors ${comportamento.caminho}: FunctionAssociations presente`,
      )
    }
  }
  if (
    !lerPadraoDoParametro(textoSite, 'ArnDoCertificadoDoDominio').startsWith(
      '^arn:aws:acm:us-east-1:',
    )
  ) {
    problemas.push(
      'ArnDoCertificadoDoDominio.AllowedPattern: não prende us-east-1',
    )
  }
  const funcao = lerFuncao(textoSite, 'RedirecionarWww')
  if (funcao.tipo !== 'AWS::CloudFront::Function') {
    problemas.push(`RedirecionarWww.Type: veio ${funcao.tipo}`)
  }
  if (!funcao.autoPublish)
    problemas.push('RedirecionarWww.AutoPublish: esperado true')
  if (funcao.runtime !== 'cloudfront-js-2.0') {
    problemas.push(
      `RedirecionarWww.Runtime: esperado cloudfront-js-2.0, veio ${funcao.runtime}`,
    )
  }
  for (const caso of CASOS_DO_REDIRECT) {
    const resposta = executarFuncao(funcao.codigo, caso.evento)
    const veio = resposta?.headers?.location?.value
    if (resposta?.statusCode !== 301 || veio !== caso.location) {
      problemas.push(
        `location para ${caso.nome}: esperado 301 ${caso.location}, veio ${resposta?.statusCode} ${veio}`,
      )
    }
  }
  for (const host of HOSTS_INTOCADOS) {
    const pedido = evento(host, '/qualquer?z=1')
    if (executarFuncao(funcao.codigo, pedido) !== pedido.request) {
      problemas.push(`host ${host ?? 'ausente'}: pedido deveria seguir intacto`)
    }
  }
  return problemas
}
