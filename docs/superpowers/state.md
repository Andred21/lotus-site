---
schema_version: 1
workflow_mode: supervised
workflow_state: blocked
work_class: architectural
active_work_item: revisao-arquitetura-2026-09
active_notion_eap: null
active_title: 'Revisão de arquitetura de 2026-09 — candidatos de aprofundamento (bloco B9)'
active_branch: refactor/revisao-arquitetura
bounded_design: null
authorized_paths: null
next_owner: joao
next_action: decidir_comentario_do_yaml_mjs
resume_state: reviewing
context_packet: null
active_spec: docs/superpowers/specs/2026-10-17-revisao-arquitetura-design.md
active_plan: docs/superpowers/plans/2026-10-17-revisao-arquitetura.md
executor: claude
reviewer: claude
reviewer_exception: 'Autorizado por João em 2026-10-17: Codex sem cota; Claude executa e faz a review formal. Sem segunda lente independente; débito D-77.'
blocker: 'Achado R-2 da review (important, exige decisão): o cabeçalho de scripts/infra/lib/yaml.mjs (linhas 3-7) ainda diz que os leitores de zona.mjs, cabecalhos.mjs e distribuicao.mjs "recortam um recurso cada um, por coluna"; desde o candidato 01 eles navegam a árvore do lerYaml por template.mjs. Corrigir exige editar yaml.mjs, que o plano congela ("yaml.mjs não muda", Global Constraints; Task 1 Step 10 confere o arquivo intocado). Decisão de João: (a) autorizar a correção só do comentário, com os dois exports e os testes de hoje intactos (spec D6); ou (b) manter o arquivo como está e registrar o comentário como sugestão no fechamento. Blocking R-1 (comentário de RedirecionarWww em infra/lotus-site.yaml exigindo FunctionCode na última posição) corrigido em 30474d3. Gates na review: pnpm check exit 0 em 6353469 (45 arquivos, 432 testes); pnpm e2e exit 0 (78 testes, nenhum snapshot regravado); check na árvore espelhada exit 0 (38 arquivos, 370 testes); conferir-zona ao vivo exit 0 com --nameservers, porque a credencial AWS local foi recusada; depois do R-1, format:check exit 0 e vitest de scripts/infra exit 0 (197 testes).'
supervised_cycles_completed: 23
last_completed_work_item: 7.2.7
state_basis_commit: 30474d3
updated_at: 2026-10-17T17:16:02Z
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
