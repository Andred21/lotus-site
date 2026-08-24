# CLAUDE.md — Lotus Site

## 1. Produto

`lotus-site` reconstrói o site institucional público da Lotus OTEC. Primeiro marco: clone funcional e visualmente fiel de `https://lotusotec.cl/`; redesign e evolução somente após baseline de paridade aprovada.

## 2. Fontes de verdade

1. instrução atual e explícita do João Victor;
2. Google Drive canônico quando houver planejamento para o assunto;
3. referência Git solicitada ou a branch padrão atual;
4. Notion `collection://2f0e72ec-ef53-4e08-a466-312de7eea7d2` para organização das tasks;
5. memória somente como pista.

O site público é referência visual/conteúdo do clone, não autoridade arquitetural. Divergência material entre fontes bloqueia; não escolha silenciosamente.

## 3. Estado e contexto

Leia sempre `docs/superpowers/state.md` primeiro. Histórico vive em `docs/superpowers/historico/progress.md` e nunca define fase. Leia packet/spec/plano apontados pelo estado antes de buscar contexto novamente. Antes de editar, carregue as rules de `.claude/rules/` cujos `paths` casam com os arquivos tocados.

Quatro fontes, papéis distintos:

```text
docs/superpowers/state.md               = fase e item ativo
docs/superpowers/backlog.md             = fila operacional local
Notion collection://2f0e72ec-…          = roadmap externo
docs/superpowers/historico/progress.md  = histórico fechado
```

Com `workflow_state: idle`, Claude pode exibir o backlog quando pedido. Claude não seleciona item
automaticamente, não promove item do backlog e não altera o Notion por causa do backlog.

## 4. Workflow

Superpowers conduz a técnica; os comandos do site apenas impõem gates.

- `/planejar-site <work-item>` — contexto → brainstorming/spec/plano; não implementa.
- `/executar-site <work-item>` — executa somente plano aprovado.
- `/revisar-site <work-item>` — revisão independente pelo agente diferente do executor.
- `/fechar-site <work-item>` — prova aceite, gates, histórico e volta a `idle`.

Delegação ao Codex usa o contrato em `.agents/skills/<nome>/SKILL.md`; Claude repassa esse conteúdo ao Codex na íntegra, sem paráfrase.

Modo inicial: `supervised`. `/desenvolver-site` não existe até decisão arquitetural posterior.

## 5. Leis do site

1. Clone antes de redesign.
2. Claude é o único escritor de `state.md` no harness.
3. Work item nunca é selecionado automaticamente.
4. Codex delegado não replaneja nem sai de `paths_autorizados`.
5. Relatório de agente não substitui diff/teste executado.
6. Sem escrita em Notion/Drive/Figma, push, PR ou merge sem autorização explícita.
7. Não adicionar dependência sem necessidade do work item.
8. Não afirmar teste/build/lint aprovado sem execução real.

## 6. Comandos técnicos atuais

- Gerenciador de pacotes é **pnpm** (não usar npm nem yarn).
- Pacote recusado por publicação recente demais libera exceção em `minimumReleaseAgeExclude`, no `pnpm-workspace.yaml`.
- `pnpm dev` — servidor de desenvolvimento com HMR.
- `pnpm build` (`tsc -b && vite build`) — typecheck seguido de build de produção.
- `pnpm typecheck` (`tsc -b`) — typecheck isolado, sem build; mesmo comando exigido pelo aceite da EAP 1.2.3.
- `pnpm lint` — ESLint via flat config (`eslint.config.js`).
- `pnpm preview` — serve o `dist/` já gerado.
- Não há test runner configurado hoje; nenhum script `test` nem dependência de testes instalada.
- `tsconfig.json` é um solution file que referencia dois projetos buildados juntos por `tsc -b`: `tsconfig.app.json` (código de aplicação em `src/`) e `tsconfig.node.json` (código de build, ex. `vite.config.ts`). Script de build novo (ex. `vitest.config.ts`, plugin Vite) precisa entrar no `include` de `tsconfig.node.json` ou `tsc -b` nunca o typecheca.
- Compilador roda com `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters` e `erasableSyntaxOnly` ativos (import/variável não usada ou sintaxe com semântica de runtime como `enum` quebram `pnpm build`) e com `verbatimModuleSyntax` (import/export somente-tipo precisam da palavra `type`).
- Lint usa ESLint flat config.
- `src/assets/` guarda assets importados por componente (Vite fingerprinta o arquivo); `public/` é copiado verbatim e referenciado por URL absoluta.
- Runtime fixado: Node **24.19.0** (`.nvmrc`) e pnpm **11.x**, declarados em `engines` no `package.json`.
- `engineStrict: true` no `pnpm-workspace.yaml` transforma runtime incompatível em erro (`ERR_PNPM_UNSUPPORTED_ENGINE`), não em aviso.
