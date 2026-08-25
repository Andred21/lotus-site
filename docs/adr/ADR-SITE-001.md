# ADR-SITE-001 · Fundação técnica do lotus-site

- **Status:** aceito
- **Data:** 2026-08-24
- **Escopo:** Sprint 0, EAP 1.1.1 a 1.3.9

## Contexto

`lotus-site` reconstrói o site institucional público da Lotus OTEC. O primeiro marco é um
clone funcional e visualmente fiel de `https://lotusotec.cl/`; redesign vem depois de uma
baseline de paridade aprovada. Isso empurra a fundação para o mínimo que sustenta um clone
verificável, não para uma plataforma.

## Decisões

### Vite, não Next.js

O site é institucional, estático e de página única por âncoras. Não há renderização no
servidor, rota dinâmica nem camada de dados a justificar Next.js. Vite entrega HMR rápido e
build simples.

Várias tasks do roadmap no Notion ainda descrevem Next.js — App Router, Server Action,
`next/image`. São stale e estão registradas como débito D-01; não foram reconciliadas porque
escrita no Notion exige autorização explícita.

### pnpm com versão fixada, Node 24 fixado

`packageManager` no `package.json` via Corepack, `.nvmrc` com `24.19.0` e `engines` declarando
`node >=24.19.0 <25`. `engineStrict: true` no `pnpm-workspace.yaml` transforma runtime
incompatível em erro, não em aviso.

Consequência que morde: qualquer ambiente fora dessa faixa — inclusive um runner de CI mal
configurado — falha com `ERR_PNPM_UNSUPPORTED_ENGINE` em todo comando pnpm. Por isso o
workflow usa `node-version-file: .nvmrc` em vez de fixar a versão à mão.

### TypeScript estrito desde o começo

`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`,
`erasableSyntaxOnly`, `verbatimModuleSyntax`. `any` e cast para calar o compilador são
proibidos: erro de tipo se resolve com guarda ou com tipo correto.

`tsconfig.json` é um solution file com três projetos: `tsconfig.app.json` para `src/`,
`tsconfig.node.json` para código de build e scripts, `tsconfig.e2e.json` para `e2e/`.
Arquivo de configuração novo precisa entrar no `include` de um deles, senão nasce fora do
`tsc -b`.

### Direção de dependências como catraca de lint

`content` não importa React nem componente. `lib` não importa React nem componente. `ui` não
importa `sections`. `components` não importa `integrations` — integração entra por prop ou
callback. Violação é erro de `pnpm lint`, não observação de revisão.

### Tailwind 4, sem arquivo de configuração

Tailwind 4 configura por CSS: `@import 'tailwindcss'` em `src/index.css` e
`@tailwindcss/vite` no `vite.config.ts`. Nenhum `tailwind.config.js` existe. `prettier-plugin-tailwindcss`
localiza o Tailwind pela opção `tailwindStylesheet` no `.prettierrc`.

Tailwind entrou dentro da EAP 1.2.5 porque nenhuma task do roadmap o instala, apesar de duas
dependerem dele. Débito D-08.

### Vitest para unidade, Playwright para E2E

Vitest com jsdom cobre lógica e componente; testes ficam ao lado do código, em
`src/**/*.test.ts`. Playwright cobre a aplicação real, com specs em `e2e/`, fora de `src/`.

`pnpm check` roda `agent:check`, lint, typecheck, testes unitários e build. E2E fica fora do
`check` e roda por `pnpm e2e` e no CI, porque precisa subir servidor.

### Estrutura de pastas por consumidor real

Diretório só existe quando há consumidor. Hoje existem `src/lib/` e `src/content/`, ambos
consumidos por `src/App.tsx`. `src/components/`, `src/app/` e `src/integrations/` nascem
quando houver código real — `components/` no Sprint 2, com o clone.

O critério da EAP 1.3.5 no Notion pedia também `features/contact`, `config`, `tests` e `docs`.
As rules do repositório venceram; a divergência é o débito D-09.

## Adiado, com motivo

| Adiado                                    | Motivo                                               | Volta em                                          |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Router                                    | navegação é uma página com âncoras                   | quando houver segunda rota real                   |
| Estado global                             | estado local e derivado bastam                       | quando dois ramos distantes compartilharem estado |
| WebKit e Firefox no Playwright            | sem clone, cobrir três motores custa sem retorno     | Sprint 5 · débito D-10                            |
| axe reprovando o build                    | o alvo é a home do scaffold, descartada no Sprint 2  | Sprint 4 · débito D-11                            |
| `eslint.config.js` sob `checkJs`          | tipagem própria pesada, fora do que a EAP 1.3.6 pede | quando houver necessidade real                    |
| `features/contact`                        | não há formulário até o Sprint 3                     | Sprint 3 · débito D-09                            |
| Limite numérico de tamanho e complexidade | sem amostra do clone não há como calibrar            | após o Sprint 2 · débito D-04                     |
| Teste de regressão visual, Lighthouse CI  | não há o que comparar antes do clone                 | Sprint 5                                          |

## Consequências

Um desenvolvedor novo clona, instala e roda `pnpm check` para saber se o repositório está
saudável. Um agente tem catraca automática para as regras que importam, em vez de depender de
revisão humana atenta.

O custo é rigidez: runtime fora da faixa não roda, tipo frouxo não compila, import fora da
direção declarada não passa no lint. É deliberado — o clone visual do Sprint 2 vai produzir
volume grande de código, e é mais barato barrar na entrada do que revisar depois.
