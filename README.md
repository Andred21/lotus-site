# lotus-site

Site institucional público da Lotus OTEC.

Primeiro marco: clone funcional e visualmente fiel de `https://lotusotec.cl/`. Redesign e
evolução só depois de uma baseline de paridade aprovada.

## Requisitos

- Node `24.19.0` — a versão está em `.nvmrc`; use `nvm use`
- pnpm 11, habilitado por Corepack

`engineStrict` está ligado: runtime fora da faixa declarada em `engines` falha com
`ERR_PNPM_UNSUPPORTED_ENGINE` em qualquer comando pnpm. Isso é proposital.

## Começar

```bash
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

A aplicação sobe em `http://localhost:5173`.

## Comandos

| Comando             | O que faz                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`          | servidor de desenvolvimento com HMR                                          |
| `pnpm build`        | `tsc -b` seguido do build de produção                                        |
| `pnpm preview`      | serve o `dist/` já gerado                                                    |
| `pnpm typecheck`    | typecheck isolado dos três projetos TypeScript                               |
| `pnpm lint`         | ESLint via flat config                                                       |
| `pnpm format`       | aplica Prettier                                                              |
| `pnpm format:check` | verifica formatação sem escrever                                             |
| `pnpm test`         | testes unitários, uma passada                                                |
| `pnpm test:watch`   | testes unitários em watch                                                    |
| `pnpm e2e`          | testes de ponta a ponta no Chromium                                          |
| `pnpm check`        | `agent:check` + `format:check` + lint + typecheck + testes unitários + build |
| `pnpm agent:check`  | valida o contrato do harness de agentes                                      |

`pnpm check` é o gate. `pnpm e2e` fica fora dele porque precisa subir servidor, e roda
separado no CI.

Antes do primeiro `pnpm e2e`, instale o navegador:

```bash
pnpm exec playwright install --with-deps chromium
```

O E2E sobe o próprio servidor na porta `5183`, com `--strictPort`: porta ocupada
falha em vez de testar contra um servidor alheio. Use `E2E_PORT` para trocar.

## Estrutura

```text
src/
├── lib/        helpers puros, sem React
├── content/    conteúdo institucional e dados estáticos
└── assets/     assets importados por componente
e2e/            testes de ponta a ponta
scripts/        ferramental do harness de agentes
docs/           ADR, specs, planos e estado do workflow
```

Diretório só nasce quando há consumidor real. `components/`, `app/` e `integrations/` chegam
com o clone. A árvore alvo e a direção de dependências estão em
`.claude/rules/architecture.md` — violação delas é erro de lint, não de revisão.

`src/assets/` guarda o que é importado por componente e ganha fingerprint do Vite; `public/`
é copiado verbatim e referenciado por URL absoluta.

## Decisões

`docs/adr/ADR-SITE-001.md` registra stack, princípios e o que foi deliberadamente adiado.

## Fluxo de trabalho

Cada bloco de trabalho roda em branch própria e vira um PR; `main` não recebe commit direto.
O estado corrente do fluxo vive em `docs/superpowers/state.md`, e as regras completas em
`CLAUDE.md`. Este README não as duplica.
