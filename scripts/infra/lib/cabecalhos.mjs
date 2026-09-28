// Os cabeçalhos que a borda emite em toda resposta (`7.2.2`), e como ler a
// `PoliticaDeCabecalhos` de volta de `infra/lotus-site.yaml` sem parser YAML.
//
// Este módulo é a fonte canônica: `vite.config.ts` serve `CABECALHOS` no
// preview, e a catraca `scripts/infra/cabecalhos.test.mjs` reprova qualquer
// divergência entre o template e daqui — o CloudFormation não lê arquivo
// externo, então o YAML é cópia vigiada (spec §4.2 de
// `docs/superpowers/specs/2026-09-27-7.2.2-headers-hardening-design.md`).
//
// Mesmo trade-off de `zona.mjs`: `yaml` e `js-yaml` não resolvem na árvore e
// instalar um só para a catraca é dependência sem necessidade (Lei 7). A
// leitura é textual e assumida frágil: campo esperado ausente, ou campo
// desconhecido dentro da política, lança erro com o nome do campo — nunca
// vira `undefined` silencioso. A validação estrutural do YAML continua com
// `aws cloudformation validate-template`, no runbook.

// A CSP mora aqui como lista de diretivas; no YAML ela é a string final, numa
// linha só. `default-src 'none'` obriga a enumerar tudo o que o site carrega:
// recurso novo não previsto reprova no E2E em vez de passar calado.
// `challenges.cloudflare.com` em `script-src` e `frame-src` é o Turnstile
// (spec D5). Sem `upgrade-insecure-requests`: o preview roda em
// `http://localhost` (spec D10).
const DIRETIVAS_CSP = Object.freeze([
  "default-src 'none'",
  "script-src 'self' https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  "connect-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
])

/**
 * Tudo o que a borda emite, `X-Robots-Tag` incluso — em `7.2.5` ele sai
 * daqui E do template, e a catraca obriga os dois a mudarem juntos.
 * HSTS de um ano sem `includeSubDomains` e sem `preload`: `mail.lotusotec.cl`
 * falha verificação TLS e `app.lotusotec.cl` não responde em 443 (spec D1).
 * @type {Readonly<Record<string, string>>}
 */
export const CABECALHOS = Object.freeze({
  'Content-Security-Policy': DIRETIVAS_CSP.join('; '),
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-Robots-Tag': 'noindex, nofollow',
})

/**
 * O que a borda tira da resposta da origin. Remover `Server` faz o
 * CloudFront responder o próprio `Server: CloudFront` (spec D7).
 * @type {readonly string[]}
 */
export const REMOVIDOS = Object.freeze([
  'Server',
  'x-amz-server-side-encryption',
  'x-amz-version-id',
])

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

/** @param {string} bruto */
function semAspas(bruto) {
  const cru = bruto.trim()
  return cru.match(/^(['"])([\s\S]*)\1$/)?.[2] ?? cru
}

/**
 * Recorta o corpo do recurso, até o próximo recurso de topo.
 * @param {string} texto
 */
function recortarPolitica(texto) {
  const de = texto.indexOf('\n  PoliticaDeCabecalhos:')
  if (de === -1) throw new Error('template sem o recurso PoliticaDeCabecalhos')
  /** @type {string[]} */
  const corpo = []
  // `slice(2)`: a primeira fatia é o que antecede o `\n` e a segunda é o
  // próprio cabeçalho do recurso.
  for (const linha of texto.slice(de).split('\n').slice(2)) {
    if (/^ {0,2}\S/.test(linha)) break
    corpo.push(linha)
  }
  return corpo
}

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
 * Lê a `ResponseHeadersPolicy` do template e devolve os cabeçalhos já
 * renderizados como a borda os emite, os nomes removidos e o `Comment`.
 * @param {string} texto conteúdo de `infra/lotus-site.yaml`
 * @returns {{ cabecalhos: Record<string, string>, removidos: string[], comentario: string }}
 */
export function lerPoliticaDoTemplate(texto) {
  const corpo = recortarPolitica(texto)
  /** @type {Record<string, string>} */
  const cabecalhos = {}
  /** @type {string[]} */
  const removidos = []
  let comentario = ''
  let nome = ''
  let secao = ''
  let grupo = ''
  let vistoTipo = false
  let vistoPropriedades = false
  let vistoConfig = false
  /** @type {Record<string, string>} */
  let camposDoGrupo = {}
  /** @type {Record<string, string> | undefined} */
  let item

  const fecharGrupo = () => {
    if (!grupo) return
    const permitidos = CAMPOS_DO_GRUPO[grupo] ?? []
    for (const campo of Object.keys(camposDoGrupo)) {
      if (!permitidos.includes(campo)) {
        throw new Error(`${grupo} com campo desconhecido: ${campo}`)
      }
    }
    if (camposDoGrupo.Override !== 'true') {
      throw new Error(`${grupo} sem Override: true`)
    }
    const [cabecalho, valor] = renderizarGrupo(grupo, camposDoGrupo)
    cabecalhos[cabecalho] = valor
    grupo = ''
    camposDoGrupo = {}
  }

  const fecharItem = () => {
    if (!item) return
    const atual = item
    item = undefined
    if (secao === 'RemoveHeadersConfig') {
      for (const campo of Object.keys(atual)) {
        if (campo !== 'Header') {
          throw new Error(
            `RemoveHeadersConfig com campo desconhecido: ${campo}`,
          )
        }
      }
      removidos.push(exigirCampo(atual, 'RemoveHeadersConfig', 'Header'))
      return
    }
    for (const campo of Object.keys(atual)) {
      if (!['Header', 'Value', 'Override'].includes(campo)) {
        throw new Error(`CustomHeadersConfig com campo desconhecido: ${campo}`)
      }
    }
    const cabecalho = exigirCampo(atual, 'CustomHeadersConfig', 'Header')
    if (atual.Override !== 'true') {
      throw new Error(`item ${cabecalho} sem Override: true`)
    }
    cabecalhos[cabecalho] = exigirCampo(atual, `item ${cabecalho}`, 'Value')
  }

  for (const linha of corpo) {
    if (/^\s*(#|$)/.test(linha)) continue
    let m
    if ((m = linha.match(/^ {4}(\w+):/))) {
      const chave = m[1] ?? ''
      if (chave !== 'Type' && chave !== 'Properties') {
        throw new Error(`PoliticaDeCabecalhos com campo desconhecido: ${chave}`)
      }
      if (chave === 'Type') vistoTipo = true
      if (chave === 'Properties') vistoPropriedades = true
      continue
    }
    if ((m = linha.match(/^ {6}(\w+):/))) {
      if (m[1] !== 'ResponseHeadersPolicyConfig') {
        throw new Error(`Properties com campo desconhecido: ${m[1]}`)
      }
      vistoConfig = true
      continue
    }
    if ((m = linha.match(/^ {8}(\w+):\s*(.*)$/))) {
      fecharItem()
      fecharGrupo()
      secao = m[1] ?? ''
      if (!SECOES.includes(secao)) {
        throw new Error(
          `ResponseHeadersPolicyConfig com campo desconhecido: ${secao}`,
        )
      }
      if (secao === 'Name') nome = semAspas(m[2] ?? '')
      if (secao === 'Comment') comentario = semAspas(m[2] ?? '')
      continue
    }
    if ((m = linha.match(/^ {10}(\w+):\s*$/))) {
      fecharItem()
      fecharGrupo()
      const chave = m[1] ?? ''
      if (secao === 'SecurityHeadersConfig') {
        if (!Object.keys(CAMPOS_DO_GRUPO).includes(chave)) {
          throw new Error(
            `SecurityHeadersConfig com campo desconhecido: ${chave}`,
          )
        }
        grupo = chave
      } else if (chave !== 'Items') {
        throw new Error(`${secao} com campo desconhecido: ${chave}`)
      }
      continue
    }
    if ((m = linha.match(/^ {12}- (\w+):\s*(.*)$/))) {
      fecharItem()
      item = { [m[1] ?? '']: semAspas(m[2] ?? '') }
      continue
    }
    if (item && (m = linha.match(/^ {14}(\w+):\s*(.*)$/))) {
      item[m[1] ?? ''] = semAspas(m[2] ?? '')
      continue
    }
    if (grupo && (m = linha.match(/^ {12}(\w+):\s*(.*)$/))) {
      camposDoGrupo[m[1] ?? ''] = semAspas(m[2] ?? '')
      continue
    }
    throw new Error(
      `linha não reconhecida na PoliticaDeCabecalhos: ${linha.trim()}`,
    )
  }
  fecharItem()
  fecharGrupo()

  if (!vistoTipo) throw new Error('PoliticaDeCabecalhos sem Type')
  if (!vistoPropriedades) throw new Error('PoliticaDeCabecalhos sem Properties')
  if (!vistoConfig)
    throw new Error('Properties sem ResponseHeadersPolicyConfig')
  if (!nome) throw new Error('ResponseHeadersPolicyConfig sem Name')
  if (!comentario) throw new Error('ResponseHeadersPolicyConfig sem Comment')
  return { cabecalhos, removidos, comentario }
}
