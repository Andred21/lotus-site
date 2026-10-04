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
next_action: decidir_criterio_401_e_autorizar_estagio_1
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-09-28-7.2.3-7.2.4-backup-rollback-smoke-design.md
active_plan: docs/superpowers/plans/2026-09-29-7.2.3-7.2.4-backup-rollback-smoke.md
executor: claude
reviewer: codex
reviewer_exception: null
blocker: 'Portões humanos do plano. (1) Task 4, critério de spec §4.3: o ensaio (ENSAIO_DESATIVAR_MU_PLUGINS=wp-stack-cache) passou em home 200, title/H1/texto iguais e wp-login 200, e reprova só por 401 em https://lotusotec.cl/wp-json/wp/v2/users/me?context=edit&_locale=user; o vivo responde o mesmo 401 rest_not_logged_in a visitante anônimo (no Chromium do vivo a chamada nem acontece porque o rest-nonce fica pendurado). O critério literal é toda resposta da cópia < 400: João decide entre (A) contar só erro da cópia que difere do vivo na mesma URL, (B) exceção nominal para users/me 401, (C) manter o literal e registrar a Task 4 como reprovada. O PHP Fatal ainda não foi medido (o script para na primeira reprovação). §1 da evidência está preenchido e não commitado. (2) Task 6 Step 4: autorização explícita para executar o change set do estágio 1 do lotus-dns (arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1790897359/fd567112-6aa8-4c97-b388-612c3a206e6d; uma linha, Modify Registros False; só cria ensaio-corte A/AAAA no WordPress, TTL 3600). O template e o INVENTARIO do estágio 1 estão editados e não commitados (infra/lotus-dns.yaml, scripts/infra/lib/zona.mjs); o --aquecer roda logo antes do execute. Tasks 7–12 e 15–17 seguem com autorização própria a cada passo.'
supervised_cycles_completed: 18
last_completed_work_item: 7.2.2
state_basis_commit: f637a62
updated_at: 2026-10-04T16:15:21Z
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
