---
schema_version: 1
workflow_mode: supervised
workflow_state: blocked
work_class: architectural
active_work_item: 7.2.5
active_notion_eap: 7.2.5
active_title: Realizar cutover do lotusotec.cl para o novo site (bloco `B5`)
active_branch: feat/7-2-5-cutover-lotusotec
bounded_design: null
authorized_paths: null
next_owner: joao
next_action: enviar_formulario_e_rodar_validadores
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-10-04-7.2.5-cutover-lotusotec-design.md
active_plan: docs/superpowers/plans/2026-10-04-7.2.5-cutover-lotusotec.md
executor: claude
reviewer: claude
reviewer_exception: 'Autorizado por João em 2026-10-05: cota da conta Codex esgotada, Claude executa e revisa o bloco. Sem segunda lente independente; débito D-65.'
blocker: 'Portão do envio real e dos validadores (Task 8, Step 6). Corte feito: commit 515a13f, execute 2026-10-05T14:12:23Z, UPDATE_COMPLETE 14:13:31Z, sete resolvedores na borda em até 64 s. Steps 1 a 4: smoke pós-corte pela resolução pública 10 passed às 14:14:48Z, SHA ca8f49b, X-Robots-Tag ausente; conferir-zona --pos-delegacao saída 0, 19 sim, apex e www como alias; latência com as sondas de 2gCnAzOrC1AsubQxh00021G5S (medição 2HgotqDwMinYcrZbK00021GG0): 10 de 10 com HTTP 200 e x-amz-cf-pop, total mediana 383 ms contra 74 ms do WordPress, condição de D-65 atendida; certificado ISSUED, ELIGIBLE, em uso por E1R7SPH4OLUIEQ, até 2027-04-11. Pedido a João, num navegador comum sem hosts: (1) abrir https://lotusotec.cl/, conferir o cadeado da Amazon, enviar o formulário com assunto identificável (corte 7.2.5 2026-10-05) e confirmar a chegada em contacto@lotusotec.cl com hora e assunto; (2) passar https://lotusotec.cl/ no Rich Results Test, no Schema Markup Validator, no Sharing Debugger do Facebook e no Post Inspector do LinkedIn e trazer o resultado de cada um. Não commitado: docs/infra/conferencia-zona-2026-10-05.md. Congelamento segue até o fim da Task 8.'
supervised_cycles_completed: 19
last_completed_work_item: 7.2.3+7.2.4
state_basis_commit: 515a13f
updated_at: 2026-10-05T14:20:00Z
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
