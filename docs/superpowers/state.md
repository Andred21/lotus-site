---
schema_version: 1
workflow_mode: supervised
workflow_state: ready_for_review
work_class: architectural
active_work_item: 3.1.1-3.2.11
active_notion_eap: '3.1.1, 3.1.2, 3.1.3, 3.1.4, 3.2.1, 3.2.2, 3.2.3, 3.2.4, 3.2.5, 3.2.6, 3.2.7, 3.2.8, 3.2.9, 3.2.10, 3.2.11'
active_title: 'Clone estático — Sprint 2: paridade visual e de conteúdo'
active_branch: feat/3-1-1-3-2-11-clone-estatico
bounded_design: null
authorized_paths: null
next_owner: codex
next_action: review_active_work_item
resume_state: null
context_packet: docs/superpowers/context-packets/3.1.1-3.2.11.md
active_spec: docs/superpowers/specs/2026-08-25-3.1.1-3.2.11-clone-estatico-design.md
active_plan: docs/superpowers/plans/2026-08-25-3.1.1-3.2.11-clone-estatico.md
executor: claude
reviewer: codex
blocker: null
supervised_cycles_completed: 5
last_completed_work_item: 2.1.1-2.1.10
state_basis_commit: 8630c55
updated_at: 2026-08-26T14:00:00Z
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
