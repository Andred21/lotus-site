---
schema_version: 1
workflow_mode: supervised
workflow_state: ready_for_review
work_class: bounded
active_work_item: refactor-contato-intake
active_notion_eap: null
active_title: 'Consolidar o intake do contato e unificar o contrato em lib'
active_branch: refactor/contato-intake
bounded_design: 'Refactor sem mudança de comportamento em dois commits: unificar a união de resultado do contato como ContactSubmitResult em src/lib/contact-schema.ts com catraca de lint contra zod em componente, e consolidar submit.ts, service.ts e sender.ts em src/integrations/contact/intake.ts (createContactIntake), com CONTEXT.md e ADR-SITE-003; desenho completo em docs/superpowers/bounded-designs/refactor-contato-intake.md; prova é pnpm check mais pnpm e2e completo.'
authorized_paths: 'src/integrations/contact/**, src/lib/contact-schema.ts, src/components/sections/ContactForm.tsx, src/components/sections/ContactForm.test.tsx, src/app/App.tsx, eslint.config.js, CONTEXT.md, docs/adr/ADR-SITE-003.md, docs/superpowers/bounded-designs/refactor-contato-intake.md'
next_owner: codex
next_action: review_active_work_item
resume_state: null
context_packet: null
active_spec: null
active_plan: null
executor: claude
reviewer: codex
blocker: null
supervised_cycles_completed: 9
last_completed_work_item: 6.1.1-6.3.1
state_basis_commit: 82bc812
updated_at: 2026-08-29T12:41:45Z
---

# Estado operacional — Lotus Site

> Fonte única da fase atual. Histórico, Notion, commits e existência de arquivos não promovem trabalho.

## Estados válidos

| Estado                | Próxima ação permitida                         |
| --------------------- | ---------------------------------------------- |
| `idle`                | selecionar explicitamente um work item         |
| `context_required`    | gerar/atualizar Context Packet                 |
| `ready_for_planning`  | iniciar planejamento                           |
| `planning`            | continuar brainstorming/spec/plano             |
| `ready_for_execution` | iniciar execução do plano                      |
| `executing`           | continuar somente o plano ativo                |
| `ready_for_review`    | iniciar revisão independente                   |
| `reviewing`           | continuar review/correções aprovadas           |
| `ready_for_closure`   | executar fechamento                            |
| `blocked`             | resolver `blocker` e retornar a `resume_state` |

## Invariantes

- Existe no máximo um `active_work_item`.
- Todo estado diferente de `idle` tem `active_branch` preenchida e diferente de `main`;
  a branch nasce em `/planejar-site` e morre no PR aberto por `/fechar-site`.
- `work_class` é `bounded` ou `architectural` a partir de `ready_for_execution`; em `planning` ainda pode ser `null`.
- `architectural` exige `active_spec` e `active_plan` antes de `ready_for_execution`.
- `bounded` mantém `active_spec` e `active_plan` nulos e persiste apenas `bounded_design` curto + `authorized_paths`.
- `executor` e `reviewer` devem ser diferentes a partir de `ready_for_execution`.
- `context_packet` é obrigatório quando o trabalho depende de fonte externa.
- Work item, Context Packet, spec e plano devem apontar para o mesmo escopo.
- Claude é o único escritor deste arquivo pelo contrato do harness.
- Nenhum agente seleciona automaticamente o próximo item.
- Divergência operacional leva a `blocked`; não reconstrua a fase por heurística.
- Toda escrita neste arquivo carimba `updated_at` e `state_basis_commit`.
