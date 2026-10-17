// Como ler a `PoliticaDeCabecalhos` de volta de `infra/lotus-site.yaml` e
// renderizá-la nos cabeçalhos que a borda emite. Separado de `cabecalhos.mjs`
// porque `vite.config.ts` e o E2E importam de lá, e o leitor de template não
// deve entrar no grafo do build.
//
// A leitura é a árvore de `template.mjs`, conferida nível a nível como
// conjunto fechado: campo esperado ausente, ou campo desconhecido dentro da
// política, lança erro com o nome do campo — nunca vira `undefined`
// silencioso. A validação estrutural do YAML continua com
// `aws cloudformation validate-template`, no runbook.
import {
  conferirChaves,
  escalar,
  lerTemplate,
  lista,
  recurso,
} from './template.mjs'
import { mapa } from './yaml.mjs'

/** @typedef {import('./yaml.mjs').Mapa} Mapa */

// Conjuntos fechados de campos aceitos em cada nível da política. Qualquer
// chave fora deles é erro: é assim que a catraca pega um campo novo no
// template que o módulo não conhece.
const SECOES = Object.freeze([
  'Name',
  'Comment',
  'SecurityHeadersConfig',
  'CustomHeadersConfig',
  'RemoveHeadersConfig',
])

/** @type {Readonly<Record<string, readonly string[]>>} */
const CAMPOS_DO_GRUPO = Object.freeze({
  ContentSecurityPolicy: ['ContentSecurityPolicy', 'Override'],
  StrictTransportSecurity: [
    'AccessControlMaxAgeSec',
    'IncludeSubdomains',
    'Preload',
    'Override',
  ],
  ContentTypeOptions: ['Override'],
  FrameOptions: ['FrameOption', 'Override'],
  ReferrerPolicy: ['ReferrerPolicy', 'Override'],
})

/**
 * @param {Record<string, string>} campos
 * @param {string} grupo
 * @param {string} campo
 */
function exigirCampo(campos, grupo, campo) {
  const valor = campos[campo]
  if (valor === undefined) throw new Error(`${grupo} sem ${campo}`)
  return valor
}

/**
 * Renderiza o campo estruturado no valor do cabeçalho HTTP (spec §4.2).
 * @param {string} grupo
 * @param {Record<string, string>} campos
 * @returns {[string, string]}
 */
function renderizarGrupo(grupo, campos) {
  switch (grupo) {
    case 'ContentSecurityPolicy':
      return [
        'Content-Security-Policy',
        exigirCampo(campos, grupo, 'ContentSecurityPolicy'),
      ]
    case 'StrictTransportSecurity': {
      const partes = [
        `max-age=${exigirCampo(campos, grupo, 'AccessControlMaxAgeSec')}`,
      ]
      const incluirSubdominios = exigirCampo(campos, grupo, 'IncludeSubdomains')
      if (incluirSubdominios !== 'true' && incluirSubdominios !== 'false') {
        throw new Error(
          `${grupo}.IncludeSubdomains não é 'true' nem 'false': ${incluirSubdominios}`,
        )
      }
      const preload = exigirCampo(campos, grupo, 'Preload')
      if (preload !== 'true' && preload !== 'false') {
        throw new Error(`${grupo}.Preload não é 'true' nem 'false': ${preload}`)
      }
      if (incluirSubdominios === 'true') partes.push('includeSubDomains')
      if (preload === 'true') partes.push('preload')
      return ['Strict-Transport-Security', partes.join('; ')]
    }
    case 'ContentTypeOptions':
      return ['X-Content-Type-Options', 'nosniff']
    case 'FrameOptions':
      return ['X-Frame-Options', exigirCampo(campos, grupo, 'FrameOption')]
    case 'ReferrerPolicy':
      return ['Referrer-Policy', exigirCampo(campos, grupo, 'ReferrerPolicy')]
    default:
      throw new Error(`SecurityHeadersConfig com campo desconhecido: ${grupo}`)
  }
}

/**
 * Os campos de um mapa como texto, cada um conferido como escalar.
 * @param {Mapa} lido
 * @param {string} caminho
 * @returns {Record<string, string>}
 */
function escalares(lido, caminho) {
  /** @type {Record<string, string>} */
  const campos = {}
  for (const [campo, valor] of Object.entries(lido)) {
    campos[campo] = escalar(valor, `${caminho}.${campo}`)
  }
  return campos
}

/**
 * Os `Items` de `CustomHeadersConfig` ou `RemoveHeadersConfig`, cada um
 * conferido contra os campos permitidos.
 * @param {Mapa} config
 * @param {string} secao
 * @param {readonly string[]} permitidos
 * @returns {Record<string, string>[]}
 */
function lerItens(config, secao, permitidos) {
  if (config[secao] === undefined) return []
  const lida = mapa(config[secao], secao)
  conferirChaves(lida, ['Items'], secao)
  return lista(lida.Items, `${secao}.Items`).map((bruto, i) => {
    const item = mapa(bruto, `${secao}.Items.${i}`)
    conferirChaves(item, permitidos, secao)
    return escalares(item, `${secao}.Items.${i}`)
  })
}

/**
 * Lê a `ResponseHeadersPolicy` do template e devolve os cabeçalhos já
 * renderizados como a borda os emite, os nomes removidos e o `Comment`.
 * @param {string} texto conteúdo de `infra/lotus-site.yaml`
 * @returns {{ cabecalhos: Record<string, string>, removidos: string[], comentario: string }}
 */
export function lerPoliticaDoTemplate(texto) {
  const politica = recurso(lerTemplate(texto), 'PoliticaDeCabecalhos')
  if (politica.Type === undefined) {
    throw new Error('PoliticaDeCabecalhos sem Type')
  }
  if (politica.Properties === undefined) {
    throw new Error('PoliticaDeCabecalhos sem Properties')
  }
  conferirChaves(politica, ['Type', 'Properties'], 'PoliticaDeCabecalhos')
  const propriedades = mapa(
    politica.Properties,
    'PoliticaDeCabecalhos.Properties',
  )
  if (propriedades.ResponseHeadersPolicyConfig === undefined) {
    throw new Error('Properties sem ResponseHeadersPolicyConfig')
  }
  conferirChaves(propriedades, ['ResponseHeadersPolicyConfig'], 'Properties')
  const config = mapa(
    propriedades.ResponseHeadersPolicyConfig,
    'ResponseHeadersPolicyConfig',
  )
  conferirChaves(config, SECOES, 'ResponseHeadersPolicyConfig')

  /** @type {Record<string, string>} */
  const cabecalhos = {}
  if (config.SecurityHeadersConfig !== undefined) {
    const seguranca = mapa(
      config.SecurityHeadersConfig,
      'SecurityHeadersConfig',
    )
    conferirChaves(
      seguranca,
      Object.keys(CAMPOS_DO_GRUPO),
      'SecurityHeadersConfig',
    )
    for (const [grupo, bruto] of Object.entries(seguranca)) {
      const lido = mapa(bruto, `SecurityHeadersConfig.${grupo}`)
      conferirChaves(lido, CAMPOS_DO_GRUPO[grupo] ?? [], grupo)
      const campos = escalares(lido, grupo)
      if (campos.Override !== 'true') {
        throw new Error(`${grupo} sem Override: true`)
      }
      const [cabecalho, valor] = renderizarGrupo(grupo, campos)
      cabecalhos[cabecalho] = valor
    }
  }
  for (const item of lerItens(config, 'CustomHeadersConfig', [
    'Header',
    'Value',
    'Override',
  ])) {
    const cabecalho = exigirCampo(item, 'CustomHeadersConfig', 'Header')
    if (item.Override !== 'true') {
      throw new Error(`item ${cabecalho} sem Override: true`)
    }
    cabecalhos[cabecalho] = exigirCampo(item, `item ${cabecalho}`, 'Value')
  }
  const removidos = lerItens(config, 'RemoveHeadersConfig', ['Header']).map(
    (item) => exigirCampo(item, 'RemoveHeadersConfig', 'Header'),
  )

  const nome =
    config.Name === undefined
      ? ''
      : escalar(config.Name, 'ResponseHeadersPolicyConfig.Name')
  const comentario =
    config.Comment === undefined
      ? ''
      : escalar(config.Comment, 'ResponseHeadersPolicyConfig.Comment')
  if (!nome) throw new Error('ResponseHeadersPolicyConfig sem Name')
  if (!comentario) throw new Error('ResponseHeadersPolicyConfig sem Comment')
  return { cabecalhos, removidos, comentario }
}
