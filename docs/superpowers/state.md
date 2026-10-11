---
schema_version: 1
workflow_mode: supervised
workflow_state: ready_for_review
work_class: bounded
active_work_item: recaptura-baseline
active_notion_eap: null
active_title: 'Recaptura do baseline — D-30 e a conferência humana de paridade'
active_branch: fix/recaptura-baseline
bounded_design: 'Capturas de referência voltam ao WordPress por 185.146.167.195 com guarda contra CloudFront; captura de página inteira compõe o topo do viewport sobre o fullPage; recaptura dos cinco PNG do baseline, reamostragem da paleta e rodada referência × produção com folha de contato para a conferência humana de João, cujo veredito entra no fechamento. Desenho e medições em docs/superpowers/bounded-designs/recaptura-baseline.md; src/ não muda.'
authorized_paths: 'scripts/inventario/lib/site.mjs, scripts/inventario/lib/site.test.mjs, scripts/inventario/capture-baseline.mjs, scripts/inventario/sample-baseline.mjs, scripts/inventario/comparar-png.mjs, scripts/qa/capture-referencia.mjs, scripts/qa/capture-clone.mjs, scripts/qa/lib/paridade.mjs, scripts/qa/lib/paridade.test.mjs, scripts/qa/medir-espacamento.mjs, scripts/qa/medir-header-cursos.mjs, docs/inventario/baseline/**, docs/inventario/04-tipografia.md, docs/inventario/06-baseline.md, docs/inventario/README.md, docs/qa/paridade/**, docs/superpowers/bounded-designs/recaptura-baseline.md, docs/superpowers/backlog.md, docs/superpowers/state.md, docs/superpowers/historico/progress.md'
next_owner: codex
next_action: review_active_work_item
resume_state: null
context_packet: null
active_spec: null
active_plan: null
executor: claude
reviewer: codex
reviewer_exception: null
blocker: null
supervised_cycles_completed: 21
last_completed_work_item: 7.2.6
state_basis_commit: a0a9bcc
updated_at: 2026-10-11T18:19:42Z
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
