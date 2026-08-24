---
description: Planeja um work item do Lotus Site pelo estado operacional
argument-hint: [EAP ou work-item]
disable-model-invocation: true
---

@docs/superpowers/state.md

# Planejar Site — $ARGUMENTS

Leia `state.md` primeiro.

## Entrada

- Aceite somente `idle`, `context_required`, `ready_for_planning` ou `planning`. Outro estado é recusado com ponteiro para o comando correto: `ready_for_execution`/`executing` → `/executar-site`; `ready_for_review`/`reviewing` → `/revisar-site`; `ready_for_closure` → `/fechar-site`.
- Em `blocked` com `resume_state` entre os estados aceitos acima e `blocker` resolvido por João, restaure `workflow_state` para `resume_state`, limpe `blocker` e `resume_state`, e prossiga.
- Em `idle`, `$ARGUMENTS` é obrigatório e seleciona somente o item explicitamente informado.
- Fora de `idle`, o argumento deve corresponder a `active_work_item`.
- Nunca escolha a próxima task por ordem do Notion, commits ou histórico.

## Seleção

Se o argumento tiver forma EAP (`N.N.N`), consulte exatamente essa EAP no data source Notion `collection://2f0e72ec-ef53-4e08-a466-312de7eea7d2`. Registre título, EAP, critério de aceite e dependências. Dependência não comprovadamente satisfeita bloqueia o fluxo; não marque nada no Notion.

## Branch do bloco

Ao sair de `idle`, antes de qualquer artefato durável, crie a branch do bloco a partir de `main` atualizada:

```bash
git switch main
git pull --ff-only
git switch -c <tipo>/<item>-<slug-curto>
```

`<tipo>` segue Conventional Commits (`feat`, `fix`, `chore`, `docs`, `refactor`). Substitua `+` e `.` do
work item por `-` no slug. Grave o nome em `active_branch`.

Um bloco é uma branch e vira um PR. Nunca planeje, execute ou commite em `main`. Árvore suja com
mudança que não pertence ao bloco para o fluxo em `blocked`; não misture trabalho alheio na branch.

Retomada de bloco já iniciado reaproveita `active_branch`; não crie branch nova.

## Contexto

Se o trabalho depender de Notion, Drive, site de referência, Figma ou outra fonte externa, transicione para `context_required`, defina `next_owner: codex` e delegue a skill `site-context-packet`. Valide markers, escopo e divergências. Salve o packet e avance para `ready_for_planning` somente quando a recomendação permitir.

Se código + instrução atual já contiverem o contexto necessário, `context_packet` pode permanecer `null` e a rota vai diretamente para `ready_for_planning`.

## Planejamento

Ao iniciar o planejamento, mova para `planning`.

Use `using-superpowers` e siga exatamente a classificação da skill `brainstorming`. Não implemente neste comando.

- `bounded`: apresente design curto no chat e aguarde aprovação. Não crie spec nem implementation plan. Depois grave `work_class: bounded`, uma frase `bounded_design` que apenas registra o escopo aprovado e `authorized_paths`.
- `architectural`: brainstorming completo → spec em `docs/superpowers/specs/` → aprovação humana → `writing-plans`; grave `work_class: architectural`. Grave `active_spec` assim que a spec for aprovada, antes de rodar `writing-plans`.

Todo plano arquitetural executável termina com:

## Handoff de execução
executor: claude|codex
reviewer: codex|claude
paths_autorizados:
- <paths fechados quando executor=codex>

Executor e reviewer devem ser diferentes.

Ao concluir, atualize `state.md` para `ready_for_execution`.

- bounded: `active_spec: null`, `active_plan: null`, `bounded_design` e `authorized_paths` preenchidos;
- architectural: `active_spec` e `active_plan` preenchidos, `bounded_design: null`.

Em ambos: preencher `active_notion_eap`, `active_title`, `active_branch`, `context_packet` (path do packet salvo, ou `null` quando nenhuma fonte externa foi necessária), `executor`, `reviewer`, `next_owner: claude`, `next_action: execute_active_work_item`.
