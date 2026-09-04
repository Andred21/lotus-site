---
schema_version: 1
workflow_mode: supervised
workflow_state: ready_for_review
work_class: architectural
active_work_item: 7.1.1+7.1.2+7.1.5
active_notion_eap: 7.1.1, 7.1.2, 7.1.5
active_title: Deploy AWS S3 + CloudFront com CD pelo espelho Gatika-CL
active_branch: feat/7-1-1-7-1-2-7-1-5-deploy-aws
bounded_design: null
authorized_paths: null
next_owner: codex
next_action: review_active_work_item
resume_state: null
context_packet: null
active_spec: docs/superpowers/specs/2026-09-03-7.1.1-7.1.2-7.1.5-deploy-aws-design.md
active_plan: docs/superpowers/plans/2026-09-03-7.1.1-7.1.2-7.1.5-deploy-aws.md
executor: claude
reviewer: codex
reviewer_exception: null
blocker: null
supervised_cycles_completed: 12
last_completed_work_item: paridade-header-cursos
state_basis_commit: ac58e9f
updated_at: 2026-09-04T18:57:18Z
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
- `executor` e `reviewer` devem ser diferentes a partir de `ready_for_execution`. Agente
  indisponível é exceção declarada, não silenciosa: `reviewer_exception` carrega motivo, data e
  quem autorizou, e o desvio vira débito no backlog. Sem ela, agente igual nos dois papéis é erro
  de `pnpm agent:check`; com executor e reviewer diferentes, o campo precisa estar limpo.
- `context_packet` é obrigatório quando o trabalho depende de fonte externa.
- Work item, Context Packet, spec e plano devem apontar para o mesmo escopo.
- Claude é o único escritor deste arquivo pelo contrato do harness.
- Nenhum agente seleciona automaticamente o próximo item.
- Divergência operacional leva a `blocked`; não reconstrua a fase por heurística.
- Toda escrita neste arquivo carimba `updated_at` e `state_basis_commit`.
