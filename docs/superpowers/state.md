---
schema_version: 1
workflow_mode: supervised
workflow_state: ready_for_execution
work_class: architectural
active_work_item: 1.1.6
active_notion_eap: 1.1.6
active_title: "Endurecer workflow agentic e criar backlog operacional"
bounded_design: null
authorized_paths: null
next_owner: claude
next_action: execute_active_work_item
resume_state: null
context_packet: null
active_spec: docs/superpowers/specs/2026-08-24-1.1.6-agentic-workflow-hardening-design.md
active_plan: docs/superpowers/plans/2026-08-24-1.1.6-agentic-workflow-hardening.md
executor: claude
reviewer: codex
blocker: null
supervised_cycles_completed: 1
last_completed_work_item: 1.1.4
state_basis_commit: 74b5ec2830d7d9323183442855a9273abd3c66f3
updated_at: 2026-08-24T18:05:00Z
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
- `work_class` é `bounded` ou `architectural` enquanto houver item ativo.
- `architectural` exige `active_spec` e `active_plan` antes de `ready_for_execution`.
- `bounded` mantém `active_spec` e `active_plan` nulos e persiste apenas `bounded_design` curto + `authorized_paths`.
- `executor` e `reviewer` devem ser diferentes a partir de `ready_for_execution`.
- `context_packet` é obrigatório quando o trabalho depende de fonte externa.
- Work item, Context Packet, spec e plano devem apontar para o mesmo escopo.
- Claude é o único escritor deste arquivo pelo contrato do harness.
- Nenhum agente seleciona automaticamente o próximo item.
- Divergência operacional leva a `blocked`; não reconstrua a fase por heurística.
- Toda escrita neste arquivo carimba `updated_at` e `state_basis_commit`.
