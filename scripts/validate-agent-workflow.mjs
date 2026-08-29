import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const flagIndex = process.argv.indexOf('--root')
const rootArg = flagIndex === -1 ? '.' : process.argv[flagIndex + 1]
if (rootArg === undefined) {
  console.error('--root requires a directory')
  process.exit(2)
}
const root = rootArg

/** @param {string} rel */
const resolve = (rel) => join(root, rel)
/** @param {string} rel */
const exists = (rel) => existsSync(resolve(rel))
/** @param {string} rel */
const read = (rel) => readFileSync(resolve(rel), 'utf8')

/** @type {string[]} */
const errors = []

const required = [
  'CLAUDE.md',
  'AGENTS.md',
  '.claude/rules/architecture.md',
  '.claude/rules/frontend.md',
  '.claude/rules/testing.md',
  '.claude/commands/planejar-site.md',
  '.claude/commands/executar-site.md',
  '.claude/commands/revisar-site.md',
  '.claude/commands/fechar-site.md',
  '.agents/skills/site-context-packet/SKILL.md',
  '.agents/skills/site-execute-task/SKILL.md',
  '.agents/skills/site-review-task/SKILL.md',
  'docs/superpowers/state.md',
  'docs/superpowers/backlog.md',
  'docs/superpowers/historico/progress.md',
]

for (const rel of required) {
  if (!exists(rel)) errors.push(`missing: ${rel}`)
}

const ORDERED_STATES = [
  'idle',
  'context_required',
  'ready_for_planning',
  'planning',
  'ready_for_execution',
  'executing',
  'ready_for_review',
  'reviewing',
  'ready_for_closure',
]
const VALID_STATES = [...ORDERED_STATES, 'blocked']

/**
 * @param {string} text
 * @returns {Record<string, string> | null}
 */
const parseFrontmatter = (text) => {
  const match = text.match(/^---\n([\s\S]*?)\n---/)
  const block = match?.[1]
  if (block === undefined) return null
  /** @type {Record<string, string>} */
  const values = {}
  for (const line of block.split('\n')) {
    const pair = line.match(/^([a-z_]+):\s*(.*)$/)
    const key = pair?.[1]
    const value = pair?.[2]
    if (key !== undefined && value !== undefined) values[key] = value.trim()
  }
  return values
}

/**
 * @param {string | undefined} value
 * @returns {boolean}
 */
const isNull = (value) =>
  value === undefined || value === '' || value === 'null'

const checkState = () => {
  const state = read('docs/superpowers/state.md')
  const front = parseFrontmatter(state)
  if (!front) {
    errors.push('state: frontmatter ausente')
    return
  }
  const current = front.workflow_state
  if (current === undefined) {
    errors.push('state: workflow_state ausente')
    return
  }
  if (front.workflow_mode !== 'supervised') {
    errors.push('state: workflow_mode deve ser supervised')
  }
  if (!VALID_STATES.includes(current)) {
    errors.push(`state: workflow_state inválido: ${current}`)
    return
  }
  for (const value of VALID_STATES) {
    if (!state.includes('`' + value + '`')) {
      errors.push(`state: missing documented state ${value}`)
    }
  }

  const resume = front.resume_state
  const effective =
    current === 'blocked' &&
    resume !== undefined &&
    ORDERED_STATES.includes(resume)
      ? resume
      : current
  const fromExecution =
    ORDERED_STATES.indexOf(effective) >=
    ORDERED_STATES.indexOf('ready_for_execution')

  if (current === 'idle') {
    if (!isNull(front.active_work_item))
      errors.push('state: idle exige active_work_item null')
    if (!isNull(front.active_branch))
      errors.push('state: idle exige active_branch null')
  } else {
    if (isNull(front.active_work_item)) {
      errors.push(`state: ${current} exige active_work_item preenchido`)
    }
    if (isNull(front.active_branch)) {
      errors.push(`state: ${current} exige active_branch preenchido`)
    }
    if (front.active_branch === 'main') {
      errors.push(
        'state: bloco não roda em main; active_branch precisa ser branch própria',
      )
    }
  }

  if (current === 'blocked') {
    if (isNull(front.blocker))
      errors.push('state: blocked exige blocker preenchido')
    if (resume === undefined || !ORDERED_STATES.includes(resume)) {
      errors.push(`state: blocked exige resume_state válido, veio ${resume}`)
    }
  }

  if (fromExecution) {
    const workClass = front.work_class
    if (
      workClass === undefined ||
      !['bounded', 'architectural'].includes(workClass)
    ) {
      errors.push(
        `state: ${current} (fase ${effective}) exige work_class bounded ou architectural`,
      )
    }
    if (isNull(front.executor) || isNull(front.reviewer)) {
      errors.push(
        `state: ${current} (fase ${effective}) exige executor e reviewer preenchidos`,
      )
    } else if (front.executor === front.reviewer) {
      // Segunda lente é a regra; agente indisponível é a exceção. Ela passa só
      // declarada: `reviewer_exception` carrega motivo, data e quem autorizou,
      // e o débito correspondente fica no backlog.
      if (isNull(front.reviewer_exception)) {
        errors.push(
          'state: executor e reviewer devem ser diferentes; desvio exige reviewer_exception declarada',
        )
      }
    } else if (!isNull(front.reviewer_exception)) {
      errors.push(
        'state: reviewer_exception só vale com executor e reviewer iguais; limpe o campo',
      )
    }
  }

  if (front.work_class === 'bounded') {
    if (!isNull(front.active_spec))
      errors.push('state: bounded exige active_spec null')
    if (!isNull(front.active_plan))
      errors.push('state: bounded exige active_plan null')
    if (isNull(front.bounded_design))
      errors.push('state: bounded exige bounded_design preenchido')
    if (isNull(front.authorized_paths))
      errors.push('state: bounded exige authorized_paths preenchido')
  }

  if (front.work_class === 'architectural') {
    if (!isNull(front.bounded_design))
      errors.push('state: architectural exige bounded_design null')
    if (fromExecution && isNull(front.active_spec)) {
      errors.push(
        `state: ${current} (fase ${effective}) architectural exige active_spec`,
      )
    }
    if (fromExecution && isNull(front.active_plan)) {
      errors.push(
        `state: ${current} (fase ${effective}) architectural exige active_plan`,
      )
    }
  }
}

const checkBacklog = () => {
  const backlog = read('docs/superpowers/backlog.md')
  for (const heading of ['# AGORA', '# DEPOIS', '# DÉBITOS']) {
    if (!backlog.includes(heading))
      errors.push(`backlog: seção ausente ${heading}`)
  }
  if (backlog.includes('workflow_state')) {
    errors.push('backlog: fila não define fase; remova workflow_state')
  }
}

const checkClaudeMd = () => {
  const claude = read('CLAUDE.md')
  const agents = read('AGENTS.md')
  const notionId = 'collection://2f0e72ec-ef53-4e08-a466-312de7eea7d2'
  if (!claude.includes(notionId))
    errors.push('CLAUDE.md: canonical Notion data source missing')
  if (!agents.includes(notionId))
    errors.push('AGENTS.md: canonical Notion data source missing')
  for (const reference of [
    'docs/superpowers/state.md',
    'docs/superpowers/backlog.md',
    'progress.md',
  ]) {
    if (!claude.includes(reference))
      errors.push(`CLAUDE.md: referência ausente ${reference}`)
  }
}

const SKILL_CONTRACTS = [
  {
    name: 'context',
    path: '.agents/skills/site-context-packet/SKILL.md',
    markers: [
      'BEGIN SITE CONTEXT PACKET',
      'END SITE CONTEXT PACKET',
      'RECOMMENDED_TRANSITION',
    ],
    sections: [
      '## Objective',
      '## Non-goals',
      '## Input',
      '## Required local bootstrap',
      '## Git provenance',
      '## External retrieval',
      '## Source registry',
      '## Source priority',
      '## Unavailable sources',
      '## Divergence reconciliation',
      '## Compression budget',
      '## Status',
      '## Packet schema',
      '## Provenance and staleness',
      '## Output contract',
      '## Validation checklist',
      '## Common failure modes',
    ],
  },
  {
    name: 'execute',
    path: '.agents/skills/site-execute-task/SKILL.md',
    markers: [
      'BEGIN SITE EXECUTION REPORT',
      'END SITE EXECUTION REPORT',
      'RECOMMENDED_TRANSITION',
    ],
    sections: [
      '## Preconditions',
      '## Preflight',
      '## Prohibitions',
      '## Code',
      '## TDD',
      '## Evidence',
      '## Deviations',
      '## Output',
    ],
  },
  {
    name: 'review',
    path: '.agents/skills/site-review-task/SKILL.md',
    markers: [
      'BEGIN SITE REVIEW REPORT',
      'END SITE REVIEW REPORT',
      'RECOMMENDED_TRANSITION',
    ],
    sections: [
      '## Review dimensions',
      '## Severity',
      '## Evidence rule',
      '## Read-only',
      '## Output',
    ],
  },
]

const checkSkills = () => {
  for (const contract of SKILL_CONTRACTS) {
    const content = read(contract.path)
    for (const marker of contract.markers) {
      if (!content.includes(marker))
        errors.push(`${contract.name}: missing marker ${marker}`)
    }
    for (const section of contract.sections) {
      if (!content.includes(section))
        errors.push(`${contract.name}: seção ausente ${section}`)
    }
    for (const forbidden of ['.claude/**', '.agents/**']) {
      if (!content.includes(forbidden)) {
        errors.push(
          `${contract.name}: falta declarar ${forbidden} fora do alcance do Codex`,
        )
      }
    }
  }
}

const checkRules = () => {
  for (const rule of ['architecture', 'frontend', 'testing']) {
    const path = `.claude/rules/${rule}.md`
    const content = read(path)
    const front = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    const head = front?.[1]
    const body = front?.[2]
    if (head === undefined || body === undefined) {
      errors.push(`rules: ${path} sem frontmatter`)
      continue
    }
    if (!head.includes('paths:')) errors.push(`rules: ${path} sem paths:`)
    if (body.trim().length === 0) errors.push(`rules: ${path} sem corpo`)
  }
}

/** @param {string} rel */
const walk = (rel) => {
  const dir = resolve(rel)
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
}

const checkHarnessLimits = () => {
  if (exists('.claude/commands/desenvolver-site.md')) {
    errors.push('autonomous command must not exist during supervised bootstrap')
  }
  // Entrega autorizada por João em 2026-08-24: o fechamento publica a branch do bloco e abre PR.
  // A autorização vale só para o comando de fechamento; Codex e os demais comandos seguem proibidos.
  const DELIVERY_COMMAND = '.claude/commands/fechar-site.md'
  for (const file of [...walk('.claude'), ...walk('.agents')]) {
    if (file.replace(/\\/g, '/').endsWith(DELIVERY_COMMAND)) continue
    const content = readFileSync(file, 'utf8')
    for (const forbidden of ['git push', 'gh pr create']) {
      if (
        content.includes(forbidden) &&
        !content.includes(`não execute ${forbidden}`)
      ) {
        errors.push(`harness: ${file} contém "${forbidden}"`)
      }
    }
  }
}

if (errors.length === 0) {
  checkState()
  checkBacklog()
  checkClaudeMd()
  checkSkills()
  checkRules()
  checkHarnessLimits()
}

if (errors.length > 0) {
  console.error('Agent workflow contract invalid:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Agent workflow contract OK')
