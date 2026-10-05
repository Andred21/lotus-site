// A forma que `Distribuicao` e `RedirecionarWww` de `infra/lotus-site.yaml`
// precisam ter para o domínio próprio (7.2.4, spec §4.2), e como ler isso de
// volta sem parser YAML — o mesmo trade-off de `zona.mjs` e `cabecalhos.mjs`
// (Lei 7): leitura textual, assumida frágil, que quebra ruidosamente com o
// nome do campo. A função do redirect é extraída do template e executada em
// `node:vm`: o que a catraca prova é o código que vai para a borda, não uma
// cópia dele.
import vm from 'node:vm'
import { lerParametros, mesmoConjunto, resolver } from './zona.mjs'

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
export const ARN_DA_FUNCAO =
  '!GetAtt RedirecionarWww.FunctionMetadata.FunctionARN'
export const APEX = 'lotusotec.cl'
export const WWW = 'www.lotusotec.cl'

/** @param {string} bruto */
function semAspas(bruto) {
  const cru = bruto.trim()
  return cru.match(/^(['"])([\s\S]*)\1$/)?.[2] ?? cru
}

/**
 * Corpo de um recurso de `Resources:`, cru (comentários e vazias inclusos:
 * `lerFuncao` precisa deles dentro do bloco de código), até o próximo
 * recurso na coluna 2.
 * @param {string} texto
 * @param {string} nome
 */
function recortarRecurso(texto, nome) {
  const de = texto.indexOf(`\n  ${nome}:`)
  if (de === -1) throw new Error(`template sem o recurso ${nome}`)
  /** @type {string[]} */
  const corpo = []
  for (const linha of texto.slice(de).split('\n').slice(2)) {
    if (/^ {0,2}\S/.test(linha)) break
    corpo.push(linha)
  }
  return corpo
}

/**
 * @param {Funcao} funcao
 * @param {string} chave
 * @param {string} valor
 */
function campoDeFuncao(funcao, chave, valor) {
  if (chave === 'EventType') return { ...funcao, evento: valor }
  if (chave === 'FunctionARN') return { ...funcao, arn: valor }
  throw new Error(`FunctionAssociations com campo desconhecido: ${chave}`)
}

/**
 * Lê de `Distribuicao` o que a catraca confere: aliases, certificado, e as
 * funções associadas ao behavior padrão e a cada `CacheBehaviors`.
 * @param {string} texto conteúdo de `infra/lotus-site.yaml`
 */
export function lerDistribuicao(texto) {
  /** @type {string[]} */
  const aliases = []
  /** @type {Record<string, string>} */
  const certificado = {}
  /** @type {Funcao[]} */
  const funcoesPadrao = []
  /** @type {Comportamento[]} */
  const comportamentos = []
  let secao = ''
  /** @type {'' | 'padrao' | 'caminho'} */
  let associando = ''
  /** @type {Funcao | undefined} */
  let funcao

  const fecharFuncao = () => {
    if (!funcao) return
    if (!funcao.evento || !funcao.arn) {
      throw new Error(
        `FunctionAssociations com item incompleto: ${JSON.stringify(funcao)}`,
      )
    }
    if (associando === 'padrao') funcoesPadrao.push(funcao)
    else comportamentos.at(-1)?.funcoes.push(funcao)
    funcao = undefined
  }

  for (const linha of recortarRecurso(texto, 'Distribuicao')) {
    if (/^\s*(#|$)/.test(linha)) continue
    let m
    // Chave direta de DistributionConfig (coluna 8): muda de secção.
    if ((m = linha.match(/^ {8}(\w+):\s*(.*)$/))) {
      fecharFuncao()
      associando = ''
      secao = m[1] ?? ''
      continue
    }
    if (secao === 'Aliases' && (m = linha.match(/^ {10}- (\S+)$/))) {
      aliases.push(m[1] ?? '')
      continue
    }
    if (
      secao === 'ViewerCertificate' &&
      (m = linha.match(/^ {10}(\w+):\s*(.+)$/))
    ) {
      certificado[m[1] ?? ''] = semAspas(m[2] ?? '')
      continue
    }
    if (secao === 'DefaultCacheBehavior') {
      if ((m = linha.match(/^ {10}(\w+):\s*(.*)$/))) {
        fecharFuncao()
        associando = m[1] === 'FunctionAssociations' ? 'padrao' : ''
        continue
      }
      if (
        associando === 'padrao' &&
        (m = linha.match(/^ {12}- (\w+):\s*(.+)$/))
      ) {
        fecharFuncao()
        funcao = campoDeFuncao({ evento: '', arn: '' }, m[1] ?? '', m[2] ?? '')
        continue
      }
      if (
        associando === 'padrao' &&
        funcao &&
        (m = linha.match(/^ {14}(\w+):\s*(.+)$/))
      ) {
        funcao = campoDeFuncao(funcao, m[1] ?? '', m[2] ?? '')
      }
      continue
    }
    if (secao === 'CacheBehaviors') {
      if ((m = linha.match(/^ {10}- PathPattern:\s*(\S+)$/))) {
        fecharFuncao()
        associando = ''
        comportamentos.push({ caminho: m[1] ?? '', funcoes: [] })
        continue
      }
      if ((m = linha.match(/^ {12}(\w+):\s*(.*)$/))) {
        fecharFuncao()
        associando = m[1] === 'FunctionAssociations' ? 'caminho' : ''
        continue
      }
      if (
        associando === 'caminho' &&
        (m = linha.match(/^ {14}- (\w+):\s*(.+)$/))
      ) {
        fecharFuncao()
        funcao = campoDeFuncao({ evento: '', arn: '' }, m[1] ?? '', m[2] ?? '')
        continue
      }
      if (
        associando === 'caminho' &&
        funcao &&
        (m = linha.match(/^ {16}(\w+):\s*(.+)$/))
      ) {
        funcao = campoDeFuncao(funcao, m[1] ?? '', m[2] ?? '')
      }
    }
  }
  fecharFuncao()
  return { aliases, certificado, funcoesPadrao, comportamentos }
}

/**
 * Lê um `AWS::CloudFront::Function`. `FunctionCode: |` precisa ser a última
 * propriedade: tudo depois dela, recuado em 8, é o código.
 * @param {string} texto
 * @param {string} nome nome lógico do recurso
 */
export function lerFuncao(texto, nome) {
  let tipo = ''
  let autoPublish = ''
  let runtime = ''
  /** @type {string[] | undefined} */
  let codigo
  for (const linha of recortarRecurso(texto, nome)) {
    if (codigo) {
      if (linha.trim() === '') {
        codigo.push('')
        continue
      }
      if (!linha.startsWith('        ')) {
        throw new Error(
          `${nome}: FunctionCode precisa ser a última propriedade; linha fora do bloco: ${linha.trim()}`,
        )
      }
      codigo.push(linha.slice(8))
      continue
    }
    let m
    if ((m = linha.match(/^ {4}Type:\s*(\S+)/))) tipo = m[1] ?? ''
    else if ((m = linha.match(/^ {6}AutoPublish:\s*(\S+)/))) {
      autoPublish = m[1] ?? ''
    } else if ((m = linha.match(/^ {8}Runtime:\s*(\S+)/))) runtime = m[1] ?? ''
    else if (/^ {6}FunctionCode:\s*\|\s*$/.test(linha)) codigo = []
  }
  if (!tipo) throw new Error(`${nome} sem Type`)
  if (!autoPublish) throw new Error(`${nome} sem AutoPublish`)
  if (!runtime) throw new Error(`${nome} sem Runtime`)
  if (!codigo || codigo.join('').trim() === '') {
    throw new Error(`${nome} sem FunctionCode`)
  }
  return {
    tipo,
    autoPublish: autoPublish === 'true',
    runtime,
    codigo: codigo.join('\n'),
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
  const parametros = lerParametros(textoDns)
  /** @type {string[]} */
  const nomes = []
  let emSans = false
  for (const linha of recortarRecurso(textoDns, 'Certificado')) {
    if (/^\s*(#|$)/.test(linha)) continue
    let m
    if ((m = linha.match(/^ {6}DomainName:\s*(.+)$/))) {
      nomes.unshift(resolver(m[1] ?? '', parametros))
      emSans = false
      continue
    }
    if (/^ {6}SubjectAlternativeNames:\s*$/.test(linha)) {
      emSans = true
      continue
    }
    if (/^ {6}\S/.test(linha)) {
      emSans = false
      continue
    }
    if (emSans && (m = linha.match(/^ {8}- (.+)$/))) {
      nomes.push(resolver(m[1] ?? '', parametros))
    }
  }
  if (nomes.length === 0) throw new Error('Certificado sem DomainName')
  return nomes
}

/**
 * `AllowedPattern` de um parâmetro, sem as aspas do YAML.
 * @param {string} texto
 * @param {string} nome
 */
export function lerPadraoDoParametro(texto, nome) {
  const de = texto.indexOf(`\n  ${nome}:`)
  const fim = texto.indexOf('\nResources:')
  if (de === -1 || de > fim) throw new Error(`template sem o parâmetro ${nome}`)
  for (const linha of texto.slice(de).split('\n').slice(2)) {
    if (/^ {0,2}\S/.test(linha)) break
    const m = linha.match(/^ {4}AllowedPattern:\s*(.+)$/)
    if (m) return semAspas(m[1] ?? '')
  }
  throw new Error(`parâmetro ${nome} sem AllowedPattern`)
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
