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
next_action: decidir_prova_do_log_do_formulario
resume_state: reviewing
context_packet: null
active_spec: docs/superpowers/specs/2026-10-04-7.2.5-cutover-lotusotec-design.md
active_plan: docs/superpowers/plans/2026-10-04-7.2.5-cutover-lotusotec.md
executor: claude
reviewer: claude
reviewer_exception: 'Autorizado por João em 2026-10-05: cota da conta Codex esgotada, Claude executa e revisa o bloco. Sem segunda lente independente; débito D-65.'
blocker: 'Achado R-1 da review (important, exige decisão): a spec de 7.2.5, §7 item 4, prova o envio real pelo log da função com desfecho: enviado e pela mensagem em contacto@lotusotec.cl. A linha do log não foi lida (o aws logs tail foi recusado pela política de permissão do agente, por trazer dados pessoais do formulário); a chegada da mensagem, com captura de tela, ficou no lugar dela por escolha do executor, sem decisão de João (evidência §6.5 e Limites declarados). Decisão de João: (a) rodar ele mesmo aws logs tail no log group da função de contato, janela de 2026-10-05T14:20Z a 14:30Z, e trazer só a linha com desfecho, para entrar em §6.5; ou (b) aceitar a chegada da mensagem como prova suficiente do item 4, registrado como desvio aceito por ele na evidência. Achado blocking R-0 (sonda 7 em §1.4) já corrigido em ee3b200. Gates: pnpm check e pnpm e2e verdes em 5e77bb7.'
supervised_cycles_completed: 19
last_completed_work_item: 7.2.3+7.2.4
state_basis_commit: ee3b200
updated_at: 2026-10-05T23:45:30Z
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
