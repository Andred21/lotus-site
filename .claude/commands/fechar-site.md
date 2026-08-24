---
description: Fecha o work item ativo somente após aceite e gates provados
argument-hint: [work-item]
disable-model-invocation: true
---

@docs/superpowers/state.md

# Fechar Site — $ARGUMENTS

Leia `state.md` primeiro. Exija `workflow_state: ready_for_closure` e correspondência exata do work item.

Em `blocked` com `resume_state: ready_for_closure` e `blocker` resolvido por João, restaure `workflow_state` para `resume_state`, limpe `blocker` e `resume_state`, e prossiga.

## Gate 0 — aceite específico

Execute a prova específica descrita no plano/Notion/spec. Ferramenta verde genérica não substitui esse critério.

## Gates técnicos atuais

Execute somente comandos realmente configurados:

```bash
pnpm agent:check
pnpm lint
pnpm exec tsc -b
pnpm build
```

`pnpm agent:check` valida o contrato do harness (estado, backlog, rules, skills), não o produto.

Quando Vitest/Playwright forem adicionados por tasks futuras, o próprio `CLAUDE.md`/plano passa a incluí-los. Não invoque runner inexistente.

## Integridade

- inspecione `git status --short` e o diff do work item;
- confirme ausência de arquivo/placeholder criado sem consumidor;
- confirme que nenhuma lei de `CLAUDE.md` foi contrariada;
- confirme árvore limpa: `git status --short` vazio e toda EAP do bloco com commit próprio;
- não escreva em Notion e não faça merge.

## Entrega

Autorizado por João em 2026-08-24: o fechamento publica a branch do bloco e abre o PR. Merge, e
qualquer escrita em Notion, continuam exigindo autorização explícita a cada vez.

Conduza o encerramento pela skill `finishing-a-development-branch`, e então:

```bash
git push -u origin <active_branch>
gh pr create --base main --head <active_branch> --title "<tipo>(<EAP>): <título do bloco>" --body-file <arquivo>
```

O corpo do PR traz, sem invenção: work item e EAP fechadas; critério de aceite de cada EAP com a
saída real que o provou; gates executados; achados da review com severidade e resolução; débitos
abertos; o que ficou fora de escopo.

Falha de push ou de `gh` para o fluxo em `blocked` com `resume_state: ready_for_closure`. Não
contorne por outro caminho e não anuncie PR que não existe — registre a URL devolvida pelo comando.

Não faça merge, não aprove o próprio PR, não apague a branch.

## Histórico

Acrescente uma linha a `docs/superpowers/historico/progress.md` com data, work item, executor, reviewer, resultado, paths da spec/plano/packet, branch e URL do PR.

## Estado final

Incremente `supervised_cycles_completed` em 1. Redefina para `null`: `work_class`, `active_work_item`, `active_notion_eap`, `active_title`, `active_branch`, `bounded_design`, `authorized_paths`, `resume_state`, `context_packet`, `active_spec`, `active_plan`, `executor`, `reviewer`, `blocker`. Defina `workflow_state: idle`, `next_owner: joao`, `next_action: select_work_item`, `last_completed_work_item: <item fechado>`.

Não promova o próximo item automaticamente. `workflow_mode` permanece `supervised` independentemente do contador.
