// O job `alerta` de `.github/workflows/ci.yml` e o aviso do `deploy` quando
// ele não tem como rodar (bloco `B6`, spec
// `docs/superpowers/specs/2026-10-05-7.2.6-observabilidade-minima-design.md`
// §4.2 e §4.3), conferidos sobre a árvore que `yaml.mjs` lê. Vazio é workflow
// na forma; cada problema diz o campo.
import { lerYaml, mapa } from './yaml.mjs'

/** @typedef {import('./yaml.mjs').Valor} Valor */
/** @typedef {import('./yaml.mjs').Mapa} Mapa */

/**
 * As partes do `if` do `alerta`, ligadas por `&&` (spec §4.2). Job que
 * estoura `timeout-minutes` termina `cancelled`, e `failure()` não o vê: a
 * última parte pega os dois casos, e `!cancelled()` cala o run cancelado à
 * mão.
 */
export const CONDICOES_DO_ALERTA = Object.freeze([
  "github.event_name == 'push'",
  "github.ref == 'refs/heads/main'",
  "vars.AWS_ALERT_ROLE_ARN != ''",
  '!cancelled()',
  "(failure() || contains(needs.*.result, 'cancelled'))",
])

export const PAPEL_DE_ALERTA = '${{ vars.AWS_ALERT_ROLE_ARN }}'

// Mensagem de commit e nome de branch são texto de quem fez o push: não
// entram no job, nem por `env` (spec §4.2).
const TEXTO_DE_QUEM_EMPURROU = /github\.event\.|github\.head_ref/

/**
 * @param {Valor | undefined} passos
 * @param {string} onde
 * @returns {Mapa[]}
 */
function lerPassos(passos, onde) {
  if (!Array.isArray(passos)) throw new Error(`${onde}.steps: esperava lista`)
  return passos.map((passo, i) => mapa(passo, `${onde}.steps[${i}]`))
}

/**
 * A catraca inteira (spec §4.3).
 * @param {string} textoCi conteúdo de `.github/workflows/ci.yml`
 * @returns {string[]}
 */
export function conferirAlerta(textoCi) {
  /** @type {string[]} */
  const problemas = []
  const jobs = mapa(lerYaml(textoCi).jobs, 'jobs')
  if (jobs.alerta === undefined) return ['jobs.alerta: ausente']
  const alerta = mapa(jobs.alerta, 'jobs.alerta')

  const needs = Array.isArray(alerta.needs) ? alerta.needs : [alerta.needs]
  for (const nome of Object.keys(jobs)) {
    if (nome !== 'alerta' && !needs.includes(nome)) {
      problemas.push(
        `jobs.alerta.needs: sem ${nome}; uma falha dele não chega ao e-mail`,
      )
    }
  }

  // Parte por parte, e não só contém: um `|| true` colado numa guarda a
  // anularia sem tirar nada do texto.
  const partes = String(alerta.if ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' && ')
  for (const parte of CONDICOES_DO_ALERTA) {
    if (!partes.includes(parte)) {
      problemas.push(`jobs.alerta.if: sem ${parte}`)
    }
  }
  for (const parte of partes) {
    if (!CONDICOES_DO_ALERTA.includes(parte)) {
      problemas.push(`jobs.alerta.if: parte a mais: ${parte}`)
    }
  }

  if (
    JSON.stringify(alerta.permissions) !==
    JSON.stringify({ 'id-token': 'write' })
  ) {
    problemas.push(
      `jobs.alerta.permissions: esperado só id-token: write, veio ${JSON.stringify(alerta.permissions)}`,
    )
  }

  if (TEXTO_DE_QUEM_EMPURROU.test(JSON.stringify(alerta))) {
    problemas.push(
      'jobs.alerta: usa github.event.* ou github.head_ref, texto de quem fez o push',
    )
  }

  const passos = lerPassos(alerta.steps, 'jobs.alerta')
  const credencial = passos.find((passo) =>
    String(passo.uses ?? '').startsWith(
      'aws-actions/configure-aws-credentials@',
    ),
  )
  const com = credencial?.with
  const parametros = com === undefined ? {} : mapa(com, 'jobs.alerta.with')
  if (parametros['role-to-assume'] !== PAPEL_DE_ALERTA) {
    problemas.push(
      `jobs.alerta: role-to-assume esperado ${PAPEL_DE_ALERTA}, veio ${String(parametros['role-to-assume'] ?? 'ausente')}`,
    )
  }
  if (parametros['aws-region'] !== 'us-east-1') {
    problemas.push(
      `jobs.alerta: aws-region esperado us-east-1, onde mora o tópico, veio ${String(parametros['aws-region'] ?? 'ausente')}`,
    )
  }

  const publicar = passos.find((passo) =>
    String(passo.run ?? '').includes('aws sns publish'),
  )
  if (!publicar) {
    problemas.push('jobs.alerta.steps: sem o passo de aws sns publish')
  } else {
    const roteiro = String(publicar.run)
    if (roteiro.includes('${{')) {
      problemas.push(
        'jobs.alerta: o run interpola ${{ }}; todo valor entra por env (spec §4.2)',
      )
    }
  }

  // Uma variável sem a outra também cala o alerta: sem a role ele fica
  // pulado, sem o tópico ele não tem para onde publicar.
  const avisa = lerPassos(
    mapa(jobs.deploy, 'jobs.deploy').steps,
    'jobs.deploy',
  ).some(
    (passo) =>
      String(passo.if ?? '').includes("vars.AWS_ALERT_ROLE_ARN == ''") &&
      String(passo.if ?? '').includes("vars.AWS_ALERT_TOPIC_ARN == ''") &&
      String(passo.run ?? '').includes('::warning::'),
  )
  if (!avisa) {
    problemas.push(
      'jobs.deploy: sem o passo ::warning:: para AWS_ALERT_ROLE_ARN ou AWS_ALERT_TOPIC_ARN ausente',
    )
  }
  return problemas
}
