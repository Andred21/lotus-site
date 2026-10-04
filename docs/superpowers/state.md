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
next_action: enviar_formulario_real
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-09-28-7.2.3-7.2.4-backup-rollback-smoke-design.md
active_plan: docs/superpowers/plans/2026-09-29-7.2.3-7.2.4-backup-rollback-smoke.md
executor: claude
reviewer: codex
reviewer_exception: null
blocker: 'Portão humano do plano, Task 16 Step 4 (spec D11): o envio real do formulário. Num navegador com lotusotec.cl e www.lotusotec.cl forçados para a distribuição (3.166.160.83, borda de dhpoztt69jydz.cloudfront.net, por --host-resolver-rules num perfil novo do Edge ou do Chrome), João abre https://lotusotec.cl/, confere o cadeado (certificado da Amazon), envia o formulário com a mensagem smoke 7.2.4 2026-10-04 e confirma a chegada em contacto@lotusotec.cl (assunto Nuevo mensaje desde el sitio de Lotus OTEC); responde com a hora do envio, a da chegada e o texto, sem o e-mail usado no campo. Task 15 fechada: change set bef63f37 executado por João, stack UPDATE_COMPLETE às 22:26:55Z, distribuição Deployed, apex 200 e www 301 pela distribuição, RenewalEligibility ELIGIBLE. Smoke verde nas duas formas (10 passed cada) depois da correção b23fe46: o item 3 exigia a ordem da URL entre chaves diferentes da query, que o CloudFront não entrega à função. Depois do envio: evidência de 7.2.4 (Step 5) e commit; Tasks 17 e 18.'
supervised_cycles_completed: 18
last_completed_work_item: 7.2.2
state_basis_commit: b23fe46
updated_at: 2026-10-04T22:38:19Z
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
