---
schema_version: 1
workflow_mode: supervised
workflow_state: ready_for_execution
work_class: architectural
active_work_item: 1.2.4-1.3.9
active_notion_eap: "1.2.4, 1.2.5, 1.3.1, 1.3.2, 1.3.3, 1.3.4, 1.3.5, 1.3.6, 1.3.7, 1.3.8, 1.3.9"
active_title: "Tooling e qualidade — Sprint 0 restante"
active_branch: chore/1-2-4-1-3-9-tooling-qualidade
bounded_design: null
authorized_paths: null
next_owner: claude
next_action: execute_active_work_item
resume_state: null
context_packet: docs/superpowers/context-packets/1.2.4-1.3.9.md
active_spec: docs/superpowers/specs/2026-08-24-1.2.4-1.3.9-tooling-qualidade-design.md
active_plan: docs/superpowers/plans/2026-08-24-1.2.4-1.3.9-tooling-qualidade.md
executor: claude
reviewer: codex
blocker: null
supervised_cycles_completed: 3
last_completed_work_item: 1.2.2+1.2.3
state_basis_commit: 2caa62a
updated_at: 2026-08-24T00:00:00Z
---

# Estado operacional — Lotus Site

> Fonte única da fase atual. Histórico, Notion, commits e existência de arquivos não promovem trabalho.

## Estados válidos

| Estado | Próxima ação permitida |
|---|---|
| `idle` | selecionar explicitamente um work item |
| `context_required` | gerar/atualizar Context Packet |
| `ready_for_planning` | iniciar planejamento |
| `planning` | continuar brainstorming/spec/plano |
| `ready_for_execution` | iniciar execução do plano |
| `executing` | continuar somente o plano ativo |
| `ready_for_review` | iniciar revisão independente |
| `reviewing` | continuar review/correções aprovadas |
| `ready_for_closure` | executar fechamento |
| `blocked` | resolver `blocker` e retornar a `resume_state` |

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
