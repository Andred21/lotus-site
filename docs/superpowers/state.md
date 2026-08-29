---
schema_version: 1
workflow_mode: supervised
workflow_state: blocked
work_class: architectural
active_work_item: 6.1.1-6.3.1
active_notion_eap: '6.1.1, 6.1.2, 6.1.3, 6.1.4, 6.2.1, 6.2.2, 6.2.3, 6.3.1'
active_title: QA visual e performance — Sprint 5
active_branch: feat/6-1-1-6-3-1-qa-visual-performance
bounded_design: null
authorized_paths: null
next_owner: joao
next_action: resolve_blocker
resume_state: reviewing
context_packet: docs/superpowers/context-packets/6.1.1-6.3.1.md
active_spec: docs/superpowers/specs/2026-08-29-6.1.1-6.3.1-qa-visual-performance-design.md
active_plan: docs/superpowers/plans/2026-08-29-6.1.1-6.3.1-qa-visual-performance.md
executor: claude
reviewer: codex
blocker: >-
  Achados R-1 a R-7 aplicados e commitados (006c743, c7e01b6, 18f2464, ac02945, dd1d9e1); pnpm check exit 0 com 135 testes e pnpm e2e exit 0 com 67 testes, executados nesta rodada. Faltam duas decisões. (a) R-2: a causa do resíduo de altura foi medida elemento a elemento e classificada como spacing, mas a correção mexe em cinco seções nas quatro larguras e obriga recaptura, nova ratificação (D2) e novos snapshots — ficou como D-24, linha 'Altura vertical das seções' pendente decisão na matriz, e a homologação caiu para 'aprovado com ressalva'. João decide: corrigir dentro deste bloco ou fechar com o débito declarado. (b) A segunda passada do reviewer (Codex) sobre os commits de correção não rodou — limite de uso da conta Codex, 'You've hit your usage limit ... try again at 10:29 AM'. Por D7 da spec, os dois achados da lente de Claude seguem sem confirmação e não viram correção: C-1 (peso real das fontes, D-23, é divergência visual não catalogada na matriz — hoje só com ressalva na homologação) e C-3 (e2e/regressao-visual.spec.ts roda no projeto chromium, contra o dev server, enquanto o preload que ele guarda só existe no build de produção). João decide: esperar a cota do Codex ou fechar com os dois registrados.
supervised_cycles_completed: 8
last_completed_work_item: 5.1.1-5.3.2
state_basis_commit: dd1d9e1
updated_at: 2026-08-29T11:25:00Z
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
