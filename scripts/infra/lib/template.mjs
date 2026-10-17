// O leitor único dos templates de CloudFormation de `infra/`. A sintaxe YAML
// fica em `yaml.mjs`; aqui mora só a semântica do template: parâmetros com
// `Default`, recursos, saídas e a resolução de `!Ref`/`!Sub` contra esses
// `Default`. Os leitores de `zona.mjs`, `distribuicao.mjs` e
// `politica-de-cabecalhos.mjs` navegam a árvore que sai daqui e conferem cada
// nível como conjunto fechado (`conferirChaves`): campo desconhecido ou valor
// sem resolução lança erro com o caminho, nunca vira valor lido pela metade.
import { lerYaml, mapa } from './yaml.mjs'

/**
 * @typedef {import('./yaml.mjs').Valor} Valor
 * @typedef {import('./yaml.mjs').Lista} Lista
 * @typedef {import('./yaml.mjs').Mapa} Mapa
 * @typedef {{ defaults: Map<string, string>, parametros: Mapa, recursos: Mapa, saidas: Mapa }} Template
 */

/**
 * Secção de topo opcional: ausente ou vazia (`Outputs:` sem nada embaixo)
 * vira mapa vazio.
 * @param {Valor | undefined} valor
 * @param {string} nome
 * @returns {Mapa}
 */
function secaoOpcional(valor, nome) {
  return valor === undefined || valor === '' ? {} : mapa(valor, nome)
}

/**
 * Lê o template inteiro. `defaults` só tem os parâmetros cujo `Default` é
 * escalar: é contra eles que `resolver` troca `!Ref` e `!Sub`.
 * @param {string} texto
 * @returns {Template}
 */
export function lerTemplate(texto) {
  const raiz = lerYaml(texto)
  if (raiz.Resources === undefined) throw new Error('template sem Resources')
  const parametros = secaoOpcional(raiz.Parameters, 'Parameters')
  /** @type {Map<string, string>} */
  const defaults = new Map()
  for (const [nome, parametro] of Object.entries(parametros)) {
    const padrao = mapa(parametro, `Parameters.${nome}`).Default
    if (typeof padrao === 'string') defaults.set(nome, padrao)
  }
  return {
    defaults,
    parametros,
    recursos: mapa(raiz.Resources, 'Resources'),
    saidas: secaoOpcional(raiz.Outputs, 'Outputs'),
  }
}

/**
 * Um recurso de `Resources:` pelo nome lógico.
 * @param {Template} template
 * @param {string} nome
 * @returns {Mapa}
 */
export function recurso(template, nome) {
  if (!Object.hasOwn(template.recursos, nome)) {
    throw new Error(`template sem o recurso ${nome}`)
  }
  return mapa(template.recursos[nome], `Resources.${nome}`)
}

/**
 * @param {Valor | undefined} valor
 * @param {string} caminho
 * @returns {string}
 */
export function escalar(valor, caminho) {
  if (typeof valor !== 'string') {
    throw new Error(`${caminho}: esperava um escalar`)
  }
  return valor
}

/**
 * @param {Valor | undefined} valor
 * @param {string} caminho
 * @returns {Lista}
 */
export function lista(valor, caminho) {
  if (!Array.isArray(valor)) throw new Error(`${caminho}: esperava uma lista`)
  return valor
}

/**
 * Conjunto fechado: chave fora de `permitidas` é erro com o nome dela. É assim
 * que a catraca pega um campo novo no template que o leitor não conhece.
 * @param {Mapa} objeto
 * @param {readonly string[]} permitidas
 * @param {string} onde
 */
export function conferirChaves(objeto, permitidas, onde) {
  for (const chave of Object.keys(objeto)) {
    if (!permitidas.includes(chave)) {
      throw new Error(`${onde} com campo desconhecido: ${chave}`)
    }
  }
}

/**
 * @param {Map<string, string>} defaults
 * @param {string} nome
 */
function exigirDefault(defaults, nome) {
  const valor = defaults.get(nome)
  if (valor === undefined) {
    throw new Error(
      `template usa o parâmetro ${nome}, que não tem Default declarado`,
    )
  }
  return valor
}

/**
 * Resolve `!Ref X` e `!Sub '...${X}...'` contra os `Default`. O payload do
 * `!Sub` é texto cru de YAML, então passa pelo `lerYaml` para as aspas e os
 * escapes valerem como no resto do arquivo. Texto sem tag volta igual; outra
 * tag (`!GetAtt`, `!Join`...) lança, porque não há `Default` que a resolva.
 * @param {Valor | undefined} valor
 * @param {Map<string, string>} defaults
 * @param {string} caminho
 * @returns {string}
 */
export function resolver(valor, defaults, caminho) {
  if (typeof valor !== 'string') {
    throw new Error(`${caminho}: sem resolução: ${JSON.stringify(valor)}`)
  }
  if (!valor.startsWith('!')) return valor
  const referencia = valor.match(/^!Ref\s+(\w+)$/)
  if (referencia) return exigirDefault(defaults, referencia[1] ?? '')
  const substituicao = valor.match(/^!Sub\s+(.+)$/)
  if (!substituicao) throw new Error(`${caminho}: sem resolução: ${valor}`)
  const texto = escalar(lerYaml(`v: ${substituicao[1]}`).v, caminho)
  return texto.replace(/\$\{(\w+)\}/g, (_todo, nome) =>
    exigirDefault(defaults, String(nome)),
  )
}
