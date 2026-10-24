# Spec — `harness-debitos` · Débitos do harness e segunda lente sem Codex (bloco `B10`)

> Work item: `harness-debitos` · Branch: `chore/harness-debitos` · Base: `ac7639d`
> Context Packet: nenhum (§3 D0).

## 1. Objetivo

Fechar os débitos de harness que o backlog juntou em `B10` e acabar com a exceção de reviewer como
rotina. Os seis últimos blocos fecharam com `reviewer_exception`, e a classe "segunda lente
ausente" acumulou oito débitos (`D-27`, `D-32`, `D-53`, `D-65`, `D-70`, `D-73`, `D-76`, `D-77`). O
contrato trata o desvio como raro; na prática ele virou o caminho normal. João quer resolver os dois
lados: o código que ficou sem segunda lente e a falta de uma segunda lente definida quando o Codex
não está disponível.

O bloco entrega:

1. **`claude-isolado`** — um agente Claude novo, no mesmo modelo, sem nada da sessão, como segunda
   lente definida quando o Codex não responde (D2–D6);
2. **a passada retroativa** — `claude-isolado` revisando o código de hoje tocado pelos blocos sem
   segunda lente, fechando sete débitos (D1, D7);
3. **`D-15`** — a rule de ícones apontando para o que o código usa (D9);
4. **`D-18`** — os artefatos aprovados fora do Prettier (D9);
5. **`D-19`** — regra escrita para o commit de toda transição de estado (D9).

Sucesso: o validador aceita `claude-isolado` só como reviewer e reprova nome fora do conjunto;
`/planejar-site` e `/revisar-site` testam o Codex e caem para `claude-isolado` sozinhos; o relatório
retroativo versionado, com cada achado conferido no código; `D-15`, `D-18`, `D-19`, `D-27`, `D-32`,
`D-53`, `D-65`, `D-70`, `D-76` e `D-77` fechados; e a review do próprio `B10` feita por
`claude-isolado`, sem `reviewer_exception`.

## 2. Escopo negativo

- **Nada de produto.** Nenhum arquivo de `src/`, `lambda/`, `infra/`, `e2e/` ou `scripts/infra/`
  muda. Achado da passada retroativa vira débito, não correção (D7).
- **Ferramental da referência continua congelado** (D3 de `B9`): `scripts/inventario/`,
  `scripts/qa/` e `scripts/wordpress/` não são tocados nem revisados. `D-16` e `D-31` ficam fora
  (D8).
- **A configuração do Codex não é tocada.** `~/.codex/config.toml` é do João, fora do repositório
  (§4.1).
- **Os outros débitos de harness não entram**, nem o que §4.4 anota como visto e deixado.
- **Nenhuma dependência nova** (Lei 7).
- **Não escreve no Notion, Drive nem Figma** (Lei 6). O bloco não tem EAP no Notion.

## 3. Decisões

`S-JOAO` marca decisão de João nesta rodada de planejamento, em 2026-10-24. `Claude` marca escolha
minha, que João confere na leitura desta spec.

### D0 — Sem Context Packet · Claude

Tudo que o bloco precisa está no repositório: backlog, contratos do harness, validador e histórico
de commits. Nenhuma fonte externa é lida. `context_packet: null`.

### D1 — Escopo ampliado para sete débitos · `S-JOAO`

O backlog listava `D-27` e `D-32` como "segunda lente ausente". João autorizou fechar a classe
inteira com uma passada só: `D-27`, `D-32`, `D-53`, `D-65`, `D-70`, `D-76` e `D-77`. `D-73` já foi
dispensado por João em 2026-10-11 e não entra.

### D2 — O que é `claude-isolado` · `S-JOAO`

Nas palavras de João: "outro agente do Claude no mesmo modelo, sem contexto nenhum do projeto, como
se fosse um outro dev sênior".

- **Mesmo modelo** do executor: o agente é disparado sem troca de modelo.
- **Não recebe nada da sessão:** nem a conversa, nem o raciocínio de quem executou, nem resumo da
  execução, nem hipótese, nem memória, nem nota de review anterior.
- **Recebe o que um dev de fora receberia num PR:** o contrato `site-review-task` na íntegra (o
  mesmo que o Codex recebe), work item, base e ponta, e a spec com o plano (ou o bounded design e os
  `authorized_paths`) e o packet quando existir.
- **Pode ler o repositório inteiro** e rodar comando que não muda arquivo rastreado nem cria
  arquivo fora do `.gitignore` (D12). O que o Claude Code carrega sozinho em todo agente do projeto
  (como o `CLAUDE.md`) é o que um dev de fora leria também, e não conta como contexto da sessão.
- **O índice da memória automática é aceito** · `S-JOAO`. O agente aberto pelo Claude Code carrega
  sozinho `MEMORY.md`, com dicas operacionais de uma linha. Tirá-lo exigiria `claude -p --bare`, que
  só autentica com `ANTHROPIC_API_KEY`, fora da assinatura. O que fica proibido é o executor pôr
  memória, ou qualquer coisa da sessão, no pedido ao agente. O agente é disparado pela ferramenta de
  agente do Claude Code, tipo `general-purpose`, nunca como fork.

### D3 — Codex primeiro, queda automática · `S-JOAO`

O Codex continua sendo o reviewer preferido. `/planejar-site` testa se ele responde ao preencher o
reviewer do handoff; `/revisar-site` testa de novo ao abrir a review, sempre que o executor não for
o Codex. Codex respondendo, o reviewer é `codex`, mesmo que o planejamento tenha gravado
`claude-isolado`. Teste falhando, o reviewer passa a ser `claude-isolado` sem pedir autorização: a
resposta de João em 2026-10-24 vale como autorização permanente. O motivo fica registrado (D10).

A troca automática só anda entre `codex` e `claude-isolado` · Claude. Reviewer `claude` com
`reviewer_exception` (D4), ou qualquer reviewer que João tenha escolhido à mão no plano, não é
tocado pelo teste.

### D4 — `reviewer_exception` fica para o caso raro · `S-JOAO`

O campo continua existindo só para quando quem executou revisa a própria execução, com o mesmo
contexto. Com `claude-isolado` disponível, isso deixa de ser o caminho de Codex indisponível.

### D5 — Conjunto fechado de nomes · `S-JOAO`

`executor` e `reviewer` só aceitam `claude`, `codex` e `claude-isolado`. `claude-isolado` só vale
como reviewer.

### D6 — Achado conferido antes de aceito · `S-JOAO`

Como já acontece com o Codex, Claude confere cada achado material no código antes de aceitá-lo. O
relatório do revisor é evidência auxiliar (Lei 5).

### D7 — A passada retroativa é sobre o código de hoje · `S-JOAO`

Não vale revisar os diffs históricos um a um: boa parte daquele código já foi reescrita (`B2` trocou
o adapter do contato, `B9` mexeu no intake e na zona). Vale uma passada sobre o conteúdo atual dos
arquivos tocados pelos blocos sem segunda lente. Achado confirmado vira débito novo; nada é
corrigido em `B10`, que continua só de harness.

### D8 — `D-16` e `D-31` ficam fora · `S-JOAO`

O backlog os condicionava a `scripts/inventario/` estar nos paths do bloco. O congelamento de `B9`
(D3) e o argumento da D4 de `B9` valem aqui: corrigir script que não roda não muda nada observável.
Os gatilhos continuam os de hoje.

### D9 — `D-15`, `D-18` e `D-19` · `S-JOAO`

- **`D-15`:** a rule passa a dizer que ícone vem de `lucide-react`, e a linha morta
  `public/icons.svg` sai também do `.prettierignore`.
- **`D-18`:** `docs/superpowers/specs/`, `plans/`, `bounded-designs/` e `context-packets/` entram no
  `.prettierignore`. Os quatro são artefatos aprovados ou validados; `state.md`, `backlog.md` e
  `historico/` continuam formatados.
- **`D-19`:** transição de estado que acompanha a entrega de uma task vai no commit dessa task;
  qualquer outra transição ganha commit `chore(<item>)` próprio.

### D10 — O motivo da queda fica no commit e no histórico · Claude

Sem campo novo no estado. Quando `/revisar-site` troca o reviewer para `claude-isolado`, a troca é
um commit `chore(<item>)` cujo corpo cita a linha decisiva do erro do teste do Codex. Quando a queda
acontece já no `/planejar-site`, o motivo vai no handoff do plano (ou no bounded design). No
fechamento, a coluna reviewer de `progress.md` registra `claude-isolado (Codex indisponível:
<motivo curto>)`.

### D11 — Critério do teste do Codex · Claude

O teste manda um pedido trivial pelo mesmo caminho e com a mesma configuração que a delegação usa,
sem trocar modelo, com tempo limite. O caminho fica escrito: `codex exec --sandbox read-only`, com a
config do João e sem `-m`, que é o que o histórico usou (packet de `6.1.1-6.3.1`). `/revisar-site`
passa a trazer esse comando literal tanto para o teste quanto para delegar `site-review-task`; o
plugin `codex:rescue` não é caminho de review. Disponível = saída `0` **e** a resposta esperada no
texto.
Qualquer outra coisa é indisponível: saída diferente de `0`, tempo estourado, erro de modelo, de
cota ou de sandbox. Hoje, `codex exec` com a config do João sai `1` com
`The 'gpt-5.5' model is not supported when using Codex with a ChatGPT account.`

### D12 — Leitura só, provada pela árvore · Claude

O contrato `site-review-task` já proíbe escrita. Como `claude-isolado` roda com ferramentas de
escrita disponíveis, Claude compara `git status --short` antes e depois de cada review; diferença é
achado `blocking` contra a própria review, que é descartada e refeita.

O que conta como escrita: mudar arquivo rastreado, ou criar arquivo que o `git status --short`
mostra. Saída ignorada (`dist/`, `coverage/`, caches) e diretório fora do repositório (`/tmp`, o
scratchpad) não contam. Assim o revisor pode rodar `pnpm check`, `pnpm test` e o gate da árvore
espelhada para observar a prova de aceite, que é o que `## Verification observed` pede. O contrato
`site-review-task` ganha essa linha, que vale para o Codex também.

### D13 — O que a passada retroativa cobre · Claude

- **Código e configuração atuais** dos arquivos tocados pelos ranges sem segunda lente, ainda
  existentes, fora de `docs/` e fora do ferramental congelado (§4.2). São 39 arquivos e cerca de 9,3
  mil linhas.
- **`D-32` é a exceção:** seus dois commits (`b9ac09a`, uma linha em `docs/inventario/04-tipografia.md`,
  e `68542eb`, só `docs/superpowers/backlog.md`) são só de documentação. Entram como diff, revisados
  direto.
- **Documentos operacionais e evidências ficam fora.** Evidência é registro datado; runbook é
  documento, não código. Reabrir isso é bloco próprio.

### D14 — Achados viram débito; risco de produção para o bloco · Claude

- `blocking` ou `important` confirmado vira débito novo no backlog, com gatilho.
- `suggestion` confirmada fica só no relatório, sem débito.
- Achado não confirmado fica no relatório como descartado, com o motivo.
- Achado confirmado com risco em produção agora (segurança, perda de mensagem do contato, custo
  descontrolado) para a task em `blocked`, com `next_owner: joao`, para João decidir entre bloco de
  correção imediato e débito.

### D15 — Relatório retroativo em `historico/` · Claude

`docs/superpowers/historico/revisao-retroativa-2026-10.md`. É registro fechado de uma passada que
não se repete, que é o papel de `historico/`.

## 4. Fatos medidos

### 4.1 O Codex hoje

Codex CLI `0.157.1`, login ativo por conta ChatGPT. Um pedido trivial via `codex exec` sai `1` com
`model_not_found`: `~/.codex/config.toml` pede `gpt-5.5`, e `gpt-5.4` também é recusado. Não é
cota, e não é o erro de sandbox de `D-32`. Consertar a config é decisão do João, fora do bloco.

### 4.2 Os ranges sem segunda lente

| Débito | Bloco                     | Range                                |
| ------ | ------------------------- | ------------------------------------ |
| `D-27` | `refactor-contato-intake` | `82bc812`, `dc0408d`                 |
| `D-32` | `paridade-header-cursos`  | `b9ac09a`, `68542eb`                 |
| `D-53` | `7.2.1` (segunda rodada)  | PR #18 (`1535720`)                   |
| `D-65` | `7.2.5`                   | PR #26 (`28542cb`)                   |
| `D-70` | `7.2.6`                   | PRs #28 e #29 (`0d2a890`, `92906d2`) |
| `D-76` | `7.2.7`                   | PR #31 (`dd5fa31`)                   |
| `D-77` | `revisao-arquitetura`     | PR #32 (`cb9654a`)                   |

Para PR, o range é `M^1...M^2` do merge. Juntos, tocam 86 arquivos; 78 existem hoje; tirando
`docs/` e o ferramental congelado, sobram 39:

- **Infra e zona:** `infra/lotus-dns.yaml`, `infra/lotus-site.yaml`, `scripts/infra/conferir-zona.mjs`,
  `scripts/infra/medir-propagacao.mjs`, `scripts/infra/lib/{template,yaml,zona,distribuicao,cabecalhos,politica-de-cabecalhos}.mjs`
  e os testes `scripts/infra/{template,yaml,zona,distribuicao,cabecalhos}.test.mjs`;
  `e2e/cabecalhos.spec.ts`, `e2e/smoke/alvo.ts`.
- **Observabilidade e CI:** `infra/lotus-observabilidade.yaml`, `.github/workflows/ci.yml`,
  `scripts/infra/medir-latencia.mjs`, `scripts/infra/lib/{observabilidade,ci-alerta,latencia}.mjs` e
  os testes `scripts/infra/{observabilidade,ci-alerta,latencia}.test.mjs`.
- **Contato:** `lambda/contato/{handler,handler.test,contrato.test}.ts`,
  `src/integrations/contact/{intake,intake.test}.ts`, `src/lib/{contact-fields,contact-schema,contact-schema.test}.ts`,
  `src/components/sections/{ContactForm,ContactForm.test}.tsx`, `src/app/App.tsx`, `CONTEXT.md`,
  `eslint.config.js`.

A lista exata sai do mesmo cálculo na execução, sobre `main@cb9654a`; diferença contra esta lista
é divergência e para em `blocked`.

### 4.3 O que o harness diz hoje

- **Validador** (`scripts/validate-agent-workflow.mjs:170-187`): exige executor e reviewer
  preenchidos e diferentes, ou iguais com `reviewer_exception`. Não confere o nome: qualquer string
  diferente passa. `claude-isolado` já passa hoje, sem mudança.
- **Testes do validador** (`scripts/validate-agent-workflow.test.mjs`): só cobrem a árvore de
  espelho, por `--root` sobre diretório temporário. O mesmo recurso serve para provar as regras de
  nome.
- **`D-19` está mal descrito:** diz "sem regra escrita", mas `.claude/commands/executar-site.md:42`
  manda, desde `999aa0c` (2026-08-24), `state.md` no commit da task que ele descreve. A lacuna real é
  a transição sem task. `B9` já fazia o que D9 escreve: `74055ef` leva `state.md` junto do
  `refactor`, e `e0447ef`, `8e0e048`, `6353469`, `0879a52` e `c41877e` são `chore` próprios.
- **`D-15`:** `.claude/rules/architecture.md:13` e `.prettierignore:6` citam `public/icons.svg`, que
  não existe; ícones vêm de `lucide-react` (`Destaques.tsx:1`, `MobileMenu.tsx:1`).
- **Espelho:** `scripts/validate-agent-workflow.mjs` e seu teste atravessam para o corporativo
  (`.espelho-exclusoes` não os lista); `.claude/`, `.agents/`, `CLAUDE.md` e `docs/` não.

### 4.4 Visto e deixado

- `.agents/skills/site-review-task/SKILL.md` diz que evidência visual só é exigida "quando
  Playwright existir"; Playwright existe desde `1.2.4-1.3.9`.
- `.claude/commands/fechar-site.md` lista gates de antes de `pnpm check`.
- A classe "segunda lente ausente" do futuro: com D2–D5, só abre débito o caso raro de D4.

Os dois primeiros viram débito novo no fechamento, com gatilho "próxima manutenção do harness".

## 5. Desenho

### 5.1 `claude-isolado` no contrato

- **Validador:** conjunto `['claude', 'codex', 'claude-isolado']` para os dois campos;
  `claude-isolado` em `executor` reprova; nome fora do conjunto reprova com mensagem que cita o
  nome. A regra de iguais com `reviewer_exception` continua.
- **Testes do validador:** árvore temporária com os arquivos do harness copiados do repositório e
  `state.md` variando; provam (a) `claude`/`claude-isolado` passa sem exceção, (b) `claude-isolado`
  como executor reprova, (c) nome desconhecido reprova, (d) iguais com exceção passa, (e)
  `claude-isolado` com `reviewer_exception` preenchida reprova. Esses cinco testes pulam quando o
  harness não está na árvore (sem `CLAUDE.md`), porque no espelho não há o que copiar e o próprio
  validador já pula a checagem de estado lá; os testes de espelho que existem continuam rodando nas
  duas árvores. Escolha minha, contra fabricar cópias sintéticas dos quinze arquivos, que
  duplicariam o contrato.
- **`/planejar-site`:** antes de gravar o handoff, roda o teste de D11; o handoff passa a aceitar
  `reviewer: codex|claude|claude-isolado`.
- **`/revisar-site`:** ao abrir, roda o teste de D11 quando o executor não é o Codex e grava o
  reviewer que o resultado manda (D3), com commit próprio quando ele muda (D10). Ganha o ramo "executor Claude / reviewer `claude-isolado`": dispara um
  agente novo (D2) com o contrato `site-review-task` na íntegra e a entrada listada em D2, e nada
  mais; aplica D12; confere cada achado (D6).
- **`site-review-task`:** `Require reviewer: codex` passa a aceitar `claude-isolado`.
- **`/fechar-site`:** a linha de `progress.md` segue D10.
- **`CLAUDE.md` §4** e **`state.md` (invariantes):** a revisão independente passa a nomear Codex ou
  `claude-isolado`; a delegação "na íntegra, sem paráfrase" vale para os dois.

### 5.2 Passada retroativa

- **Áreas:** as três de §4.2, um agente `claude-isolado` cada, mais o diff de `D-32` junto da área
  que o executor achar melhor. Dividir uma área em duas é escolha do executor. Os agentes rodam um
  de cada vez, para que a comparação de D12 diga de qual agente veio uma escrita.
- **Entrada de cada agente:** o contrato `site-review-task` na íntegra, mais um bloco que diz: alvo
  é o conteúdo atual dos arquivos listados em `main@cb9654a`, não um diff; as dimensões Acceptance e
  Scope não se aplicam e vão para `## Limitations`.
- **Saída:** o relatório de D15, com por área o veredito do agente, cada achado com
  `confirmado`/`descartado` e o motivo, e o destino de D14.
- **Backlog:** os sete débitos de D1 recebem "Fechado em <data>" citando o relatório; os débitos
  novos de D14 entram com número seguinte ao maior existente. Achado que repete débito aberto não
  abre débito novo: o relatório aponta para o existente, que ganha uma nota.

### 5.3 `D-15`, `D-18`, `D-19`

- **`D-15`:** `architecture.md:13` diz que ícone vem de `lucide-react` e não ganha sprite nem SVG
  solto sem consumidor; sai `public/icons.svg` do `.prettierignore`.
- **`D-18`:** quatro linhas no `.prettierignore` (D9).
- **`D-19`:** a regra entra em `CLAUDE.md` §4, onde vale para os quatro comandos;
  `executar-site.md:42` passa a apontar para ela; `/revisar-site` confere a regra junto de "um commit
  por EAP".

## 6. Sequência de execução

1. `D-18` primeiro: a partir dele, a spec e o plano deste bloco deixam de ser reescritos pelo
   Prettier.
2. `D-15`.
3. `D-19`.
4. `claude-isolado` no contrato (5.1).
5. Passada retroativa (5.2), já com o contrato novo.

## 7. Commits

Um por task, sem push (`/executar-site`), com `state.md` segundo a própria regra de `D-19`:

1. `chore(harness-debitos): tirar spec, plano, bounded design e packet do Prettier`
2. `docs(harness-debitos): apontar a rule de ícones para lucide-react`
3. `docs(harness-debitos): escrever a regra de commit das transições de estado`
4. `feat(harness-debitos): claude-isolado como segunda lente quando o Codex não responde`
5. `docs(harness-debitos): registrar a passada retroativa e fechar a segunda lente ausente`

O relatório retroativo e o backlog dos sete débitos entram no commit 5. Os débitos de §4.4 e o
fechamento de `D-15`, `D-18` e `D-19` ficam para `/fechar-site`.

## 8. Prova de aceite

Critério específico, antes dos gates:

- **`D-18`:** `pnpm exec prettier --file-info` devolve `"ignored": true` para um arquivo de cada um
  dos quatro diretórios e `"ignored": false` para `docs/superpowers/backlog.md`.
- **`D-15`:** `icons.svg` sem ocorrência em `.claude/` e em `.prettierignore` (grep).
- **`D-19`:** a regra presente em `CLAUDE.md` e citada em `executar-site.md` e `revisar-site.md`
  (grep); o histórico da própria branch obedece a ela (`git log --name-only main..HEAD`).
- **`claude-isolado`:** os cinco testes de 5.1 passam e falham com a regra correspondente desligada
  (mutação manual, revertida, registrada no relatório da execução); `pnpm agent:check` verde sobre
  o `state.md` real com `reviewer: claude-isolado`.
- **Teste do Codex:** o teste de D11, rodado na execução, classifica o Codex de hoje como
  indisponível com a linha do erro.
- **Passada retroativa:** relatório com as três áreas e o diff de `D-32`; nenhum achado sem
  destino; `git status --short` igual antes e depois de cada agente (D12); sete débitos fechados.

Gates, sob Node 24.19.0:

- `pnpm check` com saída `0`;
- a árvore espelhada: `git archive` de `HEAD` filtrado por `.espelho-exclusoes`, extraído num
  diretório novo do scratchpad, `pnpm install --frozen-lockfile --offline` e `pnpm check` com saída
  `0`. Obrigatório porque o validador e o teste dele atravessam (§4.3).

`pnpm e2e` não é exigido: nenhum arquivo de produto muda (§2). O CI do PR roda mesmo assim.

## 9. Rollback do próprio bloco

Tudo é repositório: `git revert` do commit. Nada sai para AWS, Notion ou corporativo além do que o
espelho já leva no próximo release, e o validador do espelho continua pulando a checagem de estado
quando o harness não atravessa.

## 10. Documentos, débitos e backlog

Durante a execução, junto da task:

- `.prettierignore`, `.claude/rules/architecture.md` (commits 1 e 2);
- `CLAUDE.md`, `.claude/commands/executar-site.md`, `.claude/commands/revisar-site.md` (commit 3);
- `scripts/validate-agent-workflow.mjs`, `scripts/validate-agent-workflow.test.mjs`,
  `.claude/commands/{planejar,revisar,fechar}-site.md`, `.agents/skills/site-review-task/SKILL.md`,
  `CLAUDE.md`, `docs/superpowers/state.md` (commit 4);
- `docs/superpowers/historico/revisao-retroativa-2026-10.md` e `docs/superpowers/backlog.md`
  (commit 5).

No fechamento (`/fechar-site`), no backlog:

- **`B10`** com "Entregue"; **`AGORA`** atualizado.
- **`D-15`, `D-18` e `D-19`** fechados; `D-19` com a correção de §4.3.
- **`D-16` e `D-31`** com nota de que `B10` os deixou fora (D8).
- **Novos:** os dois itens de §4.4; e, se o Codex continuar quebrado, um débito de pendência do
  João para a config (§4.1), sem gatilho de bloco.

## 11. Riscos

- **Mesma família de modelo nos dois papéis.** `claude-isolado` é independente de contexto, não de
  modelo: pontos cegos do modelo podem se repetir. João aceitou isso em D2. Mitigação: o Codex
  continua primeiro (D3).
- **Agente com ferramenta de escrita.** Mitigação: D12.
- **Passada retroativa inflar o backlog.** Mitigação: `suggestion` não vira débito (D14).
- **Teste do Codex gastar cota.** Um pedido trivial por comando; custo desprezível perto de uma
  review.
- **Espelho.** O validador muda e atravessa. Mitigação: o gate da árvore espelhada (§8).
- **Agente sem contexto errando o alvo da passada retroativa.** Mitigação: a lista fechada de
  arquivos por área e o bloco de entrada de 5.2.

## 12. Handoff de execução

executor: claude
reviewer: claude-isolado
paths_autorizados:

- não se aplica (executor = claude)

O reviewer já nasce `claude-isolado`: o teste de D11 falhou em 2026-10-24 com
`The 'gpt-5.5' model is not supported when using Codex with a ChatGPT account.` (§4.1).
`/revisar-site` testa de novo e volta para `codex` se ele responder.
