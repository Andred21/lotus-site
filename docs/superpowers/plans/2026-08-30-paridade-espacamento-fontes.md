# Paridade residual — espaçamento vertical, pesos de fonte reais e guarda de regressão

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar `D-23`, `D-24`, `D-25` e `D-26` — dar glifo real a cada peso de fonte, corrigir o espaçamento vertical das seis áreas medidas contra `https://lotusotec.cl/`, e fazer a guarda de regressão visual observar o build em vez do dev server.

**Architecture:** Fonte primeiro, espaçamento depois. Peso de glifo altera largura, largura altera quebra de linha, quebra altera altura — medir espaçamento sobre fonte errada calibraria padding para compensar defeito de fonte (D2 da spec). Depois das faces reais, um script novo mede referência e clone nó a nó nas quatro larguras; só valor com linha nessa medição entra em código. Os snapshots de `toHaveScreenshot` são regenerados uma única vez, no fim, junto com a mudança de projeto da guarda.

**Tech Stack:** Vite 7 + React 19 + TypeScript, Tailwind 4 por `@theme` em `src/index.css`, Vitest (jsdom) para unidade, Playwright para E2E e captura, Lighthouse para performance. Gerenciador: pnpm. Spec: [`docs/superpowers/specs/2026-08-30-paridade-espacamento-fontes-design.md`](../specs/2026-08-30-paridade-espacamento-fontes-design.md).

## Global Constraints

- Node **24.19.0** e pnpm **11.x**. `engineStrict: true` faz runtime fora da faixa morrer com `ERR_PNPM_UNSUPPORTED_ENGINE`. O shell padrão da máquina está em v22.23.1: rodar `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24` antes de qualquer comando pnpm.
- **Nenhuma dependência nova.** `pnpm-lock.yaml` fica fora do diff; `package.json` muda só no bloco `scripts`.
- Commits em Conventional Commits com escopo `paridade`, um por task. `main` não recebe commit; a branch é `fix/paridade-espacamento-fontes`.
- Todo documento markdown deste bloco roda `pnpm format` antes do commit (`D-18` continua aberto: `prettier-plugin-tailwindcss` reordena classe Tailwind dentro de bloco de código em markdown).
- Nenhum texto institucional muda. O diff de `src/content/site.ts` altera estrutura, nunca palavra, pontuação ou caixa.
- Não tocar `.claude/**`, `.agents/**`, `e2e/a11y-exceptions.ts`, `docs/inventario/styles.json`, `docs/inventario/dom.json`.
  **Emenda de 2026-08-30, autorizada por João** (registrada em 2026-08-31 pelo achado `C-3` da
  review): `e2e/a11y-exceptions.ts` sai desta lista para atualizar o seletor da exceção de
  contraste já catalogada, que o `p-[30px]` da Task 8 tornou obsoleto — mesmo nó, mesma cor,
  mesma razão (commit `af09ee6`). O resto da lista continua valendo.
- Pasta da rodada nova: `docs/qa/paridade/2026-08-30/` e `docs/qa/performance/2026-08-30/`.
- **`pnpm e2e` fica vermelho entre as Tasks 1 e 9**, porque `e2e/regressao-visual.spec.ts` compara pixel contra snapshot antigo e este bloco muda pixel de propósito. Nessas tasks, rodar apenas `pnpm test` e os specs E2E nomeados na própria task. A suíte inteira volta ao verde na Task 10, que regenera os snapshots.

---

### Task 1: Faces reais e catraca de `sha256`

Hoje `montserrat-400/500/700.woff2` são bytes idênticos (`sha256` `06b16db7a969135d…`) e `open-sans-500/600.woff2` também (`d8e4fe0452aa2076…`). O navegador confia na declaração `@font-face` e pinta o desenho do arquivo que existe, sem sintetizar peso — então nenhum `font-medium`, `font-semibold` ou `font-bold` do clone tem glifo próprio.

**Files:**

- Create: `scripts/inventario/fontes.test.mjs`
- Modify (bytes): `src/assets/fonts/montserrat-500.woff2`, `src/assets/fonts/montserrat-700.woff2`, `src/assets/fonts/open-sans-600.woff2`
- Modify: `docs/inventario/04-tipografia.md`

**Interfaces:**

- Consumes: nada.
- Produces: cinco arquivos `.woff2` com `sha256` distintos em `src/assets/fonts/`; os nomes não mudam, então `src/index.css` continua válido sem edição.

- [ ] **Step 1: Escrever o teste que falha**

Criar `scripts/inventario/fontes.test.mjs`. O arquivo vive em `scripts/**` porque `tsconfig.app.json` declara `"types": ["vite/client"]` e não tem tipos de Node: um teste em `src/**` que importasse `node:fs` derrubaria `tsc -b`. `tsconfig.node.json` já inclui `scripts/**/*.mjs`, e `vitest.config.ts` já inclui `scripts/**/*.test.mjs`.

```js
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const DIR = 'src/assets/fonts'

/** As cinco faces declaradas em `src/index.css`. */
const FACES = [
  'montserrat-400.woff2',
  'montserrat-500.woff2',
  'montserrat-700.woff2',
  'open-sans-500.woff2',
  'open-sans-600.woff2',
]

/** @param {string} arquivo */
const sha256 = (arquivo) =>
  createHash('sha256')
    .update(readFileSync(join(DIR, arquivo)))
    .digest('hex')

describe('faces self-hosted', () => {
  it('tem em disco exatamente as cinco faces declaradas em src/index.css', () => {
    const emDisco = readdirSync(DIR)
      .filter((nome) => nome.endsWith('.woff2'))
      .sort()
    expect(emDisco).toEqual([...FACES].sort())
  })

  it('dá arquivo próprio a cada peso', () => {
    // D-23: o self-host da EAP 3.1.1 copiou o mesmo arquivo três vezes. Peso
    // declarado sem glifo próprio não é peso — o navegador pinta o desenho do
    // arquivo que está lá e não sintetiza nada.
    const digests = FACES.map(sha256)
    expect(new Set(digests).size).toBe(FACES.length)
  })
})
```

- [ ] **Step 2: Rodar o teste e ver falhar**

```bash
pnpm test scripts/inventario/fontes.test.mjs
```

Esperado: FAIL em `dá arquivo próprio a cada peso`, com `expected 2 to be 5` (hoje há só dois conteúdos distintos entre os cinco arquivos). O primeiro teste passa.

- [ ] **Step 3: Baixar as três faces reais**

Escrever o script temporário em `/tmp/baixar-fontes.mjs` — **não versionar**: baixar fonte é evento único e um script no repositório custaria manutenção sem consumidor futuro (D5 da spec).

```js
import { writeFileSync } from 'node:fs'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const CSS =
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&family=Open+Sans:wght@500;600&display=swap'

const ALVOS = [
  {
    familia: 'Montserrat',
    peso: '500',
    destino: 'src/assets/fonts/montserrat-500.woff2',
  },
  {
    familia: 'Montserrat',
    peso: '700',
    destino: 'src/assets/fonts/montserrat-700.woff2',
  },
  {
    familia: 'Open Sans',
    peso: '600',
    destino: 'src/assets/fonts/open-sans-600.woff2',
  },
]

const css = await (await fetch(CSS, { headers: { 'User-Agent': UA } })).text()
// A resposta do css2 vem em blocos precedidos pelo comentário do subset
// (`/* latin */`, `/* latin-ext */`, …). Só o subset `latin` interessa: é o
// que as cinco faces atuais usam.
const blocos = css.split('/*').map((parte) => `/*${parte}`)

for (const { familia, peso, destino } of ALVOS) {
  const bloco = blocos.find(
    (candidato) =>
      candidato.startsWith('/* latin */') &&
      candidato.includes(`font-family: '${familia}'`) &&
      candidato.includes(`font-weight: ${peso};`),
  )
  if (!bloco) throw new Error(`bloco latin ausente: ${familia} ${peso}`)
  const url = bloco.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
  if (!url) throw new Error(`url woff2 ausente: ${familia} ${peso}`)
  const bytes = Buffer.from(await (await fetch(url)).arrayBuffer())
  writeFileSync(destino, bytes)
  console.log(`${destino}\t${bytes.length}\t${url}`)
}
```

```bash
node /tmp/baixar-fontes.mjs
```

Esperado: três linhas, cada uma com destino, bytes e URL de `fonts.gstatic.com`. **Guardar a saída** — as três URLs e os três tamanhos entram na documentação do Step 6.

Se as três URLs vierem iguais entre si, o Google devolveu fonte variável em vez de instâncias estáticas: pare, não commite, e registre como bloqueio para João. A catraca do Step 1 pegaria isso de qualquer forma no Step 4.

- [ ] **Step 4: Rodar o teste e ver passar**

```bash
sha256sum src/assets/fonts/*.woff2 | sort
pnpm test scripts/inventario/fontes.test.mjs
```

Esperado: cinco `sha256` distintos na primeira saída, e 2 passed na segunda.

- [ ] **Step 5: Provar que a catraca reprova a regressão**

```bash
cp src/assets/fonts/montserrat-400.woff2 /tmp/montserrat-700.bak.woff2
cp src/assets/fonts/montserrat-700.woff2 /tmp/montserrat-700.real.woff2
cp src/assets/fonts/montserrat-400.woff2 src/assets/fonts/montserrat-700.woff2
pnpm test scripts/inventario/fontes.test.mjs
```

Esperado: FAIL com `expected 4 to be 5`. Restaurar antes de seguir:

```bash
cp /tmp/montserrat-700.real.woff2 src/assets/fonts/montserrat-700.woff2
pnpm test scripts/inventario/fontes.test.mjs
```

Esperado: 2 passed. Conferir com `git status --short` que só os três `.woff2` alvo aparecem como modificados.

- [ ] **Step 6: Documentar a proveniência**

Em `docs/inventario/04-tipografia.md`, acrescentar uma seção `## Faces self-hosted` logo depois de `## Famílias`, com uma linha por arquivo. Preencher `origem`, `bytes` e `sha256` com a saída real dos Steps 3 e 4 — nada de valor estimado.

```markdown
## Faces self-hosted

> As cinco faces de `src/assets/fonts/`, servidas pelo clone. `montserrat-400` e `open-sans-500` vieram da EAP `3.1.1` (2026-08-26); as três restantes foram baixadas em 2026-08-30 para fechar `D-23`, que registrou os cinco arquivos como só dois conteúdos distintos. `scripts/inventario/fontes.test.mjs` reprova se dois pesos voltarem a compartilhar bytes.

| arquivo                | família      | peso | origem | baixado em | bytes | sha256 |
| ---------------------- | ------------ | ---- | ------ | ---------- | ----- | ------ |
| `montserrat-400.woff2` | `Montserrat` | 400  |        |            |       |        |
| `montserrat-500.woff2` | `Montserrat` | 500  |        |            |       |        |
| `montserrat-700.woff2` | `Montserrat` | 700  |        |            |       |        |
| `open-sans-500.woff2`  | `Open Sans`  | 500  |        |            |       |        |
| `open-sans-600.woff2`  | `Open Sans`  | 600  |        |            |       |        |
```

Para as duas faces herdadas, cuja URL de origem não foi registrada em 2026-08-26, escrever `não registrada na EAP 3.1.1` na coluna `origem` e `2026-08-26` em `baixado em`. Não inventar URL.

- [ ] **Step 7: Formatar e commitar**

```bash
pnpm format
pnpm test scripts/inventario/fontes.test.mjs
git add src/assets/fonts scripts/inventario/fontes.test.mjs docs/inventario/04-tipografia.md
git commit -m "fix(paridade): dar glifo real a cada peso de fonte self-hosted

Os cinco .woff2 eram dois conteúdos: montserrat-400/500/700 com o mesmo
sha256 e open-sans-500/600 com o mesmo. Nenhum font-medium, font-semibold
ou font-bold do clone renderizava com o desenho do peso declarado.

Catraca nova em scripts/inventario/fontes.test.mjs reprova peso sem
arquivo próprio. Fecha metade de D-23; o preload vem na task seguinte."
```

---

### Task 2: Preload aponta para a face que o LCP carrega

`scripts/vite/preload-critical.mjs:21` mira `montserrat-400` e o comentário diz por quê: com os três arquivos idênticos, o Vite dedupava por conteúdo e o sobrevivente herdava o prefixo do primeiro `@font-face` declarado. Com bytes distintos o dedupe some, e o `<h1 id="hero-heading">` — elemento do LCP, `font-bold` — passa a carregar `montserrat-700`.

**Files:**

- Modify: `scripts/vite/preload-critical.mjs:9-32`
- Modify: `scripts/vite/preload-critical.test.mjs:4-37`

**Interfaces:**

- Consumes: os cinco `.woff2` distintos da Task 1.
- Produces: `preloadTags(ctx)` passa a devolver `/assets/montserrat-700-*.woff2` e `/assets/open-sans-500-*.woff2`, nessa ordem. Assinatura inalterada.

- [ ] **Step 1: Atualizar o teste para o alvo novo**

Em `scripts/vite/preload-critical.test.mjs`, trocar a entrada do bundle falso e a expectativa:

```js
  'assets/montserrat-700-d4e5f6.woff2': {
    type: 'asset',
    fileName: 'assets/montserrat-700-d4e5f6.woff2',
  },
```

```js
expect(fontes.map((tag) => tag.attrs.href)).toEqual([
  '/assets/montserrat-700-d4e5f6.woff2',
  '/assets/open-sans-500-070809.woff2',
])
```

- [ ] **Step 2: Rodar o teste e ver falhar**

```bash
pnpm test scripts/vite/preload-critical.test.mjs
```

Esperado: FAIL em `preloada as duas faces acima da dobra, com crossorigin`, com o array recebido trazendo só `/assets/open-sans-500-070809.woff2` (o alvo `montserrat-400` não existe mais no bundle falso).

- [ ] **Step 3: Trocar o alvo e reescrever o comentário**

Em `scripts/vite/preload-critical.mjs`, substituir o primeiro item de `ALVOS` inteiro — comentário incluso, porque ele documenta um estado que deixou de existir:

```js
const ALVOS = [
  {
    // O elemento do LCP é o `<h1 id="hero-heading">` (`lcp-breakdown-insight`
    // de `docs/qa/performance/`), pintado em `font-bold` = peso 700. Até
    // 2026-08-30 o alvo aqui era `montserrat-400`, porque os três arquivos de
    // Montserrat eram bytes idênticos e o Vite dedupava para o nome do
    // primeiro `@font-face`. Com os pesos reais (`D-23` fechado) o dedupe
    // acabou e o arquivo que o `h1` carrega é o do peso 700.
    padrao: /montserrat-700-[^/]*\.woff2$/,
    attrs: { as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
  },
```

O segundo item (`open-sans-500`) e o comentário sobre a foto do hero ficam como estão.

- [ ] **Step 4: Rodar o teste e ver passar**

```bash
pnpm test scripts/vite/preload-critical.test.mjs
```

Esperado: 6 passed.

- [ ] **Step 5: Provar contra o build real**

```bash
pnpm build
grep -o 'rel="preload"[^>]*woff2[^>]*' dist/index.html
```

Esperado: duas linhas, uma com `montserrat-700-<hash>.woff2` e outra com `open-sans-500-<hash>.woff2`, ambas com `crossorigin="anonymous"`. Conferir também que `dist/assets/` tem cinco `.woff2` distintos — antes desta correção o build produzia menos, por dedupe:

```bash
ls dist/assets/*.woff2
```

- [ ] **Step 6: Commitar**

```bash
git add scripts/vite/preload-critical.mjs scripts/vite/preload-critical.test.mjs
git commit -m "fix(paridade): preloadar a face que o elemento do LCP carrega

Com os pesos reais o Vite deixa de dedupar por conteúdo, e o h1 do hero
(font-bold) passa a carregar montserrat-700, não o arquivo 400 que herdava
o nome. Prova: dist/index.html traz o link para montserrat-700."
```

---

### Task 3: Remedir performance com as faces reais

Três arquivos a mais entram na conta de bytes. A medição de `6.2.2` fechou em Performance 99, LCP 2112 ms e CLS 0 (`docs/qa/performance/2026-08-29/resumo-pos-otimizacao.md`); esta task diz o que sobrou disso.

**Files:**

- Modify: `scripts/qa/perf.mjs:17`
- Create: `docs/qa/performance/2026-08-30/lighthouse-fontes-reais.json`, `docs/qa/performance/2026-08-30/resumo-fontes-reais.md` (gerados pelo script)

**Interfaces:**

- Consumes: build com as faces reais (Task 1) e o preload corrigido (Task 2).
- Produces: número medido de Performance, LCP e CLS pós-fonte, citável pelas tasks de documentação.

- [ ] **Step 1: Apontar o script para a pasta da rodada**

Em `scripts/qa/perf.mjs:17`:

```js
const OUT_DIR = 'docs/qa/performance/2026-08-30'
```

Nenhum teste afirma esse literal (`scripts/qa/lib/perf.test.mjs` só testa `resumoMarkdown`), então a troca é isolada.

- [ ] **Step 2: Subir o build e medir**

Em um terminal:

```bash
pnpm build && pnpm preview --port 5184 --strictPort
```

Em outro:

```bash
node scripts/qa/perf.mjs fontes-reais
```

Esperado: uma linha com o caminho `docs/qa/performance/2026-08-30/resumo-fontes-reais.md`.

- [ ] **Step 3: Ler o resumo e registrar o delta**

```bash
cat docs/qa/performance/2026-08-30/resumo-fontes-reais.md
```

Acrescentar ao fim desse arquivo um parágrafo com o delta explícito contra `6.2.2` (Performance 99, LCP 2112 ms, CLS 0), nomeando a causa: três faces reais no lugar de dois arquivos dedupados, e o preload apontando para `montserrat-700`.

Se a nota de Performance cair, **não** improvisar otimização: registrar o número, e a decisão sobre agir fica com João (D10 do bloco `6.1.1-6.3.1` continua valendo — só o gargalo medido é atacado).

- [ ] **Step 4: Formatar e commitar**

```bash
pnpm format
git add scripts/qa/perf.mjs docs/qa/performance/2026-08-30
git commit -m "chore(paridade): medir performance com as faces reais

Relatório cru versionado e delta declarado contra a medição de 6.2.2
(Performance 99, LCP 2112 ms, CLS 0)."
```

---

### Task 4: Script de medição de espaçamento

A medição de 2026-08-29 foi feita à mão durante a review e não é reproduzível. Esta task cria a ferramenta; a Task 5 a usa.

**Files:**

- Create: `scripts/qa/lib/espacamento.mjs`
- Create: `scripts/qa/lib/espacamento.test.mjs`
- Create: `scripts/qa/medir-espacamento.mjs`
- Modify: `package.json` (bloco `scripts`)

**Interfaces:**

- Consumes: `SITE_URL` e `VIEWPORTS` de `scripts/inventario/lib/site.mjs`.
- Produces:
  - `NOS` — `Array<{ nome: string, referencia: string, clone: string }>`, a lista de pares de seletor, vazia nesta task e preenchida na Task 5;
  - `medirNo(page, seletor)` — `Promise<Medida>`, onde `Medida` é `{ height, top, bottom, paddingTop, paddingBottom, marginTop, marginBottom, rowGap, fontSize, lineHeight, fontWeight }`, todos `number` em px exceto `fontWeight` (`number`) — lança quando o seletor casa com zero ou mais de um nó;
  - `linhasMarkdown(medidas)` — `string`, a tabela comparativa.

- [ ] **Step 1: Escrever o teste das partes puras**

Criar `scripts/qa/lib/espacamento.test.mjs`:

```js
import { describe, expect, it } from 'vitest'
import { NOS, linhasMarkdown } from './espacamento.mjs'

describe('NOS', () => {
  it('dá nome único a cada nó medido', () => {
    const nomes = NOS.map((no) => no.nome)
    expect(new Set(nomes).size).toBe(nomes.length)
  })

  it('dá seletor de referência e de clone a todo nó', () => {
    for (const no of NOS) {
      expect(no.referencia, no.nome).toBeTruthy()
      expect(no.clone, no.nome).toBeTruthy()
    }
  })
})

describe('linhasMarkdown', () => {
  it('põe referência, clone e delta na mesma linha', () => {
    const markdown = linhasMarkdown([
      {
        nome: 'hero.corpo',
        largura: 375,
        referencia: { height: 173, marginTop: 45 },
        clone: { height: 115, marginTop: 32 },
      },
    ])
    expect(markdown).toContain('hero.corpo')
    expect(markdown).toContain('173')
    expect(markdown).toContain('115')
    expect(markdown).toContain('-58')
  })

  it('marca ausência sem inventar zero', () => {
    const markdown = linhasMarkdown([
      { nome: 'x', largura: 375, referencia: null, clone: { height: 10 } },
    ])
    expect(markdown).toContain('ausente')
    expect(markdown).not.toContain('-10')
  })
})
```

- [ ] **Step 2: Rodar o teste e ver falhar**

```bash
pnpm test scripts/qa/lib/espacamento.test.mjs
```

Esperado: FAIL com `Failed to load ./espacamento.mjs` — o módulo ainda não existe.

- [ ] **Step 3: Escrever o módulo**

Criar `scripts/qa/lib/espacamento.mjs`:

```js
// Ferramenta de QA: roda em Node, nunca entra no bundle da aplicação.
/// <reference lib="dom" />

/** @typedef {{ nome: string, referencia: string, clone: string }} No */

/**
 * Pares de seletor, um por nó medido. A lista é congelada na Task 5, depois
 * de conferir na referência que cada seletor casa com exatamente um nó.
 *
 * Por que par explícito e não heurística: `extract-styles.mjs:68` usa
 * `section.querySelector(selector)` e alcança o nó-eco que o Divi duplica
 * (`D-16`). Aqui o seletor é nomeado, e `medirNo` reprova ambiguidade.
 * @type {No[]}
 */
export const NOS = []

/** @typedef {Record<string, number>} Medida */

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} seletor
 * @returns {Promise<Medida>}
 */
export async function medirNo(page, seletor) {
  return await page.evaluate((alvo) => {
    const nos = document.querySelectorAll(alvo)
    if (nos.length !== 1) {
      throw new Error(`seletor casa com ${nos.length} nós: ${alvo}`)
    }
    const no = nos[0]
    const caixa = no.getBoundingClientRect()
    const estilo = getComputedStyle(no)
    const px = (valor) => Number.parseFloat(valor) || 0
    return {
      height: caixa.height,
      top: caixa.top + window.scrollY,
      bottom: caixa.bottom + window.scrollY,
      paddingTop: px(estilo.paddingTop),
      paddingBottom: px(estilo.paddingBottom),
      marginTop: px(estilo.marginTop),
      marginBottom: px(estilo.marginBottom),
      rowGap: px(estilo.rowGap),
      fontSize: px(estilo.fontSize),
      lineHeight: px(estilo.lineHeight),
      fontWeight: px(estilo.fontWeight),
    }
  }, seletor)
}

/**
 * @param {Array<{ nome: string, largura: number, referencia: Medida | null, clone: Medida | null }>} medidas
 * @returns {string}
 */
export function linhasMarkdown(medidas) {
  const cabecalho =
    '| nó | largura | propriedade | referência | clone | delta |\n' +
    '| --- | --- | --- | --- | --- | --- |'
  const linhas = []
  for (const { nome, largura, referencia, clone } of medidas) {
    if (!referencia || !clone) {
      const lado = referencia ? 'clone' : 'referência'
      linhas.push(
        `| \`${nome}\` | ${largura} | — | — | — | ausente na ${lado} |`,
      )
      continue
    }
    for (const propriedade of Object.keys(referencia)) {
      const a = referencia[propriedade] ?? 0
      const b = clone[propriedade] ?? 0
      if (a === b) continue
      const delta = Math.round((b - a) * 100) / 100
      linhas.push(
        `| \`${nome}\` | ${largura} | ${propriedade} | ${a} | ${b} | ${delta > 0 ? '+' : ''}${delta} |`,
      )
    }
  }
  return [cabecalho, ...linhas].join('\n')
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

```bash
pnpm test scripts/qa/lib/espacamento.test.mjs
```

Esperado: 4 passed.

- [ ] **Step 5: Escrever o runner**

Criar `scripts/qa/medir-espacamento.mjs`:

```js
// Mede referência e clone nó a nó, nas quatro larguras do inventário, e grava
// a evidência que autoriza cada correção de espaçamento do bloco.
//
// Uso: `pnpm qa:espacamento`. O clone precisa estar servido em
// http://localhost:5184 (`pnpm build && pnpm preview --port 5184`).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { SITE_URL, VIEWPORTS } from '../inventario/lib/site.mjs'
import { NOS, linhasMarkdown, medirNo } from './lib/espacamento.mjs'

const CLONE_URL = process.env.CLONE_URL ?? 'http://localhost:5184/'
const OUT_DIR = 'docs/qa/paridade/2026-08-30'

if (NOS.length === 0) {
  throw new Error('NOS está vazia: congele a lista de seletores antes de medir')
}

mkdirSync(OUT_DIR, { recursive: true })

const browser = await chromium.launch()
const medidas = []

try {
  for (const viewport of VIEWPORTS) {
    for (const [alvo, url] of [
      ['referencia', SITE_URL],
      ['clone', CLONE_URL],
    ]) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      })
      await page.goto(url, { waitUntil: 'load', timeout: 60_000 })
      // Fonte carregada antes de medir: `font-display: swap` mede o fallback
      // se a medição chegar primeiro, e todo delta de linha ficaria errado.
      await page.evaluate(() => document.fonts.ready)
      for (const no of NOS) {
        const seletor = alvo === 'referencia' ? no.referencia : no.clone
        const medida = await medirNo(page, seletor).catch((erro) => {
          console.error(`${alvo} ${viewport.name} ${no.nome}: ${erro.message}`)
          return null
        })
        const existente = medidas.find(
          (linha) => linha.nome === no.nome && linha.largura === viewport.width,
        )
        if (existente) existente[alvo] = medida
        else
          medidas.push({
            nome: no.nome,
            largura: viewport.width,
            referencia: alvo === 'referencia' ? medida : null,
            clone: alvo === 'clone' ? medida : null,
          })
      }
      await page.close()
    }
  }
} finally {
  await browser.close()
}

writeFileSync(
  join(OUT_DIR, 'espacamento.json'),
  `${JSON.stringify({ capturadoEm: new Date().toISOString(), medidas }, null, 2)}\n`,
)
writeFileSync(
  join(OUT_DIR, 'espacamento.md'),
  `# Medição de espaçamento — ${SITE_URL} × clone\n\n${linhasMarkdown(medidas)}\n`,
)
console.log(join(OUT_DIR, 'espacamento.md'))
```

- [ ] **Step 6: Registrar o script no `package.json`**

No bloco `scripts`, logo depois de `"qa:perf"`:

```json
    "qa:espacamento": "node scripts/qa/medir-espacamento.mjs",
```

- [ ] **Step 7: Provar que o runner recusa lista vazia**

```bash
pnpm qa:espacamento
```

Esperado: erro `NOS está vazia: congele a lista de seletores antes de medir`, exit diferente de 0. É o comportamento correto nesta task — a lista nasce na Task 5.

- [ ] **Step 8: Rodar os gates estáticos e commitar**

```bash
pnpm typecheck && pnpm lint && pnpm test
git add scripts/qa/lib/espacamento.mjs scripts/qa/lib/espacamento.test.mjs scripts/qa/medir-espacamento.mjs package.json
git commit -m "feat(paridade): medir espaçamento nó a nó contra a referência

Par de seletor explícito por nó, e medirNo reprova seletor que casa com
zero ou com mais de um nó — a heurística de extract-styles.mjs:68 alcança
o nó-eco do Divi (D-16) e não serve aqui. Lista de nós entra na task
seguinte, depois de conferida contra a referência."
```

---

### Task 5: Congelar a lista de nós e medir

**Files:**

- Modify: `scripts/qa/lib/espacamento.mjs` (preencher `NOS`)
- Create: `docs/qa/paridade/2026-08-30/espacamento.json`, `docs/qa/paridade/2026-08-30/espacamento.md`

**Interfaces:**

- Consumes: `NOS`, `medirNo`, `linhasMarkdown` da Task 4.
- Produces: a evidência que as Tasks 6 a 9 citam linha a linha; e a resposta sobre a premissa de D4 (o texto institucional está mesmo quebrado em `<p>` na referência?).

- [ ] **Step 1: Descobrir os seletores na referência**

Subir o clone em `http://localhost:5184` (`pnpm build && pnpm preview --port 5184 --strictPort`) e abrir a referência com o Playwright para conferir unicidade. Para cada candidato, medir a contagem nas duas pontas:

```bash
node --input-type=module -e "
import { chromium } from '@playwright/test'
const alvos = ['#Intrucción', '#Somos', '#Cursos', '#Contacto', '#main-footer']
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
await page.goto('https://lotusotec.cl/', { waitUntil: 'load' })
for (const alvo of alvos) {
  console.log(alvo, await page.locator(alvo).count())
}
await browser.close()
"
```

O Divi duplica menu e alguns blocos de texto (`hero.title_subtitle_echo` em `02-conteudo.md`), então contagem `2` é esperada em vários candidatos: nesse caso descer o seletor até o nó pintado, não aceitar o primeiro.

- [ ] **Step 2: Congelar a lista**

Preencher `NOS` em `scripts/qa/lib/espacamento.mjs` com um par por nó. A lista mínima, derivada da tabela de resíduo de `docs/qa/paridade/2026-08-29/classificacao.md:31-43`, cobre as seis áreas:

```js
export const NOS = [
  { nome: 'hero.secao', referencia: '#Intrucción', clone: '#Intrucción' },
  {
    nome: 'hero.kicker',
    referencia: '<preencher>',
    clone: '#Intrucción > div > p:first-of-type',
  },
  { nome: 'hero.titulo', referencia: '<preencher>', clone: '#hero-heading' },
  { nome: 'hero.subtitulo', referencia: '<preencher>', clone: '<preencher>' },
  { nome: 'hero.corpo', referencia: '<preencher>', clone: '<preencher>' },
  { nome: 'hero.cta', referencia: '<preencher>', clone: '<preencher>' },
  { nome: 'institucional.secao', referencia: '#Somos', clone: '#Somos' },
  {
    nome: 'institucional.corpo',
    referencia: '<preencher>',
    clone: '<preencher>',
  },
  {
    nome: 'destaque.primeiro.card',
    referencia: '<preencher>',
    clone: '<preencher>',
  },
  {
    nome: 'destaque.primeiro.titulo',
    referencia: '<preencher>',
    clone: '<preencher>',
  },
  {
    nome: 'destaque.primeiro.corpo',
    referencia: '<preencher>',
    clone: '<preencher>',
  },
  { nome: 'cursos.secao', referencia: '#Cursos', clone: '#Cursos' },
  { nome: 'cursos.linha', referencia: '<preencher>', clone: '<preencher>' },
  {
    nome: 'cursos.primeiro.card',
    referencia: '<preencher>',
    clone: '<preencher>',
  },
  { nome: 'contacto.secao', referencia: '#Contacto', clone: '#Contacto' },
  { nome: 'contacto.linha', referencia: '<preencher>', clone: '<preencher>' },
  {
    nome: 'rodape.copyright',
    referencia: '#footer-info',
    clone: '<preencher>',
  },
]
```

Cada `<preencher>` vira o seletor conferido no Step 1. Nenhum fica no arquivo commitado: `medirNo` lançaria, e o teste da Task 4 exige `referencia` e `clone` truthy.

- [ ] **Step 3: Medir a estrutura do parágrafo institucional**

A premissa de D4 é que a referência quebra o texto institucional em `<p>` separados. `docs/inventario/dom.json` guarda esse texto como um bloco único, então a premissa **não está provada** — provar aqui:

```bash
node --input-type=module -e "
import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
await page.goto('https://lotusotec.cl/', { waitUntil: 'load' })
const paragrafos = await page.evaluate(() =>
  [...document.querySelectorAll('#Somos p')].map((no) => ({
    texto: no.textContent?.trim().slice(0, 60),
    height: no.getBoundingClientRect().height,
    marginBottom: getComputedStyle(no).marginBottom,
  })),
)
console.log(JSON.stringify(paragrafos, null, 2))
await browser.close()
"
```

Três desfechos:

1. **Vários `<p>` com o texto institucional repartido** — premissa confirmada, D4 segue como escrito e o ponto de corte é o mostrado aqui.
2. **Um `<p>` só, e os 19px vêm de outra coisa** (`<br>`, `margin` de um irmão) — D4 perde a premissa. **Parar e devolver a João**, com esta saída anexada: dividir o conteúdo deixaria de reproduzir a referência, que é o oposto do objetivo.
3. **Vários `<p>`, mas incluindo os dos destaques** — separar por ancestral antes de concluir; `#Somos p` alcança as duas linhas da seção.

Registrar o desfecho no corpo de `docs/qa/paridade/2026-08-30/espacamento.md`.

- [ ] **Step 4: Rodar a medição**

Com o clone servido em `http://localhost:5184`:

```bash
pnpm qa:espacamento
```

Esperado: caminho do markdown na saída, sem linha `ausente` e sem erro de seletor ambíguo no stderr. Erro de seletor volta ao Step 1 — não seguir com nó não medido.

- [ ] **Step 5: Conferir contradição com o inventário**

`docs/inventario/05-layout.md` registra calha de `59.39px` (a `--spacing-gutter` que `Row` usa); a rodada de 2026-08-29 mediu `30px` entre os cards de curso. Comparar com o que `espacamento.md` traz agora.

Se a medição contradisser evidência versionada, **não sobrescrever o inventário**: escrever as duas leituras e a consequência de seguir cada uma numa seção `## Divergência entre medições` de `espacamento.md`, e levar a João (D9 da spec).

- [ ] **Step 6: Formatar e commitar**

```bash
pnpm format
pnpm typecheck && pnpm lint && pnpm test
git add scripts/qa/lib/espacamento.mjs docs/qa/paridade/2026-08-30
git commit -m "chore(paridade): medir referência e clone nó a nó nas quatro larguras

Lista de nós congelada depois de conferir unicidade de cada seletor na
referência. A evidência em docs/qa/paridade/2026-08-30/espacamento.md é o
que autoriza cada correção das tasks seguintes."
```

---

### Task 6: Espaçamento vertical do hero

Medido em 375 na review de 2026-08-29: hero da referência `774px` contra `625px` do clone. Causa nomeada: margens verticais de `45/40/50px` entre kicker, `h1`, corpo e CTA, contra `32px` (`mt-8`) no clone.

**Files:**

- Modify: `src/components/sections/Hero.tsx:17-45`
- Modify: `src/index.css` (só se algum valor se repetir; ver Step 3)
- Test: `src/components/sections/Hero.test.tsx`

**Interfaces:**

- Consumes: `docs/qa/paridade/2026-08-30/espacamento.md`, linhas `hero.*`.
- Produces: nenhuma API nova. `Hero` mantém o mesmo contrato de props (nenhuma).

- [ ] **Step 1: Ler os valores medidos**

```bash
grep '`hero\.' docs/qa/paridade/2026-08-30/espacamento.md
```

Anotar, por largura, `marginTop`/`marginBottom` de `hero.kicker`, `hero.titulo`, `hero.subtitulo`, `hero.corpo` e `hero.cta` na referência. **Todo valor aplicado no Step 3 precisa aparecer nessa saída.**

- [ ] **Step 2: Escrever o teste da margem**

Em `src/components/sections/Hero.test.tsx`, acrescentar — trocando `45`, `40` e `50` pelos números realmente medidos no Step 1:

```tsx
it('reproduz as margens verticais medidas na referência', () => {
  const { container } = render(<Hero />)
  const kicker = container.querySelector('#Intrucción p')
  const corpo =
    container.querySelector('#hero-heading')?.parentElement?.nextElementSibling
  expect(kicker?.className).toContain('mb-[45px]')
  expect(corpo?.className).toContain('mt-[40px]')
  expect(corpo?.nextElementSibling?.className).toContain('mt-[50px]')
})
```

O teste afirma classe, não pixel: jsdom não faz layout e `getComputedStyle` devolveria vazio para utilitário Tailwind. A prova em pixel é a rodada de paridade da Task 11.

- [ ] **Step 3: Rodar o teste e ver falhar**

```bash
pnpm test src/components/sections/Hero.test.tsx
```

Esperado: FAIL, porque hoje o corpo usa `mt-8` e o kicker não tem margem.

- [ ] **Step 4: Aplicar as margens medidas**

Em `src/components/sections/Hero.tsx`, trocar as classes de margem pelos valores da medição. Valor que aparecer em duas ou mais seções vira token em `:root` de `src/index.css` (regra de `.claude/rules/frontend.md`); valor de uso único fica no componente como valor arbitrário, no padrão que o arquivo já usa (`px-[8vw]`, `py-[10vw]`).

Não mudar `pr-hero-inset`, `text-*`, cor nem estrutura — só margem vertical.

- [ ] **Step 5: Rodar os testes e ver passar**

```bash
pnpm test src/components/sections/Hero.test.tsx src/app/App.test.tsx
```

Esperado: todos passed.

- [ ] **Step 6: Conferir que a quebra do `h1` não mudou**

`docs/inventario/05-layout.md` documenta que `LOTUS OTEC` quebra em duas linhas em 375 e 1440 e fica em uma em 768 e 1920, e `--spacing-hero-inset: 103px` é a reserva medida que produz isso. Com o peso 700 real, o glifo é mais largo e a quebra pode mudar.

```bash
pnpm build && pnpm preview --port 5184 --strictPort &
node --input-type=module -e "
import { chromium } from '@playwright/test'
const browser = await chromium.launch()
for (const width of [375, 768, 1440, 1920]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto('http://localhost:5184/', { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  const caixa = await page.locator('#hero-heading').boundingBox()
  console.log(width, 'altura do h1:', caixa?.height)
  await page.close()
}
await browser.close()
"
```

Altura de ~78px é uma linha; ~156px são duas. Se o padrão divergir de 375=2, 768=1, 1440=2, 1920=1, isso é divergência nova: **não ajustar `--spacing-hero-inset` para compensar** — registrar e levar a João (D9).

- [ ] **Step 7: Commitar**

```bash
git add src/components/sections/Hero.tsx src/components/sections/Hero.test.tsx src/index.css
git commit -m "fix(paridade): reproduzir as margens verticais do hero

Valores medidos em docs/qa/paridade/2026-08-30/espacamento.md: as margens
entre kicker, h1, corpo e CTA da referência não são o mt-8 uniforme que o
clone usava."
```

---

### Task 7: Parágrafos do texto institucional

Decisão D4 da spec: `site.institucional.body` vira lista de parágrafos, texto verbatim. Depende do desfecho 1 do Step 3 da Task 5 — se a premissa não se confirmou, esta task não roda.

**Files:**

- Modify: `src/content/site.ts:29-32`
- Modify: `src/components/sections/QuienesSomos.tsx:18-20`
- Modify: `src/components/sections/QuienesSomos.test.tsx:10-13`
- Modify: `src/app/App.test.tsx:25`
- Modify: `src/content/site.test.ts`

**Interfaces:**

- Consumes: o ponto de corte medido na Task 5.
- Produces: `site.institucional.body` passa de `string` para `readonly string[]`. Quem consome hoje: `QuienesSomos.tsx:19`, `QuienesSomos.test.tsx:12`, `App.test.tsx:25` — nenhum outro (`grep -rn "institucional.body" src/`).

- [ ] **Step 1: Confirmar os consumidores**

```bash
grep -rn "institucional.body" src/ e2e/ index.html
```

Esperado: exatamente as três ocorrências acima. Ocorrência a mais entra no escopo desta task.

- [ ] **Step 2: Atualizar os testes primeiro**

Em `src/components/sections/QuienesSomos.test.tsx`, trocar o primeiro caso:

```tsx
it('renderiza cada parágrafo institucional verbatim', () => {
  render(<QuienesSomos />)
  for (const paragrafo of site.institucional.body) {
    expect(screen.getByText(paragrafo)).toBeTruthy()
  }
})

it('quebra o corpo institucional na contagem medida na referência', () => {
  const { container } = render(<QuienesSomos />)
  expect(container.querySelectorAll('p')).toHaveLength(
    site.institucional.body.length,
  )
})
```

Em `src/app/App.test.tsx:25`, trocar a asserção única por:

```tsx
for (const paragrafo of site.institucional.body) {
  expect(screen.getByText(paragrafo)).toBeTruthy()
}
```

- [ ] **Step 3: Rodar e ver falhar**

```bash
pnpm test src/components/sections/QuienesSomos.test.tsx src/app/App.test.tsx
```

Esperado: FAIL — `site.institucional.body` ainda é `string`, então o `for…of` itera caractere a caractere e `getByText` não acha.

- [ ] **Step 4: Repartir o conteúdo**

Em `src/content/site.ts`, trocar a string por array. O corte é o medido na Task 5 — o exemplo abaixo usa a fronteira entre as duas frases, que é o candidato provável, mas **o valor que vale é o da medição**:

```ts
  institucional: {
    // A referência publica o texto em `<p>` separados, com ~19px entre eles
    // (medido em docs/qa/paridade/2026-08-30/espacamento.md). O texto é o
    // mesmo, verbatim: só a fronteira entre parágrafos é reproduzida.
    body: [
      'En LOTUS OTEC tenemos una oferta especializada en satisfacer las necesidades de capacitación de la industria eléctrica.',
      'Somos expertos en las áreas de Seguridad, Entrenamiento y Certificación en métodos de trabajo con líneas energizadas a contacto, distancia y a potencial.',
    ],
    logoAlt: 'Logotipo de LOTUS OTEC',
  },
```

A catraca de que nenhuma palavra mudou vira teste permanente, não conferência manual. Em `src/content/site.test.ts`, acrescentar:

```ts
it('reparte o corpo institucional sem alterar uma letra do original', () => {
  // Verbatim de `docs/inventario/02-conteudo.md`, como estava até 2026-08-30
  // numa string só. O corte em parágrafos reproduz a estrutura da referência
  // (D4); o texto é o mesmo.
  const original =
    'En LOTUS OTEC tenemos una oferta especializada en satisfacer las necesidades de capacitación de la industria eléctrica. Somos expertos en las áreas de Seguridad, Entrenamiento y Certificación en métodos de trabajo con líneas energizadas a contacto, distancia y a potencial.'
  expect(site.institucional.body.join(' ')).toBe(original)
})
```

```bash
pnpm test src/content/site.test.ts
```

Esperado: passed. FAIL significa que uma palavra, pontuação ou caixa mudou no corte — corrigir antes de seguir.

- [ ] **Step 5: Renderizar um `<p>` por parágrafo**

Em `src/components/sections/QuienesSomos.tsx`, trocar o parágrafo único. O espaçamento entre parágrafos usa o valor medido (o exemplo mostra `19px`; usar o da medição):

```tsx
<div>
  {site.institucional.body.map((paragrafo) => (
    <p
      key={paragrafo}
      className="font-sans text-lead font-medium text-body-ink not-last:mb-4.75"
    >
      {paragrafo}
    </p>
  ))}
</div>
```

O `<div>` mantém a segunda coluna do grid como um filho só — sem ele, cada `<p>` viraria célula da grade e a linha de `320px_700px` quebraria.

- [ ] **Step 6: Rodar e ver passar**

```bash
pnpm test src/components/sections/QuienesSomos.test.tsx src/app/App.test.tsx src/content/site.test.ts
```

Esperado: todos passed.

- [ ] **Step 7: Rodar os gates estáticos**

```bash
pnpm typecheck && pnpm lint
```

`noUncheckedIndexedAccess` está ligado: se algum consumidor indexar `body[0]`, o tipo vem `string | undefined` e o build reprova. Corrigir no consumidor, nunca com cast.

- [ ] **Step 8: Commitar**

```bash
git add src/content/site.ts src/content/site.test.ts src/components/sections/QuienesSomos.tsx src/components/sections/QuienesSomos.test.tsx src/app/App.test.tsx
git commit -m "fix(paridade): publicar o texto institucional em parágrafos

A referência quebra o corpo de #Somos em <p> separados; o clone tinha um
bloco só. Texto verbatim, só a fronteira entre parágrafos muda (D4)."
```

---

### Task 8: Padding dos cards de destaque

Medido: a referência tem `padding: 30px` nos quatro lados do card e `padding-bottom: 10px` no título; o clone não tem padding e usa `mt-4` no título. Dos `-96px` por card, `-26px` vêm do bloco de ícone (`lucide-react` 48px contra glifo `ETmodules` 60px com `margin-bottom: 30px`) e **não são corrigidos** — é divergência intencional aprovada em 2026-08-25 (D8 da spec).

**Files:**

- Modify: `src/components/sections/Destaques.tsx:15-30`
- Test: `src/components/sections/Destaques.test.tsx`

**Interfaces:**

- Consumes: linhas `destaque.*` de `docs/qa/paridade/2026-08-30/espacamento.md`.
- Produces: nenhuma API nova.

- [ ] **Step 1: Ler os valores medidos**

```bash
grep '`destaque\.' docs/qa/paridade/2026-08-30/espacamento.md
```

- [ ] **Step 2: Escrever o teste**

Em `src/components/sections/Destaques.test.tsx`, acrescentar (ajustando os números aos medidos):

```tsx
it('reproduz o padding do card e do título medidos na referência', () => {
  const { container } = render(<Destaques />)
  // `render(<Destaques />)` monta só a `Row`, então `div.text-center` casa
  // exatamente com os três cards.
  const cards = container.querySelectorAll('div.text-center')
  expect(cards).toHaveLength(3)
  const primeiro = cards[0]
  expect(primeiro?.className).toContain('p-[30px]')
  expect(primeiro?.querySelector('h2')?.className).toContain('pb-[10px]')
})
```

- [ ] **Step 3: Rodar e ver falhar**

```bash
pnpm test src/components/sections/Destaques.test.tsx
```

Esperado: FAIL — o card não tem `p-[30px]` e o `h2` não tem `pb-[10px]`.

- [ ] **Step 4: Aplicar padding e espaçamento**

Em `src/components/sections/Destaques.tsx`, acrescentar o padding do card e o do título, com os valores medidos. Manter `size={48}` do ícone e o comentário que explica a divergência — o bloco de ícone não é ajustado nesta task.

- [ ] **Step 5: Rodar e ver passar**

```bash
pnpm test src/components/sections/Destaques.test.tsx src/app/App.test.tsx
```

- [ ] **Step 6: Commitar**

```bash
git add src/components/sections/Destaques.tsx src/components/sections/Destaques.test.tsx
git commit -m "fix(paridade): reproduzir o padding dos cards de destaque

30px no card e 10px sob o título, medidos na referência. O bloco de ícone
segue 26px mais curto: é a divergência lucide-react aprovada em 2026-08-25,
declarada na matriz e fora do escopo desta correção."
```

---

### Task 9: Espaçamento de cursos, contacto e rodapé

Medido em 375: cursos `1630` contra `1559` (padding da linha `30px` contra `27px`, espaço entre cards `30px` contra `59px`), contacto `1010` contra `943`, rodapé `78` contra `68` (container do copyright `58px` contra `48px`).

**Files:**

- Modify: `src/components/sections/Cursos.tsx:15-53`
- Modify: `src/components/sections/Contacto.tsx:19-40`
- Modify: `src/components/layout/Footer.tsx:11-15`
- Modify: `src/index.css` (token de espaçamento, se o valor se repetir)
- Test: `src/components/sections/Cursos.test.tsx`, `src/components/sections/Contacto.test.tsx`, `src/components/layout/Footer.test.tsx`

**Interfaces:**

- Consumes: linhas `cursos.*`, `contacto.*` e `rodape.*` de `docs/qa/paridade/2026-08-30/espacamento.md`.
- Produces: nenhuma API nova.

- [ ] **Step 1: Ler os valores medidos**

```bash
grep -E '`(cursos|contacto|rodape)\.' docs/qa/paridade/2026-08-30/espacamento.md
```

- [ ] **Step 2: Decidir o caso da calha**

O clone usa `gap-gutter` (`--spacing-gutter: 59.39px`, vindo de `05-layout.md`) na grade de cursos, e a medição de 2026-08-29 apontou `30px` entre cards. As duas podem descrever linhas diferentes do Divi.

Se `espacamento.md` confirmar `30px` para `cursos.linha`, a grade de cursos passa a usar o valor medido e **`--spacing-gutter` não muda** — a calha da primeira linha de `#Somos` continua sendo o que `05-layout.md` mede. Registrar essa separação em comentário no componente. Se a medição contradisser `05-layout.md` para o **mesmo** nó, parar e levar a João (D9).

- [ ] **Step 3: Escrever os testes**

Um caso por arquivo, afirmando a classe nova. Exemplo para o rodapé, em `src/components/layout/Footer.test.tsx` (número conforme medido):

```tsx
it('reproduz a altura do container do copyright medida na referência', () => {
  const { container } = render(<Footer />)
  expect(container.querySelector('footer')?.className).toContain('pt-[15px]')
  expect(container.querySelector('footer > div')?.className).toContain(
    'py-[5px]',
  )
})
```

Escrever o equivalente para `Cursos` (padding da linha e gap da grade) e `Contacto` (padding da linha e espaçamento entre título, texto e formulário).

- [ ] **Step 4: Rodar e ver falhar**

```bash
pnpm test src/components/sections/Cursos.test.tsx src/components/sections/Contacto.test.tsx src/components/layout/Footer.test.tsx
```

Esperado: três FAIL, um por arquivo.

- [ ] **Step 5: Aplicar os valores**

Trocar `py-6.75`, `px-6`, `h-2.25`, `pt-14.25`, `pb-14.5`, `pb-27.5`, `pt-[15px]`, `pb-1.25` e o `gap-gutter` da grade de cursos pelos valores medidos, um arquivo por vez. Não mexer em cor, tipografia, texto nem estrutura.

- [ ] **Step 6: Rodar e ver passar**

```bash
pnpm test
```

Esperado: toda a suíte unitária verde.

- [ ] **Step 7: Commitar**

```bash
git add src/components/sections/Cursos.tsx src/components/sections/Contacto.tsx src/components/layout/Footer.tsx src/index.css src/components/sections/Cursos.test.tsx src/components/sections/Contacto.test.tsx src/components/layout/Footer.test.tsx
git commit -m "fix(paridade): reproduzir o espaçamento de cursos, contacto e rodapé

Padding das linhas, gap da grade de cursos e container do copyright nos
valores medidos em docs/qa/paridade/2026-08-30/espacamento.md."
```

---

### Task 10: Guarda de regressão observa o build

`e2e/regressao-visual.spec.ts` não declara projeto e cai em `chromium`, que serve `pnpm dev` na porta 5183. A mudança que ele existe para guardar — o `<link rel="preload">` de `scripts/vite/preload-critical.mjs` — só é produzida pelo build, servido pelo projeto `producao` na 5184. Ele prova que o dev server não mudou de pixel: verdadeiro e inútil (`D-25`).

**Files:**

- Modify: `playwright.config.ts:34-59`
- Modify: `e2e/regressao-visual.spec.ts:1-9`
- Delete/recreate: `e2e/regressao-visual.spec.ts-snapshots/`

**Interfaces:**

- Consumes: o pixel final das Tasks 1 a 9.
- Produces: snapshots sob o nome do projeto `producao`, que passam a ser a base de comparação de qualquer bloco futuro.

- [ ] **Step 1: Mover o spec de projeto**

Em `playwright.config.ts`, no projeto `chromium`, estender o `testIgnore` — sem isso o spec roda nos dois projetos, contra dois servidores diferentes:

```ts
      testIgnore: ['**/producao.spec.ts', '**/regressao-visual.spec.ts'],
```

E no projeto `producao`, aceitar os dois specs:

```ts
      testMatch: ['**/producao.spec.ts', '**/regressao-visual.spec.ts'],
```

- [ ] **Step 2: Atualizar o comentário do spec**

Em `e2e/regressao-visual.spec.ts`, substituir o comentário do topo:

```ts
// Guarda de pixel do build de produção. Roda no projeto `producao`
// (`vite preview` na 5184), não no dev server: a mudança que ele guarda — o
// `<link rel="preload">` injetado por `scripts/vite/preload-critical.mjs` —
// só existe no bundle. Rodar no `chromium` provava que o dev server não
// mudou, o que era verdadeiro e insuficiente (`D-25`).
// Não é diff contra o WordPress: as divergências intencionais aprovadas na
// matriz produziriam diferença alta e legítima (D9 do bloco 6.1.1-6.3.1).
```

- [ ] **Step 3: Ver o spec falhar contra o snapshot antigo**

```bash
pnpm e2e --project=producao regressao-visual
```

Esperado: FAIL por snapshot ausente para o projeto novo (`A snapshot doesn't exist at …-producao-linux.png`). É o esperado: nome de projeto entra no nome do arquivo.

- [ ] **Step 4: Apagar os snapshots antigos e regenerar**

```bash
rm -rf e2e/regressao-visual.spec.ts-snapshots
pnpm e2e --project=producao regressao-visual --update-snapshots
ls e2e/regressao-visual.spec.ts-snapshots
```

Esperado: dois arquivos, um por viewport (375 e 1440), com `producao` no nome.

- [ ] **Step 5: Rodar de novo e ver passar**

```bash
pnpm e2e --project=producao regressao-visual
```

Esperado: 2 passed.

- [ ] **Step 6: Provar que a guarda observa o que deve**

```bash
pnpm build
grep -c 'rel="preload"' dist/index.html
```

Esperado: `2`. Confirma que o HTML servido pelo projeto `producao` é o que carrega os preloads — que era exatamente o que a guarda não observava antes.

- [ ] **Step 7: Rodar a suíte inteira**

```bash
pnpm e2e
```

Esperado: exit 0. É a primeira vez desde a Task 1 que a suíte E2E fecha verde.

- [ ] **Step 8: Commitar**

```bash
git add playwright.config.ts e2e/regressao-visual.spec.ts e2e/regressao-visual.spec.ts-snapshots
git commit -m "fix(paridade): apontar a guarda de regressão para o build

O spec rodava no projeto chromium, contra o dev server, e não via o
<link rel=preload> que só o build produz. Passa para o projeto producao,
com snapshots regenerados sobre o pixel corrigido deste bloco (D-25)."
```

---

### Task 11: Rodada de paridade nova

**Files:**

- Modify: `scripts/qa/lib/paridade.mjs:7`
- Modify: `scripts/qa/lib/paridade.test.mjs:40`
- Create: `docs/qa/paridade/2026-08-30/referencia/*.png`, `docs/qa/paridade/2026-08-30/clone/*.png`, `manifest.json`, `contact-sheet.html`

**Interfaces:**

- Consumes: `RUN_DIR`, `STATES`, `writeManifest`, `contactSheetHtml` de `scripts/qa/lib/paridade.mjs`.
- Produces: as capturas pareadas que a Task 12 classifica.

- [ ] **Step 1: Apontar a rodada para a pasta nova**

Em `scripts/qa/lib/paridade.mjs:7`:

```js
export const RUN_DIR = 'docs/qa/paridade/2026-08-30'
```

E em `scripts/qa/lib/paridade.test.mjs:40`:

```js
expect(RUN_DIR).toBe('docs/qa/paridade/2026-08-30')
```

Mudar só a constante deixa o teste vermelho; mudar só o teste faz a rodada gravar por cima da anterior. Os dois andam juntos.

- [ ] **Step 2: Rodar o teste**

```bash
pnpm test scripts/qa/lib/paridade.test.mjs
```

Esperado: todos passed.

- [ ] **Step 3: Congelar a referência**

```bash
pnpm qa:referencia
```

Esperado: cinco nomes na saída (`home-375.png`, `home-375-menu.png`, `home-768.png`, `home-1440.png`, `home-1920.png`).

- [ ] **Step 4: Capturar o clone nas mesmas condições**

Com o build servido em `http://localhost:5184` (`pnpm build && pnpm preview --port 5184 --strictPort`):

```bash
pnpm qa:clone
pnpm qa:contact-sheet
```

Esperado: cinco PNG em `clone/`, mais `contact-sheet.html`.

- [ ] **Step 5: Medir a altura das duas pontas**

```bash
node --input-type=module -e "
import { chromium } from '@playwright/test'
const browser = await chromium.launch()
for (const [nome, url] of [['referência','https://lotusotec.cl/'],['clone','http://localhost:5184/']]) {
  for (const width of [375, 768, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto(url, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    const altura = await page.evaluate(() => document.body.scrollHeight)
    console.log(nome, width, altura)
    await page.close()
  }
}
await browser.close()
"
```

Anotar os oito números: são o resíduo de `D-24` depois das correções, e entram na classificação da Task 12. Comparar com a linha de base de 2026-08-29 (referência 5467/4913/3441/3409 contra clone 4902/4818/3109/3105).

- [ ] **Step 6: Formatar e commitar**

```bash
pnpm format
git add scripts/qa/lib/paridade.mjs scripts/qa/lib/paridade.test.mjs docs/qa/paridade/2026-08-30
git commit -m "chore(paridade): capturar a rodada de paridade de 2026-08-30

Referência e clone nos mesmos cinco estados, com manifest e sha256 por
arquivo, sobre o pixel corrigido deste bloco."
```

---

### Task 12: Classificar o resíduo e pedir ratificação

**Files:**

- Create: `docs/qa/paridade/2026-08-30/classificacao.md`

**Interfaces:**

- Consumes: `espacamento.md` (Task 5), as capturas e as alturas (Task 11).
- Produces: a lista que João ratifica, e os números que a matriz cita na Task 13.

- [ ] **Step 1: Escrever a classificação**

Seguir a forma de `docs/qa/paridade/2026-08-29/classificacao.md`: cabeçalho com a advertência de que comparar contact-sheet a olho não decide diferença sutil, tabela com `#`, estado, categoria, diferença observada, decisão e referência na matriz. Categorias `layout`, `tipografia`, `spacing`, `asset`, `responsive`; decisões `fiel`, `divergência intencional`, `corrigir`.

Seções obrigatórias:

1. **`## Resíduo de altura depois das correções`** — os oito números do Step 5 da Task 11, o delta por largura, e a atribuição por seção. Nenhuma linha pode ficar como "não classificável": foi exatamente isso que a review de 2026-08-29 reprovou.
2. **`## Peso real das fontes`** — o que mudou visualmente ao dar glifo próprio a cada peso, com os `sha256` novos.
3. **`## Divergência entre medições`**, se a Task 5 tiver encontrado alguma.

- [ ] **Step 2: Apresentar a lista a João**

Mandar no chat o resumo: cada diferença que sobrou, sua categoria e a decisão proposta, mais o resíduo de altura por largura. Perguntar explicitamente se ratifica.

Não seguir sem resposta. É a mesma forma da decisão D2 do bloco `6.1.1-6.3.1`: ratificação de lista, não leitura par a par.

- [ ] **Step 3: Registrar a ratificação**

Acrescentar ao fim de `classificacao.md` uma seção `## Ratificação (D7)` com a data e hora ISO da resposta de João, a pergunta feita e a resposta recebida, verbatim.

- [ ] **Step 4: Formatar e commitar**

```bash
pnpm format
git add docs/qa/paridade/2026-08-30/classificacao.md
git commit -m "docs(paridade): classificar o resíduo da rodada de 2026-08-30

Resíduo de altura atribuído por seção, sem linha não classificável, e
ratificação de João registrada com data e hora."
```

---

### Task 13: Matriz, homologação e backlog

**Files:**

- Modify: `docs/inventario/README.md` (linhas "Altura vertical das seções", "Institucional", e linha nova de peso de fonte)
- Modify: `docs/qa/homologacao-2026-08-29.md` (adendo)
- Modify: `docs/superpowers/backlog.md` (`D-23`, `D-24`, `D-25`, `D-26`)

**Interfaces:**

- Consumes: `classificacao.md` ratificada (Task 12).
- Produces: matriz sem `pendente decisão` e débitos fechados com data.

- [ ] **Step 1: Atualizar a linha da altura vertical**

Em `docs/inventario/README.md:47`, trocar a decisão `pendente decisão` pela decisão ratificada e substituir a justificativa pelos números da rodada nova, citando `docs/qa/paridade/2026-08-30/classificacao.md`. Se sobrou resíduo, ele aparece aqui como `divergência intencional` com o número medido e a causa (bloco de ícone dos destaques), nunca como pendência.

- [ ] **Step 2: Atualizar a linha Institucional**

Em `docs/inventario/README.md:40`, acrescentar à justificativa que o corpo passou a ser publicado em parágrafos separados, reproduzindo a estrutura da referência (D4), com o ponto de corte medido.

- [ ] **Step 3: Criar a linha do peso de fonte (`D-26`)**

Acrescentar à matriz:

```markdown
| Peso real das fontes self-hosted | (tipografia global) | `fiel` | as cinco faces de `src/assets/fonts/` passaram a ter arquivo próprio por peso em 2026-08-30; até então `montserrat-400/500/700` eram bytes idênticos e `open-sans-500/600` também, e nenhum texto `font-bold`/`font-semibold` renderizava com glifo mais pesado (`D-23`). `scripts/inventario/fontes.test.mjs` reprova a regressão |
```

- [ ] **Step 4: Escrever o adendo de homologação**

Ao fim de `docs/qa/homologacao-2026-08-29.md`, acrescentar:

```markdown
## Adendo de 2026-08-30 — bloco `paridade-espacamento-fontes`

Quatro das ressalvas desta homologação foram fechadas: `D-23` (peso de fonte sem arquivo próprio), `D-24` (altura vertical das seções), `D-25` (guarda de regressão apontada para o dev server) e `D-26` (peso de fonte sem linha na matriz). Evidência: `docs/qa/paridade/2026-08-30/`. As ressalvas `D-17`, `D-21` e `D-22` continuam abertas.
```

- [ ] **Step 5: Fechar os débitos no backlog**

Em `docs/superpowers/backlog.md`, marcar `D-23`, `D-24`, `D-25` e `D-26` como fechados por este bloco, com a data e o caminho da evidência — a mesma forma usada em `D-10`, `D-11` e `D-14`. `D-16` continua aberto: acrescentar uma linha dizendo que o bloco `paridade-espacamento-fontes` evitou o defeito por construção (`espacamento.mjs` usa seletor explícito) sem corrigi-lo em `extract-styles.mjs`.

- [ ] **Step 6: Formatar e commitar**

```bash
pnpm format
pnpm agent:check
git add docs/inventario/README.md docs/qa/homologacao-2026-08-29.md docs/superpowers/backlog.md
git commit -m "docs(paridade): fechar D-23, D-24, D-25 e D-26 na matriz e no backlog

A linha de altura vertical sai de pendente decisão, o peso real das fontes
ganha linha própria, e a homologação de 6.3.1 perde quatro ressalvas."
```

---

### Task 14: Gates completos

**Files:** nenhum, exceto correção que os gates exigirem.

- [ ] **Step 1: Rodar o gate de qualidade**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24
pnpm check
```

Esperado: exit 0. Registrar a saída real: contagem de arquivos, contagem de testes, tempo de build.

- [ ] **Step 2: Rodar o E2E completo**

```bash
pnpm e2e
```

Esperado: exit 0, com os cinco projetos (`chromium`, `firefox`, `webkit`, `mobile-webkit`, `producao`).

- [ ] **Step 3: Conferir que nenhuma dependência entrou**

```bash
git diff main..HEAD --stat -- package.json pnpm-lock.yaml
```

Esperado: `pnpm-lock.yaml` ausente do diff, e `package.json` com uma linha a mais, a do script `qa:espacamento`.

- [ ] **Step 4: Conferir que o texto não mudou**

```bash
git diff main..HEAD -- src/content/site.ts
```

Esperado: o diff mostra a mudança de `string` para array, e as strings resultantes concatenam de volta ao original. Palavra, pontuação ou caixa diferentes reprovam.

- [ ] **Step 5: Conferir o valor de cada correção contra a medição**

Para cada valor de espaçamento tocado nas Tasks 6 a 9, achar a linha correspondente em `docs/qa/paridade/2026-08-30/espacamento.md`. Valor sem linha correspondente sai do código ou ganha medição — é o critério de aceite 3 da spec.

- [ ] **Step 6: Commitar o que os gates exigirem**

Se algum gate pedir correção, ela vira commit próprio com escopo `paridade`, nunca emenda a commit anterior.

---

## Encerramento

O bloco fica pronto para `/revisar-site paridade-espacamento-fontes`. A revisão é do Codex (reviewer declarado), sobre `main..HEAD`.

Estado ao fim da Task 14: `workflow_state: ready_for_review`, `executor: claude`, `reviewer: codex`, `reviewer_exception: null`.

## Handoff de execução

executor: claude
reviewer: codex
paths_autorizados:

- `src/assets/fonts/**`
- `src/index.css`
- `src/content/site.ts`
- `src/components/sections/Hero.tsx`
- `src/components/sections/QuienesSomos.tsx`
- `src/components/sections/Destaques.tsx`
- `src/components/sections/Cursos.tsx`
- `src/components/sections/Contacto.tsx`
- `src/components/layout/Footer.tsx`
- `src/**/*.test.ts`, `src/**/*.test.tsx`
- `scripts/qa/**`
- `scripts/inventario/fontes.test.mjs`
- `scripts/vite/preload-critical.mjs`, `scripts/vite/preload-critical.test.mjs`
- `e2e/regressao-visual.spec.ts`, `e2e/regressao-visual.spec.ts-snapshots/**`
- `playwright.config.ts`
- `package.json` (apenas o script `qa:espacamento`)
- `docs/qa/**`
- `docs/inventario/README.md`, `docs/inventario/04-tipografia.md`
- `docs/superpowers/**`
