# Débitos do harness (`B10`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar `D-15`, `D-18` e `D-19`, criar `claude-isolado` como segunda lente quando o Codex
não responde e usá-lo numa passada retroativa que fecha `D-27`, `D-32`, `D-53`, `D-65`, `D-70`,
`D-76` e `D-77`.

**Architecture:** Só harness. O validador ganha um conjunto fechado de nomes de agente; os
comandos `/planejar-site`, `/revisar-site` e `/fechar-site` ganham o teste do Codex e o ramo
`claude-isolado`; o contrato `site-review-task` passa a aceitar esse reviewer. Depois, três agentes
`claude-isolado` revisam o código de hoje dos blocos sem segunda lente, e o relatório vai para
`historico/`.

**Tech Stack:** Node 24.19.0, pnpm 11, Vitest, Codex CLI 0.157.1 (só o teste de disponibilidade),
ferramenta de agente do Claude Code.

**Spec:** `docs/superpowers/specs/2026-10-24-harness-debitos-design.md`

## Global Constraints

- Branch `chore/harness-debitos`; nenhum commit em `main`; sem push (`/executar-site`).
- Um commit por task: `<tipo>(harness-debitos): <descrição>`, terminando com
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. As cinco mensagens estão na spec §7.
- `state.md` segue a regra de D-19 (Task 3): a ida para `executing` vai no commit da Task 1; a ida
  para `ready_for_review` é `chore` próprio, depois da Task 6.
- Todo comando de Node antes de rodar: `source ~/.nvm/nvm.sh >/dev/null && nvm use >/dev/null`
  (`engineStrict` recusa o Node padrão da máquina).
- Nenhuma dependência nova (Lei 7).
- Nenhum arquivo de `src/`, `lambda/`, `infra/`, `e2e/`, `scripts/infra/`, `scripts/inventario/`,
  `scripts/qa/` ou `scripts/wordpress/` muda (spec §2).
- `~/.codex/config.toml` não é tocado (spec §2).
- Não escrever no Notion, Drive nem Figma (Lei 6).
- Arquivo `.md` ou `.mjs` tocado e não ignorado passa por `pnpm exec prettier --write <arquivo>`
  antes do commit.
- `SP=/tmp/claude-1000/-home-jvbat-projetos-lotus-site/9f358ab4-f838-478a-963d-85a944605449/scratchpad`
  — diretório de trabalho fora do repositório. Numa sessão nova, usar o scratchpad dela.

## Precisões sobre a spec

Pontos que a leitura do código fixou no planejamento. Nenhum muda escopo.

1. **`coverage/` não é ignorado.** A D12 da spec cita `coverage/` como saída ignorada, mas
   `git check-ignore coverage` não devolve nada. Vale o critério da D12 (o que `git status --short`
   mostra); os exemplos no contrato ficam `dist/` e `test-results/`.
2. **O teste do Codex lê só o arquivo de `-o`.** O log do `codex exec` ecoa o pedido, então procurar
   a palavra no log dá falso positivo.
3. **Sem `--skip-git-repo-check`.** O teste roda dentro do repositório, como a delegação.
4. **A troca de reviewer vai no `chore` da transição para `reviewing`** (D10 da spec), com a linha
   do erro no corpo.
5. **Violação da regra de D-19 na review é `suggestion`.** O próprio `D-19` registra que reescrever
   histórico revisado custa mais que o defeito.
6. **O validador compara nomes sem aspas.** `parseFrontmatter` não tira aspas, e
   `reviewer: 'claude'` contra `executor: claude` passaria hoje como agentes diferentes. Os testes
   f, g e h vão além dos cinco da spec (Review Focus).
7. **O diff de `D-32` vai com a área "Observabilidade e CI"**, a menor das três.

## Review Focus

1. **Nome entre aspas** — `reviewer: 'claude'` com `executor: claude` e sem exceção; esperado:
   reprova como agentes iguais, e `reviewer: 'claude-isolado'` passa (Task 4, testes f e g).
2. **Falso positivo do teste do Codex** — log ecoando o pedido; esperado: só a última mensagem conta
   (Task 4, Step 9, e o comando de `/revisar-site`).
3. **Testes novos no espelho** — árvore sem `CLAUDE.md`; esperado: pulam, e o `pnpm check` do
   espelho fica verde (Task 6, Step 2).
4. **Nome conferido antes da execução** — `planning` com `executor: null`; esperado: nada reprova
   (Task 4, teste h).
5. **Agente retroativo saindo do alvo** — achado em arquivo fora da lista ou congelado; esperado:
   descartado com motivo "fora do alvo" (Task 5, Step 5).

## File structure

| Arquivo                                                    | Task | Papel                                             |
| ---------------------------------------------------------- | ---- | ------------------------------------------------- |
| `.prettierignore`                                          | 1, 2 | quatro diretórios aprovados entram; o sprite sai  |
| `.claude/rules/architecture.md`                            | 2    | ícone vem de `lucide-react`                       |
| `CLAUDE.md`                                                | 3, 4 | regra de commit de transição; `claude-isolado`    |
| `.claude/commands/executar-site.md`                        | 3    | aponta para a regra                               |
| `.claude/commands/revisar-site.md`                         | 3, 4 | confere a regra; teste do Codex; ramo isolado     |
| `.claude/commands/planejar-site.md`                        | 4    | teste do Codex no handoff                         |
| `.claude/commands/fechar-site.md`                          | 4    | linha de `progress.md` com o motivo da queda      |
| `.agents/skills/site-review-task/SKILL.md`                 | 4    | aceita `claude-isolado`; o que conta como escrita |
| `scripts/validate-agent-workflow.mjs`                      | 4    | conjunto fechado de nomes, comparação sem aspas   |
| `scripts/validate-agent-workflow.test.mjs`                 | 4    | sete testes de nome, pulando no espelho           |
| `docs/superpowers/state.md`                                | 1, 4 | `executing`; invariante reescrito                 |
| `docs/superpowers/historico/revisao-retroativa-2026-10.md` | 5    | novo: relatório da passada                        |
| `docs/superpowers/backlog.md`                              | 5    | sete débitos fechados; débitos novos dos achados  |

---

### Task 1: Artefatos aprovados fora do Prettier (`D-18`, spec D9)

**Files:**

- Modify: `.prettierignore`
- Modify: `docs/superpowers/state.md` (frontmatter: `executing`)

**Interfaces:**

- Produces: `docs/superpowers/{specs,plans,bounded-designs,context-packets}/` ignorados pelo
  Prettier.

- [ ] **Step 1: Provar o estado de antes**

Run: `pnpm exec prettier --file-info docs/superpowers/plans/2026-10-24-harness-debitos.md`
Expected: `"ignored": false`.

- [ ] **Step 2: Acrescentar ao fim de `.prettierignore`**

```text
# Artefatos aprovados ou validados: o Prettier não os reescreve depois da aprovação (D-18).
docs/superpowers/specs/
docs/superpowers/plans/
docs/superpowers/bounded-designs/
docs/superpowers/context-packets/
```

- [ ] **Step 3: Provar o critério**

Run, um por linha:

```bash
pnpm exec prettier --file-info docs/superpowers/specs/2026-10-24-harness-debitos-design.md
pnpm exec prettier --file-info docs/superpowers/plans/2026-10-24-harness-debitos.md
pnpm exec prettier --file-info docs/superpowers/bounded-designs/recaptura-baseline.md
pnpm exec prettier --file-info docs/superpowers/context-packets/6.1.1-6.3.1.md
pnpm exec prettier --file-info docs/superpowers/backlog.md
```

Expected: `"ignored": true` nos quatro primeiros, `"ignored": false` no último. Depois,
`pnpm format:check` com saída `0`.

- [ ] **Step 4: `state.md` para `executing`**

`workflow_state: executing`, `next_owner: claude`, `next_action: continue_active_plan`,
`state_basis_commit` com o sha da ponta antes deste commit, `updated_at` agora. Depois,
`pnpm agent:check` com saída `0`.

- [ ] **Step 5: Commit**

```bash
git add .prettierignore docs/superpowers/state.md
git commit -m "chore(harness-debitos): tirar spec, plano, bounded design e packet do Prettier"
```

---

### Task 2: Rule de ícones (`D-15`, spec D9)

**Files:**

- Modify: `.claude/rules/architecture.md:13`
- Modify: `.prettierignore` (sai a linha `public/icons.svg`)

- [ ] **Step 1: Trocar a linha 13 de `architecture.md` por**

```text
- Ícone vem de `lucide-react`, importado pelo componente que o usa; não criar sprite nem arquivo SVG de ícone sem consumidor.
```

- [ ] **Step 2: Apagar a linha `public/icons.svg` de `.prettierignore`**

- [ ] **Step 3: Provar o critério**

Run: `grep -rn "icons.svg" .claude .prettierignore; echo "grep: $?"`
Expected: `grep: 1`. Depois, `pnpm exec prettier --write .claude/rules/architecture.md` e
`pnpm format:check` com saída `0`.

- [ ] **Step 4: Commit**

```bash
git add .claude/rules/architecture.md .prettierignore
git commit -m "docs(harness-debitos): apontar a rule de ícones para lucide-react"
```

---

### Task 3: Regra de commit das transições de estado (`D-19`, spec D9 e §5.3)

**Files:**

- Modify: `CLAUDE.md` (§4, depois do bloco de código dos quatro comandos)
- Modify: `.claude/commands/executar-site.md:42`
- Modify: `.claude/commands/revisar-site.md:24`

**Interfaces:**

- Produces: "regra de commit de transição de `CLAUDE.md` §4", citada por nome nos dois comandos.

- [ ] **Step 1: Em `CLAUDE.md` §4, logo depois do bloco `text` que começa em `/planejar-site  branch
nova a partir de main`, acrescentar**

```text
Regra de commit de transição: a transição de `state.md` que acompanha a entrega de uma task entra
no commit dessa task (a ida para `executing` vai no commit da primeira task). Toda outra transição
— abrir o planejamento, registrar spec aprovada, abrir a execução, `ready_for_review`, `reviewing`,
`blocked`, `ready_for_closure`, volta a `idle` — é commit `chore(<item>)` próprio, com `state.md` e
só os documentos do harness que a própria transição exige (`backlog.md`, `progress.md`).
```

- [ ] **Step 2: Trocar `executar-site.md:42` por**

```text
- `docs/superpowers/state.md` segue a regra de commit de transição de `CLAUDE.md` §4: entra no commit da task que ele descreve, e transição sem task ganha `chore(<item>)` próprio;
```

- [ ] **Step 3: Depois de `revisar-site.md:24` ("Confirme um commit por EAP…"), acrescentar**

```text
Confirme também que cada transição de `state.md` segue a regra de commit de transição de
`CLAUDE.md` §4. Violação é `suggestion`: histórico revisado não é reescrito.
```

- [ ] **Step 4: Provar o critério**

Run: `grep -c "regra de commit de transição" CLAUDE.md .claude/commands/executar-site.md .claude/commands/revisar-site.md`
Expected: `1` em cada um. `git log --name-only --format='%s' main..HEAD` mostra só `state.md` (e
`backlog.md`/`progress.md`) nos `chore` de transição, e `state.md` dentro do commit da Task 1.
Depois, `pnpm exec prettier --write` nos três arquivos, `pnpm agent:check` e `pnpm format:check`
com saída `0`.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md .claude/commands/executar-site.md .claude/commands/revisar-site.md
git commit -m "docs(harness-debitos): escrever a regra de commit das transições de estado"
```

---

### Task 4: `claude-isolado` no contrato (spec D2–D6, D10–D12, §5.1)

**Files:**

- Modify: `scripts/validate-agent-workflow.mjs:170-187`
- Test: `scripts/validate-agent-workflow.test.mjs`
- Modify: `.claude/commands/planejar-site.md:60-68`, `.claude/commands/revisar-site.md:16-20`,
  `.claude/commands/fechar-site.md` (secção "Histórico")
- Modify: `.agents/skills/site-review-task/SKILL.md` (linha `Require`, secção `## Read-only`)
- Modify: `CLAUDE.md` §4, `docs/superpowers/state.md` (invariante de executor e reviewer)

**Interfaces:**

- Consumes: a regra de commit de transição (Task 3).
- Produces: `AGENTES = ['claude', 'codex', 'claude-isolado']`; mensagens
  `state: executor desconhecido: <valor>`, `state: reviewer desconhecido: <valor>`,
  `state: claude-isolado só revisa; executor precisa ser claude ou codex`; o bloco "Teste do Codex"
  de `/revisar-site`, que `/planejar-site` cita; o ramo `claude-isolado`, que a Task 5 segue.

- [ ] **Step 1: Escrever os testes que falham**

Em `scripts/validate-agent-workflow.test.mjs`, um `describe.skipIf(!existsSync('CLAUDE.md'))(
'validate-agent-workflow: nomes de executor e reviewer', …)` com o helper
`harnessCom(campos: Record<string, string>): string`. Ele cria uma árvore com `arvore()`, copia
com `cpSync(…, { recursive: true })` `CLAUDE.md`, `AGENTS.md`, `.claude`, `.agents`,
`docs/superpowers/state.md`, `docs/superpowers/backlog.md` e
`docs/superpowers/historico/progress.md`, e reescreve no `state.md` copiado cada chave de
`{ ...BASE, ...campos }` pela regex `^<chave>: .*$` (flag `m`).

`BASE`: `workflow_state: ready_for_execution`, `work_class: architectural`,
`active_work_item: teste`, `active_branch: chore/teste`, `bounded_design: null`,
`authorized_paths: null`, `active_spec: docs/superpowers/specs/teste.md`,
`active_plan: docs/superpowers/plans/teste.md`, `executor: claude`,
`reviewer: claude-isolado`, `reviewer_exception: null`, `resume_state: null`, `blocker: null`.

| Teste                                                            | `campos`                                                                           | Espera                                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| (a) aceita claude executando e claude-isolado revisando          | `{}`                                                                               | `code` 0, `Agent workflow contract OK`                                |
| (b) reprova claude-isolado como executor                         | `executor: claude-isolado`, `reviewer: codex`                                      | `code` 1, `claude-isolado só revisa`                                  |
| (c) reprova nome fora do conjunto                                | `reviewer: gemini`                                                                 | `code` 1, `reviewer desconhecido: gemini`                             |
| (d) aceita o mesmo agente nos dois papéis com reviewer_exception | `reviewer: claude`, `reviewer_exception: 'teste 2026-10-24'`                       | `code` 0                                                              |
| (e) reprova reviewer_exception com claude-isolado revisando      | `reviewer_exception: 'teste 2026-10-24'`                                           | `code` 1, `reviewer_exception só vale com executor e reviewer iguais` |
| (f) compara sem aspas: 'claude' contra claude reprova            | `reviewer: 'claude'`                                                               | `code` 1, `executor e reviewer devem ser diferentes`                  |
| (g) aceita reviewer entre aspas                                  | `reviewer: 'claude-isolado'`                                                       | `code` 0                                                              |
| (h) não confere nome nulo antes da execução                      | `workflow_state: planning`, `work_class: null`, `executor: null`, `reviewer: null` | `code` 0                                                              |

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run scripts/validate-agent-workflow.test.mjs`
Expected: (b), (c) e (f) falham; (a), (d), (e), (g) e (h) podem passar já.

- [ ] **Step 3: Implementar no validador**

Em `scripts/validate-agent-workflow.mjs`: constante `AGENTES` (Interfaces) e
`agente(value: string | undefined): string | undefined`, que tira um par de aspas simples ou duplas
que envolva o valor inteiro. Em `checkState`, para `executor` e `reviewer` não nulos, em qualquer
estado: fora de `AGENTES` reprova com a mensagem de Interfaces; `executor` igual a
`claude-isolado` reprova. A regra de iguais e a de `reviewer_exception`
(`validate-agent-workflow.mjs:174-187`) passam a comparar `agente(front.executor)` com
`agente(front.reviewer)`. O comentário das linhas 175-177 passa a dizer que Codex indisponível leva
a `claude-isolado` e que a exceção ficou para quem executou revisar a própria execução.

- [ ] **Step 4: Rodar e ver passar; provar por mutação**

Run: `pnpm exec vitest run scripts/validate-agent-workflow.test.mjs`
Expected: os onze testes do arquivo passam. Depois, um de cada vez, revertendo cada um: desligar a
checagem de conjunto faz (c) falhar; desligar a de executor faz (b) falhar; trocar `agente(…)` pelo
valor cru faz (f) e (g) falharem. As três mutações e o resultado vão no corpo do commit.

- [ ] **Step 5: Comandos, contrato e `CLAUDE.md`**

`revisar-site.md`, no lugar dos três bullets de `:16-20`, mantendo "Ao iniciar, transicione para
`reviewing`.":

````text
## Teste do Codex

Com executor diferente de `codex` e reviewer `codex` ou `claude-isolado`, antes de transicionar
para `reviewing`, teste o Codex pelo mesmo caminho da delegação, com a config do usuário e sem `-m`:

```bash
R=$(mktemp)
timeout 120 codex exec --sandbox read-only -o "$R" "Responda apenas a palavra: disponivel" >/dev/null 2>"$R.err"
S=$?
if [ "$S" -eq 0 ] && grep -qi disponivel "$R"; then echo "codex: disponível"; else echo "codex: indisponível (saída $S)"; grep -m1 -i error "$R.err"; fi
```

Leia só o arquivo de `-o`: o log ecoa o pedido. Disponível => `reviewer: codex`; indisponível =>
`reviewer: claude-isolado`. Quando o resultado muda o reviewer gravado, a troca entra no `chore` da
transição para `reviewing`, com a linha decisiva do erro no corpo. Reviewer `claude` com
`reviewer_exception`, ou escolhido à mão por João no plano, não é tocado pelo teste.

## Revisor

- executor Codex / reviewer Claude: Claude revisa diff, spec, plano, packet e rules.
- executor Claude / reviewer Codex: delegue `site-review-task` por
  `codex exec --sandbox read-only -o <relatório> "<contrato na íntegra + entrada>"`; depois Claude
  verifica cada achado material no código antes de aceitá-lo.
- executor Claude / reviewer `claude-isolado`: abra um agente novo pela ferramenta de agente do
  Claude Code, tipo `general-purpose`, nunca fork, sem trocar modelo. O pedido é o conteúdo de
  `.agents/skills/site-review-task/SKILL.md` na íntegra mais a entrada que o contrato define, e
  nada mais: nem resumo da execução, nem hipótese, nem memória, nem nota de review anterior. Grave
  `git status --short` antes e compare depois; diferença descarta a review, que é refeita. Depois
  Claude verifica cada achado material no código antes de aceitá-lo.
- mesmo agente nos dois papéis: só com `reviewer_exception` declarada no estado, autorizada por
  João, e débito correspondente no backlog. A review acontece, mas não vale como lente
  independente; o débito registra isso.
````

`planejar-site.md`: no bloco do handoff, `reviewer: codex|claude` vira
`reviewer: codex|claude|claude-isolado`; depois de "Executor e reviewer devem ser diferentes.":

```text
Com executor `claude`, rode o "Teste do Codex" de `/revisar-site` antes de gravar o reviewer:
disponível => `reviewer: codex`; indisponível => `reviewer: claude-isolado`, com a linha decisiva
do erro no handoff. `claude-isolado` nunca é executor.
```

`fechar-site.md`, ao fim do parágrafo de "Histórico":

```text
Reviewer `claude-isolado` por queda do Codex entra como `claude-isolado (Codex indisponível: <motivo curto>)`.
```

`SKILL.md`: a linha do `Require` vira

```text
Require `reviewer: codex` or `reviewer: claude-isolado` in `docs/superpowers/state.md`.
```

e, ao fim de `## Read-only`:

```text
Writes that land only in git-ignored output (such as `dist/` or `test-results/`) or outside the
repository (such as `/tmp`) do not count: running `pnpm check`, `pnpm test` or the mirror-tree gate
to observe acceptance evidence is allowed. Anything that `git status --short` shows does count.
```

`CLAUDE.md` §4: o bullet de `/revisar-site` vira "revisão independente sobre os commits da branch,
por agente diferente do executor: Codex, ou `claude-isolado` quando o Codex não responde."; a frase
de delegação vira "Delegação ao Codex ou a `claude-isolado` usa o contrato em
`.agents/skills/<nome>/SKILL.md`; Claude repassa esse conteúdo na íntegra, sem paráfrase.
`claude-isolado` é um agente Claude novo, no mesmo modelo, aberto sem nada da sessão: só o contrato
e a entrada que ele define."

`state.md`, o invariante de executor e reviewer vira:

```text
- `executor` e `reviewer` aceitam só `claude`, `codex` e `claude-isolado`, e `claude-isolado` só
  como reviewer. A partir de `ready_for_execution` os dois devem ser diferentes. Codex indisponível
  leva o reviewer a `claude-isolado`, sem exceção. Quem executou revisar a própria execução é
  exceção declarada, não silenciosa: `reviewer_exception` carrega motivo, data e quem autorizou, e
  o desvio vira débito no backlog. Sem ela, agente igual nos dois papéis é erro de
  `pnpm agent:check`; com executor e reviewer diferentes, o campo precisa estar limpo.
```

- [ ] **Step 6: Formatar**

Run: `pnpm exec prettier --write` nos oito arquivos da task.
Expected: saída sem erro; `pnpm format:check` com saída `0`.

- [ ] **Step 7: `agent:check` sobre o estado real**

Run: `pnpm agent:check`
Expected: `Agent workflow contract OK`, com `reviewer: claude-isolado` no `state.md` real.

- [ ] **Step 8: Contrato intacto**

Run: `grep -c "BEGIN SITE REVIEW REPORT\|## Read-only\|\.claude/\*\*" .agents/skills/site-review-task/SKILL.md`
Expected: `3` ou mais (marcadores e seções que `checkSkills` exige continuam lá).

- [ ] **Step 9: O teste do Codex de hoje**

Run: o bloco de `/revisar-site` (Step 5), da raiz do repositório.
Expected: `codex: indisponível (saída 1)` e a linha com `model_not_found` ou
`is not supported when using Codex with a ChatGPT account`. Se sair `disponível`, o Codex voltou:
anotar no corpo do commit, e `/revisar-site` vai gravar `reviewer: codex`.

- [ ] **Step 10: Commit**

```bash
git add scripts/validate-agent-workflow.mjs scripts/validate-agent-workflow.test.mjs \
  .claude/commands/planejar-site.md .claude/commands/revisar-site.md \
  .claude/commands/fechar-site.md .agents/skills/site-review-task/SKILL.md \
  CLAUDE.md docs/superpowers/state.md
git commit -m "feat(harness-debitos): claude-isolado como segunda lente quando o Codex não responde"
```

---

### Task 5: Passada retroativa (spec D7, D12–D15, §5.2)

**Files:**

- Create: `docs/superpowers/historico/revisao-retroativa-2026-10.md`
- Modify: `docs/superpowers/backlog.md` (secção `# DÉBITOS`)

**Interfaces:**

- Consumes: o ramo `claude-isolado` de `/revisar-site` e o `SKILL.md` da Task 4.

- [ ] **Step 1: Recalcular a lista e comparar com a spec**

```bash
{ for m in 1535720 28542cb 0d2a890 92906d2 dd5fa31 cb9654a; do git diff --name-only $m^1...$m^2; done
  git show --name-only --format= 82bc812 dc0408d b9ac09a 68542eb; } | sort -u \
  | while read -r p; do [ -e "$p" ] && echo "$p"; done \
  | grep -v '^docs/\|^scripts/inventario/\|^scripts/qa/\|^scripts/wordpress/' > "$SP/retro-alvo.txt"
wc -l < "$SP/retro-alvo.txt"
```

Expected: `39`, e cada linha está numa das três áreas da spec §4.2. Diferença é divergência:
`blocked`, `next_owner: joao`.

- [ ] **Step 2: Fotografar a árvore**

Run: `git status --short > "$SP/retro-antes.txt"`

- [ ] **Step 3: Um agente por área, um de cada vez**

Áreas e arquivos: os três grupos da spec §4.2, na ordem Infra e zona, Contato, Observabilidade e CI.
Cada agente segue o ramo `claude-isolado` de `/revisar-site`: `general-purpose`, nunca fork, sem
trocar modelo; o pedido é o `SKILL.md` na íntegra seguido deste bloco, e nada mais:

```text
## Entrada desta review — passada retroativa

work item: harness-debitos, passada retroativa (spec docs/superpowers/specs/2026-10-24-harness-debitos-design.md, D7, D13, §5.2)
alvo: o conteúdo atual dos arquivos abaixo, na árvore de trabalho. Não é um diff.
arquivos:
- <um por linha, os da área>
As dimensões Acceptance e Scope não se aplicam: não há work item único. Registre isso em ## Limitations.
Arquivo fora desta lista não é alvo.
```

Na área Observabilidade e CI, a lista ganha a linha
`diffs de D-32: git show b9ac09a 68542eb (só documentação; revise o diff)`.

Depois de cada agente: `git status --short | diff "$SP/retro-antes.txt" -`. Saída vazia segue;
qualquer diferença descarta o relatório daquele agente, desfaz o que ele escreveu e o roda de novo
(spec D12).

- [ ] **Step 4: Guardar os três relatórios**

Cada `BEGIN SITE REVIEW REPORT … END SITE REVIEW REPORT` em `$SP/retro-<area>.txt`, sem edição.

- [ ] **Step 5: Conferir cada achado no código**

Para cada `[R-N]`, abrir o `path:line` citado e decidir `confirmado` ou `descartado`, com o motivo.
Achado em arquivo fora de `$SP/retro-alvo.txt` é `descartado`, motivo "fora do alvo". Destino
(spec D14): `blocking`/`important` confirmado vira débito novo (a partir de `D-81`) ou nota num
débito aberto que ele repete; `suggestion` confirmada fica só no relatório. Achado confirmado com
risco em produção agora (segurança, perda de mensagem do contato, custo descontrolado) para aqui:
`blocked`, `resume_state: executing`, `next_owner: joao`, em `chore` próprio.

- [ ] **Step 6: Escrever o relatório**

`docs/superpowers/historico/revisao-retroativa-2026-10.md`, com:

- cabeçalho: data, base `main@cb9654a`, spec, reviewer `claude-isolado` e o motivo (Codex com
  `model_not_found`, Task 4 Step 9);
- os sete débitos e seus ranges (tabela da spec §4.2);
- por área: arquivos, veredito do agente, `## Limitations` dele resumidas, e uma tabela com
  `R-N`, `path:line`, severidade, `confirmado`/`descartado`, motivo e destino;
- o fechamento: débitos fechados e débitos novos ou notas, com número.

- [ ] **Step 7: Backlog**

Em `D-27`, `D-32`, `D-53`, `D-65`, `D-70`, `D-76` e `D-77`, uma linha ao fim de cada:

```text
  **Fechado em <data>** pela passada retroativa de `B10`
  (`docs/superpowers/historico/revisao-retroativa-2026-10.md`, área <área>).
```

Débitos novos entram ao fim de `# DÉBITOS`, com gatilho; notas entram no débito que o achado
repete.

- [ ] **Step 8: Formatar e checar**

Run: `pnpm exec prettier --write docs/superpowers/historico/revisao-retroativa-2026-10.md docs/superpowers/backlog.md && pnpm agent:check && pnpm format:check`
Expected: saída `0`. `grep -c "revisao-retroativa-2026-10.md" docs/superpowers/backlog.md` dá `7`
ou mais.

- [ ] **Step 9: Commit**

```bash
git add docs/superpowers/historico/revisao-retroativa-2026-10.md docs/superpowers/backlog.md
git commit -m "docs(harness-debitos): registrar a passada retroativa e fechar a segunda lente ausente"
```

---

### Task 6: Gates (spec §8)

- [ ] **Step 1: `pnpm check`**

Run: `pnpm check; echo "check: $?"`
Expected: `check: 0`.

- [ ] **Step 2: Árvore espelhada**

```bash
D="$SP/espelho-$(date +%s)"; mkdir "$D"
mapfile -t EX < <(grep -vE '^\s*(#|$)' .espelho-exclusoes | sed -E 's#/$##; s#^#:(exclude)#')
git archive HEAD -- . "${EX[@]}" | tar -x -C "$D"
(cd "$D" && pnpm install --frozen-lockfile --offline && pnpm check); echo "espelho: $?"
```

Expected: `espelho: 0`, com os testes de nome do validador como `skipped` na saída do Vitest.

- [ ] **Step 3: Histórico da branch**

Run: `git log --name-only --format='%h %s' main..HEAD`
Expected: um commit por task (cinco) e os `chore` de transição só com arquivos de harness.
Nenhum commit nesta task; a ida para `ready_for_review` é o `chore` seguinte, por `/executar-site`.

---

## Handoff de execução

executor: claude
reviewer: claude-isolado
paths_autorizados:

- não se aplica (executor = claude)

O reviewer nasce `claude-isolado`: o teste do Codex falhou em 2026-10-24 com
`The 'gpt-5.5' model is not supported when using Codex with a ChatGPT account.` (spec §4.1). Sem
`reviewer_exception`. `/revisar-site` testa de novo e grava `codex` se ele responder.

Execução nativa (`superpowers:executing-plans`), escolhida por João em 2026-10-24 ao aprovar o plano.
