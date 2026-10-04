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
next_action: executar_change_set_lotus_site
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-09-28-7.2.3-7.2.4-backup-rollback-smoke-design.md
active_plan: docs/superpowers/plans/2026-09-29-7.2.3-7.2.4-backup-rollback-smoke.md
executor: claude
reviewer: codex
reviewer_exception: null
blocker: 'Portão humano do plano, Task 15 Step 3: executar o change set do lotus-site em sa-east-1 (arn:aws:cloudformation:sa-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791152307/bef63f37-78c0-409e-97f3-a4675afa5382; duas linhas, RedirecionarWww Add e Distribuicao Modify False; na distribuição só entram Aliases lotusotec.cl e www.lotusotec.cl, ViewerCertificate do ACM db812e1a, sni-only, TLSv1.2_2021, e a FunctionAssociation viewer-request no behavior padrão; parâmetros iguais aos do stack, só ArnDoCertificadoDoDominio novo; corpo igual ao template de 5d0a41b, salvo comentários com ?). Muda a distribuição pública; o DNS não muda, apex e www seguem no WordPress. Como nos estágios 4b a 5, João roda o t15-deploy.sh do scratchpad desta sessão, que confere change set, corpo, mudanças, stack, certificado e distribuição antes do execute, espera UPDATE_COMPLETE e Deployed e faz a prova rápida do Step 4. Tasks 11 e 12 fechadas (c0a5428, 6f72841). Task 16 (envio real, D11) e 17 seguem com autorização própria.'
supervised_cycles_completed: 18
last_completed_work_item: 7.2.2
state_basis_commit: 6f72841
updated_at: 2026-10-04T22:22:08Z
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
