---
schema_version: 1
workflow_mode: supervised
workflow_state: executing
work_class: bounded
active_work_item: paridade-header-cursos
active_notion_eap: null
active_title: 'Paridade — fundo do cabeçalho desktop e dimensionamento das imagens dos cards de curso'
active_branch: fix/paridade-header-cursos
bounded_design: 'Reproduzir duas medicoes feitas em 2026-09-02 contra https://lotusotec.cl/: o fundo de #main-header e #000000 opaco em 1440/1920 (o #f8f8f8 de --color-header veio de artefato de rasterizacao do fullPage em capture-baseline.mjs, nao do site) e as imagens dos cards de curso seguem max-width:100% + height:auto sobre o tamanho intrinseco de cada asset (400x300 no card 1, 250x250 quadrado nos cards 2 e 3), centralizadas, com 30px ate o nome do curso; desenho completo, tabelas de medicao e os cinco commits em docs/superpowers/bounded-designs/paridade-header-cursos.md; prova e o relatorio de paridade de docs/qa/paridade/2026-09-02/ mais pnpm check e pnpm e2e completo.'
authorized_paths: 'src/index.css, src/components/layout/Header.tsx, src/components/layout/Header.test.tsx, src/components/sections/Cursos.tsx, src/components/sections/Cursos.test.tsx, e2e/a11y-exceptions.ts, e2e/regressao-visual.spec.ts-snapshots/**, scripts/qa/medir-header-cursos.mjs, scripts/qa/lib/header-cursos.mjs, scripts/qa/lib/header-cursos.test.mjs, docs/qa/paridade/2026-09-02/**, docs/inventario/04-tipografia.md, docs/inventario/README.md, docs/superpowers/bounded-designs/paridade-header-cursos.md, docs/superpowers/state.md, docs/superpowers/backlog.md, docs/superpowers/historico/progress.md'
next_owner: claude
next_action: continue_active_work_item
resume_state: null
context_packet: null
active_spec: null
active_plan: null
executor: claude
reviewer: codex
reviewer_exception: null
blocker: null
supervised_cycles_completed: 11
last_completed_work_item: paridade-espacamento-fontes
state_basis_commit: f19ee29
updated_at: 2026-09-02T21:45:00Z
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
