---
schema_version: 1
workflow_mode: supervised
workflow_state: blocked
work_class: architectural
active_work_item: 7.2.3+7.2.4
active_notion_eap: 7.2.3+7.2.4
active_title: Backup e rollback do WordPress antes do corte; smoke test completo em produção (bloco `B4`)
active_branch: feat/7-2-3-7-2-4-backup-smoke-test
bounded_design: null
authorized_paths: null
next_owner: joao
next_action: autorizar_estagio_3
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-09-28-7.2.3-7.2.4-backup-rollback-smoke-design.md
active_plan: docs/superpowers/plans/2026-09-29-7.2.3-7.2.4-backup-rollback-smoke.md
executor: claude
reviewer: codex
reviewer_exception: null
blocker: 'Portão humano do plano, Task 8 Step 3: autorização explícita para executar o change set do estágio 3 do lotus-dns (arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791134961/2384c734-41ee-471b-bd82-69c867570811; uma linha, Modify Registros False; o diff antes/depois por nome e tipo muda só ensaio-corte A/AAAA, de alias de dhpoztt69jydz.cloudfront.net para WordPress TTL 3600; apex e www intactos). Template e INVENTARIO restaurados de 2f2ab46 e não commitados (infra/lotus-dns.yaml, scripts/infra/lib/zona.mjs). Execução não antes de 2026-10-04T18:19Z: o WordPress que o aquecimento do estágio 2 pôs nos caches públicos (TTL 3600) só expira então; o script espera, confere por amostragem que não sobrou WordPress em cache, aquece e só então executa. Tasks 9–11 e 15–17 seguem com autorização própria a cada passo; o 4b exige ao menos 1 h depois do 4a.'
supervised_cycles_completed: 18
last_completed_work_item: 7.2.2
state_basis_commit: 8ec27c7
updated_at: 2026-10-04T17:33:36Z
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
