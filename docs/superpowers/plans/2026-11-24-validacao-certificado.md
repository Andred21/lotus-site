# Página de validação de certificado (`validacao-certificado`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar no site a validação de certificado da Lotus: `/validar` (código + RUT) e
`/validar/<uuid>` (QR), no layout do site, com o item "Validar Certificado" no menu, a borda servindo
as duas formas por reescrita explícita e o deploy tratando a segunda página HTML como arquivo de nome
fixo.

**Architecture:** Duas entradas HTML no Vite (`index.html` e `validar/index.html`), sem router. A
função `viewer-request` que já faz o `www` passa a reescrever três formas de caminho para
`/validar/index.html`; um plugin do Vite faz o mesmo no dev e no preview, e uma tabela única de casos
prova que os dois decidem igual. A página fala com a API pública do Lotus por um adapter em
`src/integrations/certificados/` que devolve uniões discriminadas; os tipos dessas uniões moram em
`src/lib/`, que componente e integração podem ver. A composição fica em `src/app/ValidarApp.tsx`.

**Tech Stack:** Vite 8.2 (`build.rolldownOptions`), React 19, TypeScript 6, Tailwind 4, zod 4.4,
Vitest 4 + Testing Library (jsdom), Playwright 1.62 (Chromium, Firefox, WebKit, iPhone 13),
CloudFront Functions `cloudfront-js-2.0`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-24-validacao-certificado-design.md` (citada como `§`/`Dn`).
**Context Packet:** `docs/superpowers/context-packets/validacao-certificado.md` (`K1`–`K8`).

## Global Constraints

- Branch `feat/validacao-certificado`; nenhum commit em `main`; sem push (`/executar-site`).
- Um commit por task: `<tipo>(validacao-certificado): <descrição>`, terminando com
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. A mensagem de cada task está no passo
  de commit dela.
- `state.md`: a ida para `executing` entra no commit da Task 1; a ida para `ready_for_review` é
  `chore` próprio, no fim da Task 12 (CLAUDE.md §4).
- Antes de todo comando de Node: `source ~/.nvm/nvm.sh >/dev/null && nvm use >/dev/null`.
- Nenhuma dependência nova (Lei 7). `zod`, Testing Library e Playwright já estão instalados.
- Direção de dependências (`eslint.config.js`): componente não importa `src/integrations/` nem `zod`,
  nem mesmo tipo; os tipos do resultado moram em `src/lib/certificado.ts`; só `src/app/` liga
  integração a componente; `src/lib/` não importa React.
- Anti-objetivos da spec §2 valem para toda task: o RUT só viaja no corpo do `POST /consulta`; nada em
  `localStorage`/`sessionStorage`; nada no console; `credentials: 'omit'` em todo `fetch`; só os
  headers `Accept` e `Content-Type`.
- Texto da página: o da spec §5.4, verbatim, em espanhol, todo em `src/content/validacao.ts`.
- `infra/lotus-site.yaml` mantém os comentários em ASCII sem acento, como o resto do arquivo.
- Ninguém aplica o template nesta execução: nada de `aws cloudformation`. Aplicar o change set é o
  passo 2 de D13, de João.
- `docs/` não atravessa para o espelho corporativo (`.espelho-exclusoes`): teste que lê arquivo de
  `docs/` usa `it.skipIf(!existsSync(caminho))`.
- O resto da home não muda: só `site.nav`, o `Header`, o `MobileMenu` e, se A5 exigir, a rolagem até o
  fragmento (D7).
- Arquivo tocado que o Prettier formata passa por `pnpm exec prettier --write <arquivo>` antes do
  commit (`docs/superpowers/{specs,plans}/` são ignorados).
- Nada no Notion, Drive ou Figma; nada no repositório do Lotus (Lei 6, spec §2).
- `SP=/tmp/claude-1000/-home-jvbat-projetos-lotus-site/1b57a6d9-efd8-4a32-8dc3-3ab5aa024198/scratchpad`
  é o diretório de rascunho fora do repositório. Numa sessão nova, use o scratchpad dela.

## Precisões do plano

Decisões que a spec deixou ao executor (§12) ou não cobriu, tomadas aqui para o executor não ter de
inventá-las. João confere ao aprovar o plano.

- **P1 · `lang="es-CL"`** em `validar/index.html`, igual a `index.html` e a `site.locale`; a spec
  §5.3 dizia `es`.
- **P2 · Pasta `src/components/validacao/`.** `sections/` é da landing page; a rule de arquitetura
  ganha a linha da pasta nova na Task 1.
- **P3 · Teto de espera:** 15 s nas consultas e 30 s no PDF (renderizado no Gotenberg a cada pedido,
  `K2`). Estourado, o `AbortController` cancela e o resultado é `falha`, como no adapter de contato.
- **P4 · Fim da espera (≤ 60 s):** no formulário, o cartão ESPERE some e VALIDAR volta; pelo QR, a
  página repete o `GET` uma vez ao chegar a zero, porque ali não há botão para tentar de novo.
- **P5 · Espera do PDF:** contagem ao lado do botão, botão desativado até zero; depois a mensagem
  some.
- **P6 · 410 do PDF num cartão válido:** o cartão passa a revogado com o `revoked_at` que tinha
  (nulo), então a linha "Revocado el" é omitida (regra de data ausente de D4).
- **P7 · Singular:** "1 segundo", "1 minuto".
- **P8 · Foco:** vai ao título do cartão só depois de ação de quem usa (envio do formulário, 410 do
  PDF). Ao abrir pelo QR o foco não se move.
- **P9 · A contagem não é anunciada a cada segundo:** o número fica num `<span aria-live="off">`
  dentro da região `polite`.
- **P10 · `revoked_at` chega com microssegundos** (`2026-08-05T14:30:00.000000Z`, Carbon
  `toISOString()` no Lotus): `formatarInstante` corta a fração para milissegundos antes do `Date`, e
  o E2E revogado roda no WebKit.
- **P11 · Prefixo diferencia caixa:** `/VALIDAR` é 404; só o uuid é sem caixa (como o `S3`, que
  diferencia caixa na chave).
- **P12 · Regressão visual:** só `home-1440` é regravado. `home-375` tem de passar sem regravar: no
  mobile o menu fechado não muda.
- **P13 · Cores de estado medidas** (branco sobre a cor): `#1e7a3c` 5,38:1, `#8a5a00` 5,93:1,
  `--color-danger` `#b3261e` 6,54:1; selo neutro em `--color-accent-ink` `#353740`, 11,85:1.
- **P14 · Classificação por status, nunca por corpo.** 404, 410, 429 e 5xx não leem o corpo; só o
  200 (schema) e o 422 (`errors`, tolerante) leem.
- **P15 · Campos do formulário:** o mesmo desenho de linha inferior do `ContactForm` (rótulo
  `sr-only`, `placeholder` com o rótulo, classes copiadas com comentário apontando D3). O
  `ContactForm` não é tocado, para a home não mudar.
- **P16 · O schema descarta `cliente` e `redator`** (o `z.object` do zod remove chave não declarada):
  os "dados mínimos" de D4 valem já na integração, e o componente nunca vê esses nomes.
- **P17 · Preload:** `preloadCritical` não pré-carrega mais a foto do hero desde 2026-08-29; só as
  fontes Montserrat 700 e Open Sans 500, que a página de validação também usa. O plugin continua
  atuando nas duas páginas sem mudança (spec §5.3).

## Review Focus

Entradas que a spec implica e que mais provavelmente quebram para quem usa. Cada linha tem teste na
task dona do código.

- **`revoked_at` no formato real do Lotus** (`…:00.000000Z`) num iPhone: a data de Santiago aparece
  certa, nunca "Invalid Date" — Task 6 (vetor no `datas.test.ts`) e Task 10 (revogado nos quatro
  motores).
- **`Retry-After` na borda dos limites:** `60` é espera, `61` é bloqueio de "2 minutos"; `0`, `-5`,
  `1.5`, data HTTP e ausente viram espera sem número — Task 7.
- **PDF responde 410 para um cartão mostrado como válido** (revogado entre a consulta e o clique): o
  cartão vira revogado, sem botão e sem data — Task 9 e Task 10.
- **Segundo envio com "Validando…" ou durante a espera** (Enter no campo, clique duplo): nenhum pedido
  a mais — Task 9.
- **Resposta de erro sem `problem+json`** (página HTML de proxy em 404/429/500, 422 vazio) e 200 com
  JSON fora do contrato: classificação pelo status, e 200 inesperado vira falha genérica, nunca cartão
  pela metade — Task 7.

---

## Mapa de arquivos

| Arquivo | Task | Papel |
|---|---|---|
| `docs/adr/ADR-SITE-007.md` | 1 | um HTML por página, sem router, reescrita explícita |
| `docs/adr/ADR-SITE-004.md` | 1, 4 | nota da regra de 404; rollback com quatro arquivos fixos |
| `.claude/rules/architecture.md` | 1 | linha do router e pasta `validacao/` |
| `scripts/infra/lib/validar.mjs` | 2 | `DESTINO_DA_VALIDACAO`, `CASOS_DA_VALIDACAO` (tabela única de D11) |
| `scripts/infra/lib/distribuicao.mjs`, `distribuicao.test.mjs` | 2 | catraca da função com a tabela |
| `infra/lotus-site.yaml` | 2 | função, CSP, comentários |
| `scripts/infra/lib/cabecalhos.mjs`, `cabecalhos.test.mjs` | 2 | `connect-src`, comentário de D18 |
| `scripts/vite/reescrever-validar.mjs` + `.test.mjs` | 3 | plugin de dev/preview |
| `vite.config.ts` | 3 | duas entradas, `appType: 'mpa'`, plugin |
| `validar/index.html`, `src/validar.tsx`, `src/app/ValidarApp.tsx` | 3, 5, 9 | segunda página |
| `src/app/validar-head.test.ts` | 3 | catraca do `<head>` |
| `e2e/validar-caminhos.spec.ts` | 3 | A4 no preview |
| `scripts/infra/lib/publicacao.mjs` + `publicacao.test.mjs` | 4 | catraca do `ci.yml` e do rollback |
| `.github/workflows/ci.yml` | 4 | syncs e invalidação |
| `src/content/site.ts`, `Header.tsx`, `MobileMenu.tsx` | 5 | menu |
| `e2e/navegacao.spec.ts` | 5 | A5 |
| `src/lib/rut.ts`, `codigo-de-registro.ts`, `datas.ts`, `modo-da-validacao.ts` | 6 | funções puras |
| `src/lib/certificado.ts`, `certificado.fixture.ts` | 7 | schema, uniões, dados de teste |
| `src/integrations/certificados/api-certificados.ts` | 7 | adapter |
| `src/content/validacao.ts` | 8 | texto da página |
| `src/components/validacao/*` | 8, 9 | selo, cartões, formulário, PDF, página |
| `e2e/certificados-falsos.ts`, `e2e/validar.spec.ts` | 10 | A3 |
| `docs/infra/evidencia-validacao-certificado-<data>.md` | 11 | A7 |

---

### Task 1: ADR-SITE-007 e as regras de arquitetura

**Files:**
- Create: `docs/adr/ADR-SITE-007.md`
- Modify: `docs/adr/ADR-SITE-004.md:284-285` (nota depois do item do 404)
- Modify: `.claude/rules/architecture.md` (linha do router; árvore de `src/components/`)
- Modify: `docs/superpowers/state.md` (`executing`)

**Interfaces:** nenhuma de código.

- [ ] **Step 1: Escrever `docs/adr/ADR-SITE-007.md`**

  Formato da `ADR-SITE-006`. Título: `# ADR-SITE-007 · Uma página é um HTML próprio, servido por
  reescrita explícita na borda`. Cabeçalho: **Status** aceito; **Data** 2026-11-24; **Escopo**
  `validacao-certificado`; **Relaciona** `ADR-SITE-004` (sem fallback genérico). Seções:
  - **Contexto:** primeira página além da home; o QR impresso aponta para o caminho fixo
    `/validar/<uuid>` (`K7`); a `ADR-SITE-004` proíbe responder 200 a caminho inventado.
  - **Decisão:** um `.html` por página como entrada do Vite; a função `viewer-request` do behavior
    padrão reescreve só as formas de caminho declaradas de cada página; dev e preview reproduzem a
    borda com um plugin, e uma tabela única de casos prova os dois; sem router (D6).
  - **Consequências:** página nova custa entrada no `vite.config.ts`, casos na tabela, arquivo de nome
    fixo no `ci.yml` e no rollback e caminho na invalidação; o `<head>` de cada página é estático.
  - **Alternativas:** a tabela da spec §4, com a razão de cada recusa.
  - **Quando revisitar:** quando o site tiver páginas que se beneficiem de navegação no cliente ou de
    pré-renderização; isso é decisão de bloco próprio (D6).

- [ ] **Step 2: Nota na `ADR-SITE-004`**

  Logo depois do item "Caminho inexistente devolve **404**…" (linha 284), acrescentar:

  ```markdown
  > **Atualização de 2026-11-24 (`validacao-certificado`).** `/validar`, `/validar/` e
  > `/validar/<uuid>` são servidos por reescrita explícita na função `viewer-request`
  > ([`ADR-SITE-007`](ADR-SITE-007.md)). Caminho fora dessas formas continua 404.
  ```

- [ ] **Step 3: Rule de arquitetura**

  Trocar a linha "Não adicionar router enquanto a navegação continuar sendo uma única página por
  âncoras." por "Não adicionar router: cada página é um HTML próprio, servido por reescrita explícita
  na borda (`ADR-SITE-007`). Router ou pré-renderização só entram por decisão de bloco." Na árvore,
  depois de `sections/`, a linha `│   ├── validacao/  página de validação de certificado (/validar)`.

- [ ] **Step 4: `state.md` para `executing`**

  `workflow_state: executing`, `next_owner: claude`, `next_action: continue_active_plan`,
  `state_basis_commit` = `git rev-parse --short HEAD` antes do commit, `updated_at` em UTC.

- [ ] **Step 5: Verificar**

  Run: `pnpm exec prettier --write docs/adr/ADR-SITE-007.md docs/adr/ADR-SITE-004.md .claude/rules/architecture.md && pnpm agent:check`
  Expected: `Agent workflow contract OK`.

- [ ] **Step 6: Commit**

  ```bash
  git add docs/adr/ADR-SITE-007.md docs/adr/ADR-SITE-004.md .claude/rules/architecture.md docs/superpowers/state.md
  git commit -m "docs(validacao-certificado): registrar a ADR-SITE-007 de um HTML por página"
  ```

---

### Task 2: Borda — reescrita de `/validar` e `connect-src` da API

**Files:**
- Create: `scripts/infra/lib/validar.mjs`
- Modify: `scripts/infra/lib/distribuicao.mjs:168-193` (`CASOS_DO_REDIRECT`) e `:347-361`
  (`conferirDistribuicao`)
- Modify: `scripts/infra/distribuicao.test.mjs`
- Modify: `infra/lotus-site.yaml:156` (CSP), `:182-227` (comentário, `Comment`, código),
  `:306-309` (comentário de `CustomErrorResponses`)
- Modify: `scripts/infra/lib/cabecalhos.mjs:13-48` e `scripts/infra/cabecalhos.test.mjs`

**Interfaces:**
- Produces (`scripts/infra/lib/validar.mjs`), consumido pela Task 3:
  - `export const DESTINO_DA_VALIDACAO = '/validar/index.html'`
  - `export const UUID_DE_EXEMPLO = '0f8fad5b-d9cb-469f-a165-70867728950e'`
  - `export const CASOS_DA_VALIDACAO: readonly { nome: string, uri: string, vira: string }[]`

- [ ] **Step 1: Escrever a tabela em `scripts/infra/lib/validar.mjs`**

  `Object.freeze` dos casos, nesta ordem (`U` = `UUID_DE_EXEMPLO`, `D` = destino):

  | `nome` | `uri` | `vira` |
  |---|---|---|
  | formulário sem barra | `/validar` | `D` |
  | formulário com barra | `/validar/` | `D` |
  | QR | `` `/validar/${U}` `` | `D` |
  | QR em maiúsculas | `` `/validar/${U.toUpperCase()}` `` | `D` |
  | arquivo direto | `/validar/index.html` | `/validar/index.html` |
  | não é uuid | `/validar/abc` | igual |
  | uuid sem hífen | `/validar/0f8fad5bd9cb469fa16570867728950e` | igual |
  | uuid curto | `` `/validar/${U.slice(0, -1)}` `` | igual |
  | uuid com barra final | `` `/validar/${U}/` `` | igual |
  | abaixo do uuid | `` `/validar/${U}/x` `` | igual |
  | prefixo parecido | `/validarx` | igual |
  | prefixo em maiúsculas | `/VALIDAR` | igual |
  | raiz | `/` | igual |
  | home | `/index.html` | igual |
  | release | `` `/releases/abc123/validar/${U}` `` | igual |

  Comentário de topo: a tabela é a única fonte de D11 — a catraca da borda e o teste do plugin leem
  daqui.

- [ ] **Step 2: Escrever os testes que falham**

  Em `scripts/infra/distribuicao.test.mjs`, no `describe('a função do template, em node:vm')`:

  ```js
  it.each(CASOS_DA_VALIDACAO)('apex · $nome', ({ uri, vira }) => {
    const pedido = evento(APEX, uri, { a: { value: '1' } })
    const resposta = executarFuncao(codigo, pedido)
    expect(resposta).toBe(pedido.request)
    expect(resposta.uri).toBe(vira)
    expect(resposta.querystring).toEqual({ a: { value: '1' } })
  })
  ```

  No `describe('catraca: …')`:
  - `it('destino errado da reescrita reprova com o nome do caso')`: trocar no `SITE`
    `request.uri = '/validar/index.html'` por `request.uri = '/index.html'` (a linha do código; o
    caminho também aparece no `Comment` e nos comentários do YAML, então a mutação mira a atribuição);
    `conferirDistribuicao` contém um problema que começa com `reescrita para QR:`.
  - `it('expressão sem âncora final reprova com o caso abaixo do uuid')`: mutar a expressão do template
    tirando o `$` final; contém problema que começa com `reescrita para abaixo do uuid:`.

  Em `CASOS_DO_REDIRECT` (lib), o caso novo `www com /validar/<uuid>` →
  `` location: `https://${APEX}/validar/${UUID_DE_EXEMPLO}` `` (o `www` vem antes da reescrita, D12).

  Em `scripts/infra/cabecalhos.test.mjs`:

  ```js
  it('connect-src abre só a própria origem e a API de certificados (spec §5.2)', () => {
    expect(CABECALHOS['Content-Security-Policy']).toContain(
      "connect-src 'self' https://app.lotusotec.cl;",
    )
  })
  ```

- [ ] **Step 3: Rodar e ver falhar**

  Run: `pnpm exec vitest run scripts/infra/distribuicao.test.mjs scripts/infra/cabecalhos.test.mjs`
  Expected: FAIL nos casos com `vira` = destino, no `www com /validar/<uuid>` não (já passa), nas duas
  mutações e no `connect-src`.

- [ ] **Step 4: Implementar**

  - `conferirDistribuicao`: depois do laço de `HOSTS_INTOCADOS`, um laço sobre `CASOS_DA_VALIDACAO`
    com host `APEX`; problema `` `reescrita para ${caso.nome}: esperado ${caso.vira}, veio ${uri}` ``
    quando o pedido devolvido não é o mesmo objeto ou o `uri` difere.
  - Função do template: o ramo de `www` passa a `if (host === 'www.lotusotec.cl') { …301 inalterado… }`;
    depois dele, `request.uri = '/validar/index.html';` (literal assim, é o que a mutação do Step 2
    procura) quando o caminho é `/validar`, `/validar/` ou casa
    `^\/validar\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$` com flag `i`; devolve
    `request`. Nome lógico e `Name` iguais (D12). `Comment`:
    `www -> apex (301); /validar e /validar/<uuid> -> /validar/index.html.`
  - Comentário acima do recurso (linhas 182-191): acrescentar o segundo papel, a ordem `www` primeiro
    e a referência à `ADR-SITE-007` e à tabela `scripts/infra/lib/validar.mjs`.
  - Comentário de `CustomErrorResponses` (306-309): trocar "nao existe rota de cliente para salvar"
    por: a unica pagina alem da home e servida por reescrita explicita na RedirecionarWww
    (ADR-SITE-007); fallback devolveria 200 a caminho inventado.
  - CSP, nos dois lugares: `connect-src 'self' https://app.lotusotec.cl`.
  - D18: o comentário de `CABECALHOS` passa a dizer que o HSTS fica sem `includeSubDomains` porque
    `mail.lotusotec.cl` falha a verificação TLS; tirar "`app.lotusotec.cl` não responde em 443"
    (a sondagem do packet viu HTTPS respondendo, `K7`).

- [ ] **Step 5: Rodar e ver passar**

  Run: `pnpm exec vitest run scripts/infra`
  Expected: PASS em todos os arquivos (`template.test`, `yaml.test` e `cabecalhos.test` leem o mesmo
  template e continuam verdes; o teste de 10 KB da função continua passando).

- [ ] **Step 6: Commit**

  ```bash
  git add scripts/infra/lib/validar.mjs scripts/infra/lib/distribuicao.mjs scripts/infra/distribuicao.test.mjs infra/lotus-site.yaml scripts/infra/lib/cabecalhos.mjs scripts/infra/cabecalhos.test.mjs
  git commit -m "feat(validacao-certificado): reescrever /validar na borda e abrir connect-src para a API"
  ```

---

### Task 3: Segunda página no build, no dev e no preview

**Files:**
- Create: `scripts/vite/reescrever-validar.mjs`, `scripts/vite/reescrever-validar.test.mjs`
- Modify: `vite.config.ts`
- Create: `validar/index.html`, `src/validar.tsx`, `src/app/ValidarApp.tsx`
- Create: `src/app/validar-head.test.ts`
- Create: `e2e/validar-caminhos.spec.ts`
- Modify: `playwright.config.ts` (projeto `producao` e `testIgnore` do `chromium`)
- Modify: `e2e/seo.spec.ts:12-13` (comentário do dev server)

**Interfaces:**
- Consumes: `CASOS_DA_VALIDACAO`, `DESTINO_DA_VALIDACAO`, `UUID_DE_EXEMPLO` (Task 2).
- Produces:
  - `reescreverCaminho(url: string): string` — recebe `req.url` (caminho + query) e devolve o mesmo
    texto, ou `DESTINO_DA_VALIDACAO` seguido da query original;
  - `reescreverValidar()` — plugin com `configureServer` e `configurePreviewServer`, cada um
    registrando direto (sem devolver função) um middleware que aplica `reescreverCaminho` a `req.url`
    e chama `next()`;
  - `ValidarApp()` em `src/app/ValidarApp.tsx`, que a Task 5 e a Task 9 completam.

- [ ] **Step 1: Testes do plugin**

  `scripts/vite/reescrever-validar.test.mjs`:

  ```js
  it.each(CASOS_DA_VALIDACAO)('$nome', ({ uri, vira }) => {
    expect(reescreverCaminho(uri)).toBe(vira)
  })
  it('preserva a query', () => {
    expect(reescreverCaminho(`/validar/${UUID_DE_EXEMPLO}?utm=qr`)).toBe(
      '/validar/index.html?utm=qr',
    )
  })
  it('registra o middleware no dev e no preview', () => {
    for (const gancho of ['configureServer', 'configurePreviewServer']) {
      const usados = []
      reescreverValidar()[gancho]({ middlewares: { use: (fn) => usados.push(fn) } })
      const req = { url: '/validar' }
      const next = vi.fn()
      usados[0](req, {}, next)
      expect(req.url).toBe(DESTINO_DA_VALIDACAO)
      expect(next).toHaveBeenCalledOnce()
    }
  })
  ```

- [ ] **Step 2: Catraca do `<head>`**

  `src/app/validar-head.test.ts`, no molde de `head.test.ts`, importando `../../validar/index.html?raw`
  e `../../index.html?raw`:
  - `documentElement.lang` = `site.locale` (P1);
  - `title` = `Validar certificado | LOTUS OTEC`;
  - um `meta[name="robots"]` com `content="noindex"` (D9);
  - nenhum `link[rel="canonical"]`, `meta[property^="og:"]`, `meta[name^="twitter:"]` nem
    `script[type="application/ld+json"]`;
  - todo `<script>` tem `src` (CSP `script-src 'self'`), e o único é `type="module"` com
    `src="/src/validar.tsx"`;
  - o conjunto de `href` de `link[rel~="icon"], link[rel="apple-touch-icon"]` é igual ao de
    `index.html`.

- [ ] **Step 3: Rodar e ver falhar**

  Run: `pnpm exec vitest run scripts/vite/reescrever-validar.test.mjs src/app/validar-head.test.ts`
  Expected: FAIL — módulo e arquivo inexistentes.

- [ ] **Step 4: Implementar**

  - `scripts/vite/reescrever-validar.mjs`: mesma forma de `preload-critical.mjs` (handler exportado à
    parte, plugin sem anotação do tipo `Plugin`). A expressão do uuid é a mesma da função do template.
  - `vite.config.ts`: `appType: 'mpa'` (dev e preview passam a responder 404 a caminho inexistente,
    como a borda — D11); `build.rolldownOptions.input` com
    `main: fileURLToPath(new URL('./index.html', import.meta.url))` e
    `validar: fileURLToPath(new URL('./validar/index.html', import.meta.url))`; `reescreverValidar()`
    na lista de plugins. Comentário curto citando D11 e a `ADR-SITE-007`.
  - `validar/index.html`: `<!doctype html>`, `lang="es-CL"`, charset, viewport, o `title`, o `robots`,
    os quatro links/meta de ícone copiados de `index.html`, `<div id="root"></div>` e o script do
    módulo. Nada mais no `<head>`.
  - `src/validar.tsx`: o mesmo de `src/main.tsx`, renderizando `<ValidarApp />`.
  - `src/app/ValidarApp.tsx`: `<Header />`, `<main className="pt-header-offset desktop:pt-header-desktop">`
    com um `<h1>` provisório `VALIDAR CERTIFICADO`, e `<Footer />`. A Task 9 troca o conteúdo do
    `<main>`.
  - `e2e/seo.spec.ts`: o comentário "O dev server devolve index.html (200) para qualquer path
    desconhecido" passa a dizer que, com `appType: 'mpa'`, o dev responde 404 como a borda.

- [ ] **Step 5: Rodar e ver passar**

  Run: `pnpm exec vitest run scripts/vite src/app && pnpm build && grep -c 'noindex' dist/validar/index.html && ! grep -q 'noindex' dist/index.html && echo home-indexavel`
  Expected: PASS; `1`; `home-indexavel`.

- [ ] **Step 6: A4 no preview**

  `e2e/validar-caminhos.spec.ts` (só no projeto `producao`; acrescentar a `testMatch` dele e ao
  `testIgnore` do `chromium`):

  ```ts
  const UUID = '0f8fad5b-d9cb-469f-a165-70867728950e'
  for (const caminho of ['/validar', '/validar/', `/validar/${UUID}`]) {
    test(`${caminho} serve a página de validação`, async ({ request }) => {
      const r = await request.get(caminho)
      expect(r.status()).toBe(200)
      expect(await r.text()).toContain('<title>Validar certificado | LOTUS OTEC</title>')
    })
  }
  for (const caminho of ['/validar/abc', `/validar/${UUID}/x`, '/VALIDAR', '/inventado']) {
    test(`${caminho} responde 404`, async ({ request }) => {
      expect((await request.get(caminho)).status()).toBe(404)
    })
  }
  test('/ continua servindo a home', async ({ request }) => {
    expect(await (await request.get('/')).text()).toContain('<title>LOTUS | OTEC</title>')
  })
  ```

  Run: `pnpm exec playwright test --project producao e2e/validar-caminhos.spec.ts`
  Expected: PASS. Se o preview redirecionar `/validar` para `/validar/` antes do middleware, o
  middleware não está registrado direto no `configurePreviewServer` — corrigir ali.

- [ ] **Step 7: Nada da home quebrou com `appType: 'mpa'`**

  Run: `pnpm e2e`
  Expected: PASS em todos os projetos.

- [ ] **Step 8: Commit**

  ```bash
  git add scripts/vite/reescrever-validar.mjs scripts/vite/reescrever-validar.test.mjs vite.config.ts validar/index.html src/validar.tsx src/app/ValidarApp.tsx src/app/validar-head.test.ts e2e/validar-caminhos.spec.ts e2e/seo.spec.ts playwright.config.ts
  git commit -m "feat(validacao-certificado): servir validar/index.html no build, no dev e no preview"
  ```

---

### Task 4: Deploy e rollback com dois `index.html`

**Files:**
- Create: `scripts/infra/lib/publicacao.mjs`, `scripts/infra/publicacao.test.mjs`
- Modify: `.github/workflows/ci.yml:262-282` e `:315-352` (syncs, invalidação, comentários "três")
- Modify: `docs/adr/ADR-SITE-004.md:154-166` (rollback) e `:197-199` (texto da invalidação)
- Modify: `e2e/smoke/5-assets.spec.ts:5,11-13` (`FIXOS` e comentário)

**Interfaces:**
- Produces (`scripts/infra/lib/publicacao.mjs`):
  - `export const ARQUIVOS_DE_NOME_FIXO = ['index.html', 'validar/index.html', 'robots.txt', 'sitemap.xml']`
  - `conferirPublicacao(texto: string, esperado: { imutaveis: number, semCache: number, invalidacoes: number }): string[]`
    — lê o texto cru (YAML ou Markdown), junta continuações `\` de linha, e confere:
    - todo `aws s3 sync` com `immutable` tem `--exclude "<f>"` para cada arquivo;
    - todo `aws s3 sync` com `no-cache` tem `--exclude "*"` e `--include "<f>"` para cada arquivo;
    - todo `create-invalidation` tem em `--paths` exatamente `/<f>` de cada arquivo;
    - as três contagens batem; `sync` sem `immutable` nem `no-cache` (a limpeza) não conta.

    Problemas no formato `sync immutable sem --exclude "validar/index.html"`,
    `sync no-cache sem --include "validar/index.html"`,
    `invalidação: esperado /index.html /validar/index.html /robots.txt /sitemap.xml, veio <lista>`,
    `contagem de sync immutable: esperado 2, veio 1`.

- [ ] **Step 1: Testes que falham**

  ```js
  const CI = readFileSync('.github/workflows/ci.yml', 'utf8')
  const ADR = 'docs/adr/ADR-SITE-004.md'
  it('o deploy do ci.yml trata os quatro arquivos como de nome fixo', () => {
    expect(conferirPublicacao(CI, { imutaveis: 2, semCache: 2, invalidacoes: 1 })).toEqual([])
  })
  it.skipIf(!existsSync(ADR))('o rollback da ADR-SITE-004 faz o mesmo', () => {
    expect(conferirPublicacao(readFileSync(ADR, 'utf8'), { imutaveis: 1, semCache: 1, invalidacoes: 1 })).toEqual([])
  })
  it('sync immutable sem validar/index.html reprova com o arquivo', () => {
    const sem = CI.replace(' --exclude "validar/index.html"', '')
    expect(conferirPublicacao(sem, { imutaveis: 2, semCache: 2, invalidacoes: 1 })).toContain(
      'sync immutable sem --exclude "validar/index.html"',
    )
  })
  it('invalidação sem /validar/index.html reprova', () => {
    const sem = CI.replace(' /validar/index.html', '')
    expect(conferirPublicacao(sem, { imutaveis: 2, semCache: 2, invalidacoes: 1 }).some((p) => p.startsWith('invalidação:'))).toBe(true)
  })
  it('padrão de nome solto não passa por arquivo de nome fixo', () => {
    const solto = CI.replaceAll('--exclude "index.html"', '--exclude "*.html"')
    expect(conferirPublicacao(solto, { imutaveis: 2, semCache: 2, invalidacoes: 1 })).toContain(
      'sync immutable sem --exclude "index.html"',
    )
  })
  ```

- [ ] **Step 2: Rodar e ver falhar**

  Run: `pnpm exec vitest run scripts/infra/publicacao.test.mjs`
  Expected: FAIL — o `ci.yml` real não tem `validar/index.html`.

- [ ] **Step 3: Implementar `conferirPublicacao` e corrigir o `ci.yml`**

  No `ci.yml`, nos dois pares de `sync` (release e raiz), acrescentar `--exclude "validar/index.html"`
  depois de `--exclude "index.html"` e `--include "validar/index.html"` depois de
  `--include "index.html"`; a invalidação vira `--paths /index.html /validar/index.html /robots.txt /sitemap.xml`.
  Os comentários "Estes três têm nome fixo", "os três de nome fixo" e "Três caminhos e não `/*`" passam
  a "quatro", e o comentário do primeiro `sync` ganha uma linha: os padrões do `aws s3 sync` casam com
  o caminho relativo inteiro, por isso `validar/index.html` é nomeado (spec §5.6).

- [ ] **Step 4: Corrigir o rollback da `ADR-SITE-004`**

  As mesmas três mudanças nas linhas 156, 161 e 165; "A invalidação lista três caminhos" vira
  "quatro"; nota datada logo abaixo do título `## Rollback`:
  `> **Atualização de 2026-11-24 (validacao-certificado).** validar/index.html entrou como quarto
  arquivo de nome fixo (ADR-SITE-007).`

  `docs/infra/runbook-aws.md` não cita `index.html` por nome (medido em 2026-11-24), então não muda
  (spec §10). Conferir com `grep -n 'index.html' docs/infra/runbook-aws.md` antes do commit: saída
  vazia.

- [ ] **Step 5: Smoke de produção**

  `e2e/smoke/5-assets.spec.ts`: `FIXOS` ganha `'/validar/index.html'`; comentário "nos três de nome
  fixo" vira "quatro". O smoke só roda depois do deploy (A8); aqui basta `pnpm typecheck`.

- [ ] **Step 6: Rodar e ver passar**

  Run: `pnpm exec vitest run scripts/infra && pnpm typecheck`
  Expected: PASS; o `ci-alerta.test` e o `yaml.test`, que leem o mesmo `ci.yml`, continuam verdes.

- [ ] **Step 7: Commit**

  ```bash
  git add scripts/infra/lib/publicacao.mjs scripts/infra/publicacao.test.mjs .github/workflows/ci.yml docs/adr/ADR-SITE-004.md e2e/smoke/5-assets.spec.ts
  git commit -m "ci(validacao-certificado): publicar validar/index.html como arquivo de nome fixo"
  ```

---

### Task 5: "Validar Certificado" no menu e âncoras para a home

**Files:**
- Modify: `src/content/site.ts:15-20`, `src/content/site.test.ts:5-12`
- Modify: `src/components/layout/Header.tsx`, `Header.test.tsx`
- Modify: `src/components/layout/MobileMenu.tsx`, `MobileMenu.test.tsx`
- Modify: `src/app/links.test.tsx:47-57`, `src/app/ValidarApp.tsx`
- Modify: `e2e/menu.spec.ts:21`, `e2e/teclado.spec.ts:42-50`
- Create: `e2e/navegacao.spec.ts`; Modify: `playwright.config.ts` (`FLUXO_PRINCIPAL`)
- Modify: `e2e/regressao-visual.spec.ts-snapshots/home-1440-producao-linux.png` (regravado)
- Modify, só se o Step 7 ficar vermelho: `src/app/App.tsx`

**Interfaces:**
- Produces: `Header({ atual }: { atual?: string })` e `MobileMenu({ atual }: { atual?: string })`;
  `atual` é o `href` da página corrente. `ValidarApp` passa `atual="/validar"`; a home não passa nada.

- [ ] **Step 1: Testes que falham**

  - `site.test.ts`: o teste do menu passa a "os cinco itens", esperando
    `[['Inicio','/'],['Quienes Somos','/#Somos'],['Cursos','/#Cursos'],['Contacto','/#Contacto'],['Validar Certificado','/validar']]`.
  - `Header.test.tsx`: cinco links; `Quienes Somos` com `href` `/#Somos`; sem `atual`, nenhum
    `[aria-current]`; com `atual="/validar"`, só `Validar Certificado` tem `aria-current="page"` e
    classe `text-white` e `decoration-brand`.
  - `MobileMenu.test.tsx`: cinco links; com `atual="/validar"`, o item tem `aria-current="page"`,
    mantém `text-neutral-ink` e ganha `decoration-brand` (D2).
  - `links.test.tsx`: "toda âncora `#id` ou `/#id` resolve para um elemento renderizado na home" —
    o filtro passa a aceitar `href` que começa com `/#`, cortando o prefixo antes do `getElementById`.

  Run: `pnpm exec vitest run src/content src/components/layout src/app/links.test.tsx`
  Expected: FAIL nos itens acima.

- [ ] **Step 2: Implementar**

  - `site.nav`: âncoras com `/#` (D7) e o quinto item `{ label: 'Validar Certificado', href: '/validar' }`.
  - `Header`: item atual com `aria-current="page"`, `text-white` (já existe na paleta padrão do
    Tailwind) e sublinhado `underline decoration-brand decoration-2`, deslocamento escolhido pelo
    executor para bater com o mockup A; os demais como hoje (`text-brand`). Passa `atual` ao
    `MobileMenu`.
  - `MobileMenu`: o item atual mantém `text-neutral-ink` e ganha o mesmo sublinhado.
  - `ValidarApp`: `<Header atual="/validar" />`.

- [ ] **Step 3: Ajustar os E2E que contam o menu**

  `e2e/menu.spec.ts`: `toHaveCount(5)`. `e2e/teclado.spec.ts`: `'a:Validar Certificado'` depois de
  `'a:Contacto'` em `EXPECTED_ORDER`, e o comentário "logo, menu, …" continua certo.

- [ ] **Step 4: A5 em `e2e/navegacao.spec.ts`** (acrescentar `'**/navegacao.spec.ts'` a
  `FLUXO_PRINCIPAL`)

  `test.describe('desktop')` com `test.use({ viewport: { width: 1440, height: 900 } })` e
  `test.describe('mobile')` com `375×812`; `fingirTurnstile` no `beforeEach` (a home carrega o
  widget perto de `#Contacto`).
  - desktop, `do /validar, cada âncora leva à seção certa da home`: para
    `[['Quienes Somos','Somos'],['Cursos','Cursos'],['Contacto','Contacto']]`, `goto('/validar')`,
    clicar no link da navegação `Principal`, `toHaveURL(new RegExp(`/#${id}$`))` e
    `expect(page.locator(`#${id}`)).toBeInViewport()`.
  - desktop, `na home a âncora rola sem recarregar`: `goto('/')`, marcar
    `window.semRecarga = true`, clicar `Cursos`, `#Cursos` no viewport e a marca ainda `true`.
  - desktop, `aria-current só em /validar`: em `/validar` o link `Validar Certificado` tem
    `aria-current="page"`; em `/`, `locator('[aria-current]')` tem `toHaveCount(0)`.
  - desktop, `o menu cabe numa linha em 1000 px`: viewport `1000×800`, `goto('/')`; os cinco links
    têm o mesmo `boundingBox().y` (±1 px) e a borda direita do logo fica à esquerda do primeiro
    link. Registrar a folga medida no corpo do commit.
  - mobile, `do /validar o menu leva a Contacto na home`: abrir o menu, clicar `Contacto`,
    `#Contacto` no viewport.

- [ ] **Step 5: Rodar**

  Run: `pnpm exec playwright test e2e/navegacao.spec.ts e2e/menu.spec.ts e2e/teclado.spec.ts`
  Expected: PASS, nos quatro motores para `navegacao` e `menu`.
  - Se o teste de 1000 px falhar: **parar** (§5.7). Não reduzir fonte nem gap; levar a medida a João
    e mover o estado para `blocked`.
  - Se `cada âncora leva à seção certa` falhar porque a home fica no topo (D7): Step 6. Senão, pular
    o Step 6.

- [ ] **Step 6 (condicional): rolar até o fragmento depois da montagem**

  Em `src/app/App.tsx`, um `useEffect(() => { … }, [])` que lê `location.hash`, busca o elemento
  pelo id decodificado e chama `scrollIntoView()`. Rodar o Step 5 de novo; o corpo do commit diz em
  quais motores o teste falhou antes.

- [ ] **Step 7: Regressão visual**

  Run: `pnpm exec playwright test --project producao e2e/regressao-visual.spec.ts`
  Expected: `375` PASS sem regravar (P12); `1440` FAIL. Abrir o `*-diff.png` de `test-results/` e
  confirmar que a diferença está só na faixa do menu. Diferença fora do menu é regressão: parar.
  Depois:

  Run: `pnpm exec playwright test --project producao e2e/regressao-visual.spec.ts -g 1440 --update-snapshots && pnpm exec playwright test --project producao e2e/regressao-visual.spec.ts`
  Expected: PASS nos dois.

- [ ] **Step 8: Commit**

  ```bash
  git add src/content/site.ts src/content/site.test.ts src/components/layout/ src/app/links.test.tsx src/app/ValidarApp.tsx e2e/menu.spec.ts e2e/teclado.spec.ts e2e/navegacao.spec.ts playwright.config.ts e2e/regressao-visual.spec.ts-snapshots/home-1440-producao-linux.png
  # + src/app/App.tsx se o Step 6 entrou
  git commit -m "feat(validacao-certificado): pôr Validar Certificado no menu e levar as âncoras à home"
  ```

---

### Task 6: Funções puras — RUT, código, datas e modo da página

**Files:**
- Create: `src/lib/rut.ts`, `src/lib/rut.test.ts`
- Create: `src/lib/codigo-de-registro.ts`, `src/lib/codigo-de-registro.test.ts`
- Create: `src/lib/datas.ts`, `src/lib/datas.test.ts`
- Create: `src/lib/modo-da-validacao.ts`, `src/lib/modo-da-validacao.test.ts`

**Interfaces:**
- Produces:
  - `rutValido(entrada: string): boolean`
  - `normalizarCodigo(entrada: string): string` e `codigoValido(entrada: string): boolean`
  - `formatarDataCivil(data: string): string` (`AAAA-MM-DD`) e `formatarInstante(instante: string): string` (ISO)
  - `type ModoDaValidacao = { tipo: 'formulario' } | { tipo: 'qr'; uuid: string }` e
    `lerModo(pathname: string): ModoDaValidacao`

- [ ] **Step 1: Testes**

  `rut.test.ts` — a regra espelha `Rut::parse` + `isValid` do Lotus
  (`backend/app/Shared/Support/Rut.php`), mais o `max:20` da entrada aparada:

  ```ts
  it.each(['12.345.678-5', '12345678-5', '123456785', ' 12.345.678-5 ', '6-k', '6-K'])('aceita %j', (r) => expect(rutValido(r)).toBe(true))
  it.each(['12.345.678-4', '', '-', 'K', '12.3K5.678-5', '.'.repeat(9) + '12.345.678-5'])('recusa %j', (r) => expect(rutValido(r)).toBe(false))
  ```

  `codigo-de-registro.test.ts`:

  ```ts
  expect(normalizarCodigo(' lot-2026-123 ')).toBe('LOT-2026-123')
  it.each(['LOT-2026-123', 'lot-2026-123', ' LOT-2026-9001 ', 'LOT-2026-123456789'])('aceita %j', …true)
  it.each(['LOT-26-1', 'LOT-2026-', 'LOT-2026-1234567890', 'LOTE-2026-1', 'LOT-2026-12a', ''])('recusa %j', …false)
  ```

  `datas.test.ts` (D17, P10):

  ```ts
  expect(formatarDataCivil('2026-08-12')).toBe('12 de agosto de 2026')
  expect(formatarDataCivil('2026-01-01')).toBe('1 de enero de 2026')
  expect(formatarInstante('2026-08-05T14:30:00.000000Z')).toBe('5 de agosto de 2026')
  expect(formatarInstante('2026-10-05T02:30:00.000000Z')).toBe('4 de octubre de 2026') // Santiago, UTC-3
  expect(formatarInstante('2026-10-05T02:30:00Z')).toBe('4 de octubre de 2026')
  ```

  `modo-da-validacao.test.ts`: `/validar`, `/validar/` e `/validar/index.html` → `{ tipo: 'formulario' }`;
  `/validar/0f8fad5b-d9cb-469f-a165-70867728950e` → `{ tipo: 'qr', uuid: <o mesmo> }`; o uuid em
  maiúsculas → `qr` com o uuid como veio; `/validar/abc` → `formulario`.

- [ ] **Step 2: Rodar e ver falhar**

  Run: `pnpm exec vitest run src/lib`
  Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Implementar**

  - `rutValido`: aparar; recusar acima de 20 caracteres; limpar tudo que não é `[0-9kK]`, maiúsculas;
    corpo = tudo menos o último caractere, só dígitos e não vazio; dígito verificador por módulo 11 com
    fatores 2..7 da direita para a esquerda, `11 → '0'`, `10 → 'K'`.
  - `codigoValido`: `normalizarCodigo` (aparar, maiúsculas), até 20 caracteres e
    `^LOT-\d{4}-\d{1,9}$` (`K1`).
  - `formatarDataCivil`: separar ano, mês e dia do texto e formatar `Date.UTC(...)` com
    `Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })`;
    nunca `new Date('AAAA-MM-DD')`.
  - `formatarInstante`: cortar a fração para três dígitos (`/\.(\d{3})\d+/` → `.$1`) antes de
    `new Date`, e formatar com o mesmo `Intl` em `timeZone: 'America/Santiago'`.
  - `lerModo`: mesma expressão de uuid da borda, ancorada em `^/validar/…$`.

- [ ] **Step 4: Rodar e ver passar**

  Run: `pnpm exec vitest run src/lib && pnpm lint`
  Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/rut.ts src/lib/rut.test.ts src/lib/codigo-de-registro.ts src/lib/codigo-de-registro.test.ts src/lib/datas.ts src/lib/datas.test.ts src/lib/modo-da-validacao.ts src/lib/modo-da-validacao.test.ts
  git commit -m "feat(validacao-certificado): conferir RUT e código e formatar as datas do certificado"
  ```

---

### Task 7: Integração com a API pública de certificados

**Files:**
- Create: `src/lib/certificado.ts`, `src/lib/certificado.fixture.ts`
- Create: `src/integrations/certificados/api-certificados.ts`, `api-certificados.test.ts`
- Modify: `.env.example`, `src/vite-env.d.ts`
- Modify: `CONTEXT.md` (verbete Adapter; termos Consulta e Validação pelo QR)
- Modify: `src/integrations/contact/api-contacto.ts:26-29` (deixa de ser "o único adapter e o único
  `fetch` de `src/`")

**Interfaces:**
- Consumes: `normalizarCodigo` (Task 6).
- Produces (`src/lib/certificado.ts`):

  ```ts
  export const certificadoSchema = z.object({
    codigo: z.string().min(1),
    status: z.enum(['emitido', 'revocado']),
    valido_ate: z.iso.date().nullable(),
    revoked_at: z.iso.datetime({ offset: true }).nullable(),
    aluno: z.object({ name: z.string().min(1) }),
    curso: z.object({ name: z.string().min(1), workload_hours: z.number().int().nonnegative() }),
    turma: z.object({ end_date: z.iso.date().nullable() }),
    display_status: z.enum(['vigente', 'por_vencer', 'vencido', 'revocado']),
  })
  export type Certificado = z.infer<typeof certificadoSchema>
  export type CampoDaConsulta = 'codigo' | 'rut'
  export type ResultadoDaConsulta =
    | { tipo: 'certificado'; certificado: Certificado; uuid: string }
    | { tipo: 'nao-encontrado' }
    | { tipo: 'formato-invalido'; campos: CampoDaConsulta[] }
    | { tipo: 'espera'; segundos: number | null }
    | { tipo: 'bloqueio'; segundos: number }
    | { tipo: 'falha' }
  export type ResultadoDoPdf =
    | { tipo: 'pdf'; arquivo: Blob; nome: string }
    | { tipo: 'revogado' }
    | { tipo: 'espera'; segundos: number | null }
    | { tipo: 'falha' }
  export type ConsultaPorUuid = (uuid: string) => Promise<ResultadoDaConsulta>
  export type ConsultaPorCodigo = (codigo: string, rut: string) => Promise<ResultadoDaConsulta>
  export type BaixarPdf = (uuid: string, codigo: string) => Promise<ResultadoDoPdf>
  ```

- Produces (`src/lib/certificado.fixture.ts`, só para testes): `VIGENTE: Certificado` com
  `codigo 'LOT-2026-144'`, aluno `María Fernanda Rojas`, curso
  `Especialistas Líneas Vivas en Media Tensión` / `40`, `end_date '2026-08-12'`,
  `valido_ate '2028-08-12'`, `status 'emitido'`, `revoked_at null`, `display_status 'vigente'`; e
  `POR_VENCER`, `VENCIDO` (`valido_ate '2026-03-03'`), `REVOGADO`
  (`status 'revocado'`, `revoked_at '2026-10-05T14:30:00.000000Z'`) derivados dele. `UUID` =
  `'0f8fad5b-d9cb-469f-a165-70867728950e'`.
- Produces (`src/integrations/certificados/api-certificados.ts`):
  - `URL_PADRAO_DA_API = 'https://app.lotusotec.cl'`, `TEMPO_LIMITE_MS = 15_000`,
    `TEMPO_LIMITE_DO_PDF_MS = 30_000` (P3), `LIMITE_DA_ESPERA_S = 60`;
  - `lerRetryAfter(valor: string | null): number | null` — inteiro positivo em dígitos, senão `null`
    (D16);
  - `nomeDoArquivo(contentDisposition: string | null, codigo: string): string` — `filename="…"` ou
    `filename=…`, sem diretório; senão `certificado-<codigo>.pdf`;
  - `createCertificadosApi(base: string): { porUuid: ConsultaPorUuid; porCodigo: ConsultaPorCodigo; pdf: BaixarPdf }`.

  Comportamento (P14):

  | Chamada | Pedido | 200 | 404 | 410 | 422 | 429 | outro, rede, teto |
  |---|---|---|---|---|---|---|---|
  | `porUuid(uuid)` | `GET {base}/api/publico/certificados/{uuid}`, `Accept: application/json` | schema → `certificado` com o `uuid` do argumento; senão `falha` | `nao-encontrado` | `falha` | `falha` | `espera(lerRetryAfter)` sempre | `falha` |
  | `porCodigo(codigo, rut)` | `POST {base}/api/publico/certificados/consulta`, `Accept` + `Content-Type: application/json`, corpo `{"codigo": normalizarCodigo(codigo), "rut": rut.trim()}` | schema + `uuid` (`z.guid()`) → `certificado`; senão `falha` | `nao-encontrado` | `falha` | `formato-invalido` com as chaves de `errors` ∩ {`codigo`, `rut`}; sem nenhuma, as duas | `null` → `espera(null)`; ≤ 60 → `espera(s)`; > 60 → `bloqueio(s)` | `falha` |
  | `pdf(uuid, codigo)` | `GET {base}/api/publico/certificados/{uuid}/pdf`, `Accept: application/pdf`, teto de 30 s | `pdf` com `blob()` e `nomeDoArquivo` | `falha` | `revogado` | `falha` | `espera(lerRetryAfter)` | `falha` |

  Todo `fetch` com `credentials: 'omit'`, `signal` do `AbortController` do teto e nenhum outro header.
  A barra final de `base` é removida. Nada vai ao console nem ao armazenamento do navegador.

- [ ] **Step 1: Testes que falham**

  `api-certificados.test.ts`, com o `stubFetch` de `api-contacto.test.ts` (o stub rejeita quando o
  `signal` aborta):
  - `porUuid pede o uuid só com Accept json e sem credenciais`: URL
    `https://app.lotusotec.cl/api/publico/certificados/${UUID}`; `init.credentials` `'omit'`;
    `init.headers` igual a `{ Accept: 'application/json' }`; sem `body`.
  - `porCodigo manda só codigo e rut no corpo, normalizados`: entrada `(' lot-2026-123 ', ' 12.345.678-5 ')`;
    `init.method` `'POST'`; `init.body` igual a `'{"codigo":"LOT-2026-123","rut":"12.345.678-5"}'`;
    headers iguais a `{ Accept: 'application/json', 'Content-Type': 'application/json' }`; a URL
    termina em `/consulta` e não contém `12.345.678`, `12345678` nem `123456785`.
  - `200 válido vira certificado sem cliente nem redator`: resposta da API com `cliente` e `redator`;
    o resultado é `{ tipo: 'certificado', uuid, certificado }` e `certificado` não tem essas chaves
    (P16).
  - `200 da consulta sem uuid é falha`; `200 com display_status desconhecido é falha`;
    `200 com corpo que não é JSON é falha`.
  - `404 com corpo HTML é nao-encontrado`.
  - `422 com errors.rut marca só o RUT`; `422 sem corpo JSON marca os dois`.
  - `429 da consulta`: `it.each([['45', espera 45], ['60', espera 60], ['61', bloqueio 61], ['3600', bloqueio 3600], [null, espera null]])`.
  - `lerRetryAfter`: `'45' → 45`, `'0' → null`, `'-5' → null`, `'1.5' → null`,
    `'Wed, 21 Oct 2015 07:28:00 GMT' → null`, `'' → null`, `null → null`.
  - `429 do QR é sempre espera`: `porUuid` com `Retry-After: 3000` → `{ tipo: 'espera', segundos: 3000 }`.
  - `500, rede e teto viram falha`: o teto com `vi.useFakeTimers()` e
    `vi.advanceTimersByTime(TEMPO_LIMITE_MS)`.
  - `pdf`: 200 com `Content-Disposition: attachment; filename="certificado-LOT-2026-144.pdf"` → nome
    igual e `arquivo` do tipo `Blob`; sem o header → `certificado-LOT-2026-144.pdf`;
    `filename="../x.pdf"` → `x.pdf`; 410 → `revogado`; 404 → `falha`; 429 `'7'` → `espera 7`;
    headers iguais a `{ Accept: 'application/pdf' }`.
  - `base com barra final não duplica a barra`: `createCertificadosApi('http://localhost:8080/')` pede
    `http://localhost:8080/api/publico/certificados/${UUID}`.

- [ ] **Step 2: Rodar e ver falhar**

  Run: `pnpm exec vitest run src/integrations/certificados`
  Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar `src/lib/certificado.ts`, a fixture e o adapter**

- [ ] **Step 4: Variável, tipos e vocabulário**

  - `.env.example`: seção `--- Validação de certificado (validacao-certificado, ADR-SITE-007) ---`
    com `VITE_CERTIFICADOS_API_URL=`, explicando o padrão `https://app.lotusotec.cl`, que produção
    não define a variável, que uma origem diferente é bloqueada pela CSP, e o uso local
    (`http://localhost:8080`, site na porta 5190, `CORS_PUBLIC_ORIGINS` no Lotus — `K6`).
  - `src/vite-env.d.ts`: `readonly VITE_CERTIFICADOS_API_URL?: string` com JSDoc de uma linha (D10).
  - `CONTEXT.md`: o verbete **Adapter** passa a citar os dois adapters de `src/`
    (`createApiContactoSender` e `createCertificadosApi`) e deixa de dizer "único"; termos novos
    **Consulta** (código + RUT → `POST /consulta`, o único pedido que leva o RUT) e **Validação pelo
    QR** (`/validar/<uuid>` → `GET` por uuid, fora do limite de falhas).
  - `api-contacto.ts`: o JSDoc diz "adapter de `/api/contacto`", sem "o único".

- [ ] **Step 5: Rodar e ver passar**

  Run: `pnpm exec vitest run src/integrations src/lib && pnpm lint && pnpm typecheck`
  Expected: PASS.

- [ ] **Step 6: Commit**

  ```bash
  git add src/lib/certificado.ts src/lib/certificado.fixture.ts src/integrations/certificados/ .env.example src/vite-env.d.ts CONTEXT.md src/integrations/contact/api-contacto.ts
  git commit -m "feat(validacao-certificado): integrar a API pública de certificados"
  ```

---

### Task 8: Texto, tokens e cartões do resultado

**Files:**
- Modify: `src/index.css` (`@theme`)
- Create: `src/content/validacao.ts`, `src/content/validacao.test.ts`
- Create: `src/components/validacao/Selo.tsx`
- Create: `src/components/validacao/CartaoDoCertificado.tsx` + `.test.tsx`
- Create: `src/components/validacao/CartaoDeAviso.tsx` + `.test.tsx`

**Interfaces:**
- Consumes: `Certificado` (Task 7), `formatarDataCivil`, `formatarInstante` (Task 6).
- Produces:
  - `validacao` (objeto `as const`), `emSegundos(n: number): string`, `emMinutos(n: number): string`;
  - `Selo({ tom, children }: { tom: 'ok' | 'aviso' | 'perigo' | 'neutro'; children: ReactNode })`;
  - `CartaoDoCertificado({ certificado, pdf, tituloRef }: { certificado: Certificado; pdf?: ReactNode; tituloRef?: Ref<HTMLHeadingElement> })`;
  - `CartaoDeAviso({ selo, titulo, children, tituloRef }: { selo?: string; titulo: string; children: ReactNode; tituloRef?: Ref<HTMLHeadingElement> })`.

- [ ] **Step 1: Tokens**

  No `@theme`, depois de `--color-danger`: `--color-status-ok: #1e7a3c;` e
  `--color-status-warn: #8a5a00;`, cada um com o comentário do contraste medido com branco
  (5,38:1 e 5,93:1, P13) e a origem (mockup aprovado de D4).

- [ ] **Step 2: Texto em `src/content/validacao.ts`** (spec §5.4, verbatim)

  ```ts
  export const validacao = {
    kicker: 'CERTIFICADOS LOTUS OTEC',
    titulo: 'VALIDAR CERTIFICADO',
    abertura: 'Ingrese el N° de registro y el RUT del alumno, tal como aparecen en el certificado.',
    campos: {
      codigo: { rotulo: 'N° de registro', exemplo: 'Ej.: LOT-2026-123', erro: 'Formato: LOT-2026-123' },
      rut: { rotulo: 'RUT del alumno', exemplo: 'Ej.: 12.345.678-5', erro: 'RUT inválido' },
    },
    botao: 'VALIDAR',
    validando: 'Validando…',
    linhaDoQr: '¿Tiene el certificado a mano? Escanee el código QR: abre la validación directamente.',
    outroCertificado: 'Validar otro certificado',
    linhas: { codigo: 'N° de registro', aluno: 'Alumno', curso: 'Curso', termino: 'Término', validoAte: 'Válido hasta', vencidoEm: 'Venció el', revogadoEm: 'Revocado el' },
    vigente: { selo: 'VIGENTE', titulo: 'Certificado válido', porVencer: 'Próximo a vencer' },
    vencido: { selo: 'VENCIDO', titulo: 'Certificado vencido', nota: 'El certificado fue emitido por Lotus OTEC, pero ya no está vigente.' },
    revogado: { selo: 'REVOCADO', titulo: 'Certificado revocado', nota: 'Este certificado fue revocado por Lotus OTEC y no tiene validez. Su PDF no está disponible.' },
    naoEncontrado: {
      selo: 'SIN RESULTADO',
      formulario: { titulo: 'No encontramos un certificado con esos datos', notas: ['Revise el N° de registro y el RUT del alumno tal como aparecen en el certificado.', 'También puede escanear el código QR del certificado.'] },
      qr: { titulo: 'No encontramos este certificado', notas: ['Revise que el código QR escaneado sea el del certificado.'] },
    },
    espera: { selo: 'ESPERE', titulo: 'Demasiadas consultas seguidas', semNumero: 'Intente de nuevo en unos momentos.' },
    bloqueio: { selo: 'BLOQUEADO', titulo: 'La consulta por N° de registro y RUT está bloqueada', motivo: 'Hubo demasiados intentos sin resultado.', qrDestaque: 'Mientras tanto, escanee el código QR del certificado:', qrResto: 'esa validación no tiene este bloqueo.' },
    falha: 'No pudimos validar el certificado ahora. Intente más tarde.',
    pdf: { botao: 'DESCARGAR PDF', falha: 'No pudimos descargar el PDF ahora. Intente más tarde.' },
  } as const
  ```

  `emSegundos(1)` → `'Intente de nuevo en 1 segundo.'`, `emSegundos(45)` →
  `'Intente de nuevo en 45 segundos.'`; `emMinutos(1)` → `'Podrá intentar de nuevo en 1 minuto.'`,
  `emMinutos(52)` → `'Podrá intentar de nuevo en 52 minutos.'` (P7). Esses quatro valores são o
  `validacao.test.ts`.

- [ ] **Step 3: Testes dos cartões**

  `CartaoDoCertificado.test.tsx` (fixtures da Task 7; um helper lê os pares `dt`/`dd` do `dl`):
  - vigente: selo `VIGENTE`; `heading` nível 2 `Certificado válido`; pares
    `[['N° de registro','LOT-2026-144'],['Alumno','María Fernanda Rojas'],['Curso','Especialistas Líneas Vivas en Media Tensión · 40 h'],['Término','12 de agosto de 2026'],['Válido hasta','12 de agosto de 2028']]`;
    o `pdf` passado aparece.
  - por vencer: o mesmo cartão e o texto `Próximo a vencer`.
  - `valido_ate` nulo → sem o par `Válido hasta`; `end_date` nulo → sem `Término` (D4).
  - vencido: selo `VENCIDO`, `Certificado vencido`, par `['Venció el','3 de marzo de 2026']`, a nota de
    vencido e o `pdf`.
  - revogado: selo `REVOCADO`, `Certificado revocado`, pares
    `[['N° de registro','LOT-2026-144'],['Revocado el','5 de octubre de 2026']]` só, a nota de
    revogado, e o `pdf` **não** aparece mesmo passado.
  - revogado com `revoked_at` nulo → sem `Revocado el` (P6).
  - selo: `ok` → classe `bg-status-ok`, `aviso` → `bg-status-warn`, `perigo` → `bg-danger`,
    `neutro` → `bg-accent-ink`; todos `text-white`.

  `CartaoDeAviso.test.tsx`: com `selo`, o selo é neutro; sem `selo`, nenhum selo; título é
  `heading` nível 2; `tituloRef` recebe o `h2`, que tem `tabIndex={-1}`.

- [ ] **Step 4: Rodar e ver falhar**

  Run: `pnpm exec vitest run src/components/validacao src/content`
  Expected: FAIL — módulos inexistentes.

- [ ] **Step 5: Implementar**

  Visual do mockup `resultado-estados.html` (D3/D4): cartão `bg-surface`, selo em pílula
  (`rounded-pill`, Montserrat bold, espaçado), título `font-display` `text-title-light`, `dl` em duas
  colunas com `dt` `text-muted-ink`. O selo neutro usa `accent-ink` (P13). `CartaoDoCertificado`
  decide só por `display_status` (a página não calcula estado, D4).

- [ ] **Step 6: Rodar e ver passar**

  Run: `pnpm exec vitest run src/components/validacao src/content && pnpm lint`
  Expected: PASS.

- [ ] **Step 7: Commit**

  ```bash
  git add src/index.css src/content/validacao.ts src/content/validacao.test.ts src/components/validacao/
  git commit -m "feat(validacao-certificado): desenhar os cartões de resultado da validação"
  ```

---

### Task 9: A página — formulário, modo QR e PDF

**Files:**
- Create: `src/components/validacao/useContagemRegressiva.ts`
- Create: `src/components/validacao/EsperaComContagem.tsx`
- Create: `src/components/validacao/BotaoDoPdf.tsx` + `.test.tsx`
- Create: `src/components/validacao/FormularioDeConsulta.tsx` + `.test.tsx`
- Create: `src/components/validacao/ValidacaoCertificado.tsx` + `.test.tsx`
- Modify: `src/app/ValidarApp.tsx`; Create: `src/app/ValidarApp.test.tsx`

**Interfaces:**
- Consumes: tipos da Task 7, `ModoDaValidacao` e `lerModo` (Task 6), `codigoValido`, `rutValido`
  (Task 6), conteúdo e cartões (Task 8), `createCertificadosApi` e `URL_PADRAO_DA_API` (Task 7).
- Produces:
  - `useContagemRegressiva(segundos: number, aoTerminar: () => void): number` — começa na montagem,
    decresce a cada 1000 ms, chama `aoTerminar` uma vez em zero. Quem usa monta de novo (`key`) a cada
    espera nova. Dois consumidores: `EsperaComContagem` e `BotaoDoPdf`.
  - `EsperaComContagem({ segundos, aoTerminar }: { segundos: number | null; aoTerminar: () => void })`
    — `CartaoDeAviso` ESPERE; com número, `emSegundos(restante)` dentro de `<span aria-live="off">`
    (P9); sem número, `semNumero`, e a contagem corre 60 s escondida (D16).
  - `BotaoDoPdf({ baixar, aoRevogar }: { baixar: () => Promise<ResultadoDoPdf>; aoRevogar: () => void })`.
  - `FormularioDeConsulta({ estado, errosDoServidor, aoEnviar }: { estado: 'livre' | 'validando' | 'esperando'; errosDoServidor: CampoDaConsulta[]; aoEnviar: (codigo: string, rut: string) => void })`.
  - `ValidacaoCertificado({ modo, consultarPorUuid, consultarPorCodigo, baixarPdf }: { modo: ModoDaValidacao; consultarPorUuid: ConsultaPorUuid; consultarPorCodigo: ConsultaPorCodigo; baixarPdf: BaixarPdf })`.

- [ ] **Step 1: Testes do formulário** (`FormularioDeConsulta.test.tsx`)

  - `formato errado não envia e marca o campo`: código `LOT-26-1` e RUT `12.345.678-5` → texto
    `Formato: LOT-2026-123`; o input do código tem `aria-invalid="true"` e `aria-describedby` que
    inclui o id do erro; `aoEnviar` não chamado. RUT `12.345.678-4` → `RUT inválido`.
  - `envia os valores aparados`: `' lot-2026-123 '` e `' 12.345.678-5 '` →
    `aoEnviar('lot-2026-123', '12.345.678-5')` (a normalização é da integração).
  - `errosDoServidor marca os campos vindos da API`: `['rut']` → só `RUT inválido`.
  - `botão por estado`: `livre` → `VALIDAR` habilitado; `validando` → `Validando…` desabilitado;
    `esperando` → `VALIDAR` desabilitado.
  - `Enter não envia fora de livre`: com `estado: 'validando'`, `fireEvent.submit(form)` não chama
    `aoEnviar` (o handler confere o estado; não depende do botão desabilitado).
  - Os rótulos são `N° de registro` e `RUT del alumno` (acessíveis por `getByLabelText`), e os
    exemplos `Ej.: LOT-2026-123` e `Ej.: 12.345.678-5` estão no `aria-describedby` de cada campo.

- [ ] **Step 2: Testes do PDF** (`BotaoDoPdf.test.tsx`; `URL.createObjectURL` e
  `URL.revokeObjectURL` stubados com `vi.stubGlobal`/`vi.fn`, `HTMLAnchorElement.prototype.click`
  espionado)

  - `200 baixa com o nome do Content-Disposition`: `baixar` devolve
    `{ tipo: 'pdf', arquivo, nome: 'certificado-LOT-2026-144.pdf' }` → `createObjectURL(arquivo)`,
    um clique num `<a>` com `download` igual ao nome, e `revokeObjectURL` com a mesma URL.
  - `desativado enquanto baixa`: com a promessa pendente, `DESCARGAR PDF` está desabilitado.
  - `410 chama aoRevogar`.
  - `espera conta e libera`: `{ tipo: 'espera', segundos: 2 }` com `vi.useFakeTimers()` →
    `Demasiadas consultas seguidas. Intente de nuevo en 2 segundos.` e botão desabilitado;
    `advanceTimersByTime(2000)` → mensagem some e botão habilitado.
  - `falha mostra a frase do PDF`: `No pudimos descargar el PDF ahora. Intente más tarde.`

- [ ] **Step 3: Testes da página** (`ValidacaoCertificado.test.tsx`; funções falsas com `vi.fn`)

  Modo formulário:
  - `200 mostra o cartão abaixo do formulário e foca o título`: preencher e enviar; durante a promessa
    o botão diz `Validando…`; depois, `Certificado válido` visível, o formulário continua, e
    `document.activeElement` é o `h2` (P8). A região do resultado tem `aria-live="polite"`.
  - `segundo envio durante Validando… não pede de novo`: dois `submit` seguidos → uma chamada.
  - `não encontrado`: o título e as duas notas do formulário.
  - `formato-invalido da API marca o campo`: `campos: ['codigo']` → `Formato: LOT-2026-123`.
  - `espera ≤ 60`: `segundos: 3`, fake timers → `Intente de nuevo en 3 segundos.`, VALIDAR
    desabilitado; `+1000` → `2 segundos`; `+2000` → cartão some, VALIDAR habilitado (P4). O número
    está num elemento com `aria-live="off"`.
  - `espera sem número`: `segundos: null` → `Intente de nuevo en unos momentos.`; VALIDAR volta em
    `+60000`.
  - `bloqueio`: `segundos: 3120` → `Podrá intentar de nuevo en 52 minutos.`, `Mientras tanto, escanee
    el código QR del certificado:` e VALIDAR **habilitado**; `segundos: 61` → `2 minutos`; um novo
    envio tira a mensagem.
  - `falha`: `No pudimos validar el certificado ahora. Intente más tarde.`

  Modo QR (`modo: { tipo: 'qr', uuid: UUID }`):
  - `abre consultando o uuid`: `Validando…` primeiro; `consultarPorUuid` chamado com `UUID`; depois o
    cartão; nenhum `textbox`; link `Validar otro certificado` com `href` `/validar`; o foco **não**
    vai ao cartão (P8).
  - `não encontrado pelo QR não fala de RUT`: `No encontramos este certificado` e
    `Revise que el código QR escaneado sea el del certificado.`; a região do resultado não contém `RUT`.
  - `espera pelo QR tenta de novo ao chegar a zero`: primeira chamada `espera 2`, segunda
    `certificado` → `+2000` → segunda chamada feita e `Certificado válido` visível (P4).

  PDF dentro da página:
  - `botão do PDF chama baixarPdf com uuid e código`: depois de um 200 da consulta com
    `uuid: UUID`, clicar `DESCARGAR PDF` → `baixarPdf(UUID, 'LOT-2026-144')`.
  - `410 vira o cartão revogado sem data e foca o título`: `baixarPdf` devolve `revogado` →
    `Certificado revocado`, sem `DESCARGAR PDF`, sem `Revocado el`, foco no `h2` (P6, P8).
  - `revogado não tem botão de PDF`.

  `src/app/ValidarApp.test.tsx`: renderiza `ValidarApp` (com `fetch` stubado para não sair rede) e
  encontra o `h1` `VALIDAR CERTIFICADO`, o link `Validar Certificado` com `aria-current="page"` e o
  rodapé.

- [ ] **Step 4: Rodar e ver falhar**

  Run: `pnpm exec vitest run src/components/validacao src/app/ValidarApp.test.tsx`
  Expected: FAIL — componentes inexistentes.

- [ ] **Step 5: Implementar**

  - `ValidacaoCertificado`: estado `{ tipo: 'vazio' } | { tipo: 'validando' } | ResultadoDaConsulta`,
    mais um contador de tentativa usado como `key` da espera. O `uuid` do 200 fica só nesse estado
    (D8). O modo QR consulta num `useEffect` com sinal de cancelamento na limpeza (o `StrictMode`
    monta duas vezes no dev) e repete ao fim da espera. Foco ao título por `useEffect` depois de
    resultado vindo de ação de quem usa. O 410 do PDF troca o estado para o mesmo certificado com
    `display_status: 'revocado'` (P6). O bloqueio mostra `emMinutos(Math.ceil(segundos / 60))`,
    calculado uma vez quando o 429 chega (spec §5.4).
  - Layout A (D3): faixa `bg-ink`; kicker branco `text-kicker` espaçado; `h1` `text-brand`
    `font-display` bold; abertura branca; formulário num cartão `bg-surface`; botão no desenho do
    `Enviar` do `ContactForm` (`rounded-pill`, `font-display`, `text-button`, `uppercase`,
    `disabled:opacity-60`); linha do QR branca abaixo. No modo QR: kicker, `h1`, região do resultado e
    o link `Validar otro certificado` (`text-link`), sem abertura, formulário nem linha do QR.
  - `FormularioDeConsulta`: `noValidate`; inputs `codigo` (`autoComplete="off"`,
    `autoCapitalize="characters"`, `spellCheck={false}`) e `rut` (`autoComplete="off"`), rótulo
    `sr-only` e `placeholder` (P15).
  - `BotaoDoPdf`: download por `URL.createObjectURL` + `<a download>` temporário, revogando a URL num
    `setTimeout(…, 0)` depois do clique (spec §5.4).
  - `ValidarApp`: `createCertificadosApi(import.meta.env.VITE_CERTIFICADOS_API_URL || URL_PADRAO_DA_API)`
    e `lerModo(window.location.pathname)` no nível do módulo, como o `App` faz com o Turnstile;
    `<ValidacaoCertificado modo={…} consultarPorUuid={api.porUuid} consultarPorCodigo={api.porCodigo} baixarPdf={api.pdf} />`
    dentro do `<main>`.

- [ ] **Step 6: Rodar e ver passar**

  Run: `pnpm exec vitest run src && pnpm lint && pnpm typecheck`
  Expected: PASS.

- [ ] **Step 7: Conferir na tela**

  Run (em segundo plano): `pnpm dev --port 5190 --strictPort`. Com um script Playwright em `$SP` que
  intercepta `https://app.lotusotec.cl/**` (respostas da fixture), capturar `/validar` (formulário e
  cartão vigente) e `/validar/<UUID>` em 375 e 1440 para `$SP/validar-*.png`. Comparar com o mockup A
  e com `resultado-estados.html`: faixa preta, cartão claro, campos de linha inferior, selo e `dl`.
  Diferença de desenho é corrigida antes do commit; parar o dev server depois.

- [ ] **Step 8: Commit**

  ```bash
  git add src/components/validacao/ src/app/ValidarApp.tsx src/app/ValidarApp.test.tsx
  git commit -m "feat(validacao-certificado): montar a página de validação com formulário, QR e PDF"
  ```

---

### Task 10: E2E da validação nos quatro motores, axe, SEO e CSP

**Files:**
- Create: `e2e/certificados-falsos.ts`, `e2e/validar.spec.ts`
- Modify: `playwright.config.ts` (`FLUXO_PRINCIPAL` + `'**/validar.spec.ts'`)
- Modify: `e2e/a11y.spec.ts`, `e2e/seo.spec.ts`, `e2e/cabecalhos.spec.ts`
- Modify: `e2e/smoke/9-404.spec.ts`; Create: `e2e/smoke/10-validar.spec.ts`

**Interfaces:**
- Produces (`e2e/certificados-falsos.ts`):
  - `API_CERTIFICADOS = 'https://app.lotusotec.cl/api/publico/certificados/**'`, `UUID`;
  - payloads como a API manda (com `cliente` e `redator`): `VIGENTE`, `POR_VENCER`, `VENCIDO`,
    `REVOGADO` (`revoked_at: '2026-10-05T14:30:00.000000Z'`), e `CONSULTA_VIGENTE` = `VIGENTE` + `uuid`;
  - `type RespostaFalsa = { status: number; corpo?: unknown; headers?: Record<string, string> }`;
  - `type PedidoCapturado = { tipo: 'uuid' | 'consulta' | 'pdf'; method: string; url: string; corpo: string; cookie?: string }`;
  - `fingirApiCertificados(page, respostas: Partial<Record<'uuid' | 'consulta' | 'pdf', RespostaFalsa | RespostaFalsa[]>>, capturados: PedidoCapturado[] = [])`
    — lista é consumida em ordem e a última se repete. `OPTIONS` responde 204 com
    `Access-Control-Allow-Origin` = `Origin` do pedido,
    `Access-Control-Allow-Methods: GET, POST, OPTIONS` e
    `Access-Control-Allow-Headers: Content-Type, Accept, Accept-Language`, sem capturar. Os outros
    pedidos são capturados (com `cookie` de `await request.allHeaders()`) e respondem com os headers
    dados mais `Access-Control-Allow-Origin` = `Origin` e
    `Access-Control-Expose-Headers: Content-Disposition, Retry-After` (A3). O PDF falso tem
    `Content-Type: application/pdf` e
    `Content-Disposition: attachment; filename="certificado-LOT-2026-144.pdf"`. Pedido de tipo sem
    resposta configurada aborta (`route.abort('failed')`).

- [ ] **Step 1: `e2e/validar.spec.ts`** (A3)

  QR (`goto(`/validar/${UUID}`)`):
  - `vigente mostra o cartão e baixa o PDF com o nome do Content-Disposition`:
    `Certificado válido`; `page.waitForEvent('download')` + clique em `DESCARGAR PDF` →
    `suggestedFilename()` = `certificado-LOT-2026-144.pdf`.
  - `por vencer` → `Próximo a vencer`. `vencido` → `Certificado vencido`, `Venció el`, botão do PDF.
  - `revogado` → `Certificado revocado`, `5 de octubre de 2026` (microssegundos, P10), sem
    `DESCARGAR PDF`.
  - `não encontrado` → `No encontramos este certificado`.
  - `espera tenta de novo`: `uuid: [{ status: 429, headers: { 'Retry-After': '2' } }, { status: 200, corpo: VIGENTE }]`
    → `Intente de nuevo en 2 segundos.`, depois `Certificado válido` (timeout 5 s) e dois pedidos
    `uuid` capturados.
  - `PDF 410 vira revogado`: `pdf: { status: 410 }` → depois do clique, `Certificado revocado` e sem
    botão.

  Formulário (`goto('/validar')`, preencher `LOT-2026-144` e `12.345.678-5`, clicar `VALIDAR`):
  - `200 mostra o cartão abaixo do formulário sem mudar a URL`: cartão e formulário visíveis;
    `toHaveURL(/\/validar$/)`; `capturados[0].corpo` =
    `'{"codigo":"LOT-2026-144","rut":"12.345.678-5"}'`.
  - `não encontrado` → `No encontramos un certificado con esos datos`.
  - `422 do servidor marca o campo`: `corpo: { errors: { codigo: ['x'] } }` →
    `Formato: LOT-2026-123` visível e `RUT inválido` ausente.
  - `formato inválido não sai pedido`: `LOT-26-1` e `12.345.678-4` → os dois erros e `capturados`
    vazio.
  - `espera ≤ 60`: `Retry-After: '2'` → `VALIDAR` desabilitado e `Intente de nuevo en 2 segundos.`;
    depois `toBeEnabled({ timeout: 5_000 })`.
  - `bloqueio > 60`: `Retry-After: '3120'` → `52 minutos` e
    `Mientras tanto, escanee el código QR del certificado`; `VALIDAR` habilitado.
  - `500 e rede viram a frase genérica`: `status: 500` e, noutro teste, `uuid`/`consulta` sem resposta
    (aborta) → `No pudimos validar el certificado ahora. Intente más tarde.`

  Privacidade:
  - `o RUT não aparece em URL nenhuma, nenhum pedido leva cookie e nada fica guardado`:
    `context.addCookies([{ name: 'sessao', value: 'x', domain: 'app.lotusotec.cl', path: '/', secure: true, sameSite: 'None' }])`;
    `page.on('request')` guarda as URLs; fazer consulta e PDF; nenhuma URL e nem `page.url()` contém
    `12.345.678`, `12345678` ou `123456785`; todo `capturados[i].cookie` é `undefined`;
    `localStorage.length` e `sessionStorage.length` são `0`.

- [ ] **Step 2: Rodar nos quatro motores**

  Run: `pnpm exec playwright test e2e/validar.spec.ts`
  Expected: PASS em `chromium`, `firefox`, `webkit` e `mobile-webkit`. Download que falha num motor
  é defeito do `BotaoDoPdf` (revogação cedo demais, por exemplo), não do teste: corrigir na
  Task 9 com commit `fix(validacao-certificado): …`.

- [ ] **Step 3: axe** (`e2e/a11y.spec.ts`, A6)

  `State` ganha `url?: string`; o laço faz `page.goto(state.url ?? '/')`; o `beforeEach` chama também
  `fingirApiCertificados(page, { uuid: { status: 200, corpo: VIGENTE } })`. Estados novos:
  `validar-1440` e `validar-375` (`/validar`); `validar-erros-1440` (enviar `LOT-26-1` e
  `12.345.678-4`); `validar-cartao-375` (`/validar/${UUID}`, esperar `Certificado válido`). Atualizar
  o comentário que conta navegações.

  Run: `pnpm exec playwright test --project chromium e2e/a11y.spec.ts`
  Expected: PASS sem exceção nova em `a11y-exceptions.ts`.

- [ ] **Step 4: SEO** (`e2e/seo.spec.ts`)

  `/validar publica noindex sem canonical e fica fora do sitemap`: `goto('/validar')`;
  `meta[name="robots"]` com `noindex`; nenhum `link[rel="canonical"]`; o teste do sitemap existente
  continua exigindo só a home.

- [ ] **Step 5: CSP** (`e2e/cabecalhos.spec.ts`, A2, projeto `producao`)

  `a validação pelo QR e o PDF passam sob a CSP`: `vigiarViolacoes`; `fingirApiCertificados` com
  `uuid` vigente e `pdf` 200; `goto(`/validar/${UUID}`)`; `Certificado válido`; download do PDF;
  `violacoes(page)` igual a `[SONDA_DO_ZOD]` (o `z.object` do schema dispara a mesma sonda uma vez
  por carga, como na home); nenhum erro de console. Run:
  `pnpm exec playwright test --project producao e2e/cabecalhos.spec.ts`. Se a lista de violações
  vier diferente, registrar o que veio e entender antes de ajustar a expectativa.

- [ ] **Step 6: Smoke de produção** (roda só em A8)

  - `9-404.spec.ts`: o laço passa a cobrir `/caminho-que-nao-existe-7224`, `/validar/abc` e
    `/validar/0f8fad5b-d9cb-469f-a165-70867728950e/x`.
  - `10-validar.spec.ts`: `/validar` e `/validar/00000000-0000-4000-8000-000000000000` → 200,
    `content-type` com `text/html`, `cache-control` `no-cache` e corpo com `noindex`. A CSP exata já
    é do item 8.

  Run: `pnpm typecheck`
  Expected: PASS.

- [ ] **Step 7: Suíte inteira**

  Run: `pnpm e2e`
  Expected: PASS em todos os projetos.

- [ ] **Step 8: Commit**

  ```bash
  git add e2e/certificados-falsos.ts e2e/validar.spec.ts e2e/a11y.spec.ts e2e/seo.spec.ts e2e/cabecalhos.spec.ts e2e/smoke/9-404.spec.ts e2e/smoke/10-validar.spec.ts playwright.config.ts
  git commit -m "test(validacao-certificado): provar a validação nos quatro motores, sob a CSP e no axe"
  ```

---

### Task 11: Prova local contra o stack do Lotus (A7), com João

**Files:**
- Create: `docs/infra/evidencia-validacao-certificado-<AAAA-MM-DD>.md`

Passo humano: sem João e o stack do Lotus disponíveis, a execução vai para `blocked` com
`blocker: 'A7 aguarda o stack local do Lotus'` e `resume_state: executing`. Não pular para a Task 12.

- [ ] **Step 1: Pedir a João**

  Na árvore principal do Lotus: `CORS_PUBLIC_ORIGINS=http://localhost:5190` no `backend/.env`, backend
  reiniciado (e configuração recarregada), e um certificado de demonstração vigente, com código, RUT
  e uuid informados aqui (o `LOT-2026-9001` da lane provavelmente sumiu — packet, Open question 4).
  Um revogado, se houver.

- [ ] **Step 2: Preflight**

  Run: `curl -si -X OPTIONS http://localhost:8080/api/publico/certificados/consulta -H 'Origin: http://localhost:5190' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type'`
  Expected: `Access-Control-Allow-Origin: http://localhost:5190` e nenhum
  `Access-Control-Allow-Credentials`. Outra origem na resposta = o `.env` não pegou; voltar ao Step 1.

- [ ] **Step 3: Subir o site apontando para o Lotus**

  Run (em segundo plano): `VITE_CERTIFICADOS_API_URL=http://localhost:8080 pnpm dev --port 5190 --strictPort`

- [ ] **Step 4: Provar, com João olhando ou por script Playwright em `$SP`**

  - QR do certificado vigente → cartão certo;
  - código + RUT certos → o mesmo cartão;
  - RUT errado → SIN RESULTADO (404 no Network);
  - formato inválido → erro no campo, sem pedido;
  - PDF → arquivo baixado com o nome do `Content-Disposition`;
  - 11 consultas no mesmo minuto → ESPERE com a contagem;
  - se der: 21 falhas na hora → BLOQUEADO com a orientação do QR, e o QR ainda validando;
  - revogado, se houver.

- [ ] **Step 5: Registrar**

  Evidência com data, commit do Lotus (`git -C ../lotus rev-parse --short HEAD`), commit do site, o
  que foi visto em cada item (status HTTP, texto, nome do arquivo) e o que não foi provado e por quê.
  O RUT de demonstração não é escrito; o código é. Parar o dev server.

- [ ] **Step 6: Commit**

  ```bash
  git add docs/infra/evidencia-validacao-certificado-*.md
  git commit -m "docs(validacao-certificado): registrar a prova local contra o stack do Lotus"
  ```

---

### Task 12: Gates do bloco e entrega para review

**Files:**
- Modify: `docs/superpowers/state.md`

- [ ] **Step 1: Gate do repositório**

  Run: `pnpm check`
  Expected: todos os passos verdes (`agent:check` … `build:lambda`).

- [ ] **Step 2: E2E**

  Run: `pnpm e2e`
  Expected: PASS em `chromium`, `firefox`, `webkit`, `mobile-webkit` e `producao`.

- [ ] **Step 3: CI corporativo na árvore filtrada** (o bloco mexe em `ci.yml` e `scripts/**/*.mjs`)

  ```bash
  DIR=$SP/espelho-$(git rev-parse --short HEAD) && mkdir -p "$DIR"
  mapfile -t EX < <(grep -vE '^\s*(#|$)' .espelho-exclusoes | sed -E 's#/$##; s#^#:(exclude)#')
  git archive HEAD -- . "${EX[@]}" | tar -x -C "$DIR"
  cd "$DIR" && pnpm install --frozen-lockfile --offline && pnpm check
  ```

  Expected: verde; o teste da `ADR-SITE-004` aparece como `skipped` (sem `docs/` no espelho).

- [ ] **Step 4: Escopo do diff**

  Run: `git diff --stat main...HEAD` e `grep -rn "console\." src/components/validacao src/integrations/certificados`
  Expected: só arquivos do Mapa de arquivos (mais `src/app/App.tsx` se o Step 6 da Task 5 entrou);
  nenhum `console.`.

- [ ] **Step 5: `ready_for_review`**

  `workflow_state: ready_for_review`, `next_owner: claude-isolado`,
  `next_action: review_active_work_item`, `state_basis_commit`, `updated_at`; `pnpm agent:check`.

  ```bash
  git add docs/superpowers/state.md
  git commit -m "chore(validacao-certificado): entregar a execução para review"
  ```

---

## Depois deste plano (`/fechar-site`, não executar aqui)

- `BLOCOS` do backlog ganha o bloco; o corpo do PR diz que ele só é mesclado depois de D13 passo 1
  (`GET /consulta` → 405 **e** preflight com `Origin: https://lotusotec.cl` devolvendo esse
  `Allow-Origin` sem `Allow-Credentials`).
- Pendências: "prova em produção da validação" (A8, gatilho D13 passo 1, com o smoke dos itens 5, 8,
  9 e 10 e um uuid real); "link de contato na validação" (gatilho: aceite da D-70 do Lotus).
- João aplica o change set de `infra/lotus-site.yaml` (D13 passo 2) quando quiser; pode ser antes do
  merge.
- Aviso à sessão do Lotus de que a página está pronta para a ficha 63 depois de A8.

## Handoff de execução

executor: claude
reviewer: claude-isolado
paths_autorizados:

- não se aplica (executor = claude)

O reviewer nasce `claude-isolado`: o teste do Codex falhou em 2026-11-24 com
`The 'gpt-5.5' model is not supported when using Codex with a ChatGPT account.` Sem
`reviewer_exception`. `/revisar-site` testa de novo e grava `codex` se ele responder.

Execução nativa (`superpowers:executing-plans`), recomendada no handoff e aprovada por João em
2026-11-24 junto com o plano.
