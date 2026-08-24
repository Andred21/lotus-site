---
description: Executa somente o plano ativo do Lotus Site
argument-hint: [work-item]
disable-model-invocation: true
---

@docs/superpowers/state.md

# Executar Site — $ARGUMENTS

Leia `state.md` primeiro. Aceite somente `ready_for_execution` ou `executing`, para o mesmo `active_work_item`.

Em `blocked` com `resume_state` igual a `ready_for_execution` ou `executing` e `blocker` resolvido por João, restaure `workflow_state` para `resume_state`, limpe `blocker` e `resume_state`, e prossiga.

Antes de tocar código, exija coerência entre `work_class`, contexto e árvore Git, além de executor/reviewer diferentes.

- `architectural`: exija `active_spec` e `active_plan`;
- `bounded`: exija `active_spec: null`, `active_plan: null`, `bounded_design` e `authorized_paths`.

Divergência => `blocked`.

Ao iniciar, mova para `executing` com `next_owner: claude` e `next_action: continue_active_plan` (`continue_active_work_item` em `bounded`) no primeiro artefato durável da execução.

Use a técnica Superpowers indicada pelo plano; em `bounded`, a indicada pelo `bounded_design` aprovado.

Carregue antes de editar as rules de `.claude/rules/` cujos `paths` casam com os arquivos tocados.

- `executor: claude` => Claude executa o plano.
- `executor: codex` => delegue `site-execute-task` com work item, base commit e `authorized_paths`; inclua `plan_path` em architectural ou `bounded_design` em bounded.

Depois de delegação Codex, Claude deve executar `git status --short` e revisar o `git diff` real contra plano e paths. Relatório não substitui diff.

## Commits

Antes do primeiro artefato durável, confirme `git branch --show-current` igual a `active_branch`.
Divergência, ou execução em `main`, para em `blocked`.

Commite cada task do bloco assim que o critério de aceite dela estiver provado — não acumule tudo
para o fim:

- um commit por EAP, Conventional Commits com o EAP no escopo: `feat(1.2.2): fixar Node 24.19.0 e engines`;
- `docs/superpowers/state.md` entra no commit da task que ele descreve;
- correção vinda da review vira commit próprio (`fix(<EAP>): …`); não reescreva histórico já revisado;
- commit só depois da prova real do critério; não commite gate reprovando;
- não faça push aqui. Publicação e PR são exclusivos de `/fechar-site`.

Execução delegada ao Codex não commita: Claude revisa o diff e cria o commit.

Rode as verificações exigidas pelo plano/`CLAUDE.md`; em `bounded`, as exigidas pelo `bounded_design` aprovado mais os gates de `.claude/rules/testing.md`. Se tasks e critérios previstos estiverem provados, atualize para `ready_for_review`, `next_owner` igual ao reviewer e `next_action: review_active_work_item`.

Não inicie review automaticamente.
