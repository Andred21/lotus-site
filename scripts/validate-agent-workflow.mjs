import { existsSync, readFileSync } from 'node:fs'

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
  'docs/superpowers/historico/progress.md',
]

const errors = []

for (const path of required) {
  if (!existsSync(path)) errors.push(`missing: ${path}`)
}

if (errors.length === 0) {
  const read = (path) => readFileSync(path, 'utf8')
  const state = read('docs/superpowers/state.md')
  const claude = read('CLAUDE.md')
  const agents = read('AGENTS.md')
  const contextSkill = read('.agents/skills/site-context-packet/SKILL.md')
  const executeSkill = read('.agents/skills/site-execute-task/SKILL.md')
  const reviewSkill = read('.agents/skills/site-review-task/SKILL.md')

  const documentedStates = [
    'idle',
    'context_required',
    'ready_for_planning',
    'planning',
    'ready_for_execution',
    'executing',
    'ready_for_review',
    'reviewing',
    'ready_for_closure',
    'blocked',
  ]

  if (!state.includes('workflow_mode: supervised')) {
    errors.push('state: workflow_mode must start supervised')
  }
  if (!state.includes('workflow_state: idle')) {
    errors.push('state: workflow_state must start idle')
  }
  for (const value of documentedStates) {
    if (!state.includes('`' + value + '`')) {
      errors.push(`state: missing documented state ${value}`)
    }
  }

  const notionId = 'collection://2f0e72ec-ef53-4e08-a466-312de7eea7d2'
  if (!claude.includes(notionId)) errors.push('CLAUDE.md: canonical Notion data source missing')
  if (!agents.includes(notionId)) errors.push('AGENTS.md: canonical Notion data source missing')

  const contracts = [
    ['context', contextSkill, ['BEGIN SITE CONTEXT PACKET', 'END SITE CONTEXT PACKET', 'RECOMMENDED_TRANSITION']],
    ['execute', executeSkill, ['BEGIN SITE EXECUTION REPORT', 'END SITE EXECUTION REPORT', 'RECOMMENDED_TRANSITION']],
    ['review', reviewSkill, ['BEGIN SITE REVIEW REPORT', 'END SITE REVIEW REPORT', 'RECOMMENDED_TRANSITION']],
  ]

  for (const [name, content, markers] of contracts) {
    for (const marker of markers) {
      if (!content.includes(marker)) errors.push(`${name}: missing marker ${marker}`)
    }
  }

  if (existsSync('.claude/commands/desenvolver-site.md')) {
    errors.push('autonomous command must not exist during supervised bootstrap')
  }
}

if (errors.length > 0) {
  console.error('Agent workflow contract invalid:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Agent workflow contract OK')
