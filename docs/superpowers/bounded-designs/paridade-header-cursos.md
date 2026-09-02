# Bounded design — `paridade-header-cursos`

- **Origem:** dois defeitos de paridade autorizados por João em 2026-09-02 no backlog, mais uma
  divergência material encontrada durante o planejamento e resolvida por medição ao vivo.
- **Status:** selecionado em 2026-09-02 por `/planejar-site`. `docs/superpowers/state.md` está em
  `ready_for_execution`, branch `fix/paridade-header-cursos`.
- **Não é spec nem plano:** o bloco é `bounded`; este arquivo é o `bounded_design` que
  `/planejar-site` consome e a memória durável das medições.

## Divergência resolvida antes do desenho

O backlog afirma que `docs/inventario/styles.json` "já registrava `#000000`" certo e que
`docs/inventario/04-tipografia.md` "derivou `#f8f8f8` errado". A causalidade está invertida.

`styles.json` grava `#footer-bottom: #545454`, valor que o próprio `04-tipografia.md` nomeia como o
erro de alpha descartado por `rgbToHex` (a tela pinta `#323232`). O último commit que tocou
`styles.json` é `ba5eae8` (`2.1.4-2.1.5`), anterior ao `chore(3.1.2)` que introduziu `cssColor`.
Logo `styles.json` é artefato pré-correção e o `#000000` dele não prova nada sobre o alpha.

A conclusão de João continua correta, por outro motivo. Medição ao vivo contra
`https://lotusotec.cl/` em 2026-09-02:

| viewport | `getComputedStyle(#main-header).backgroundColor` | pixel, screenshot de viewport | pixel, `fullPage: true` |
| -------- | ------------------------------------------------ | ----------------------------- | ----------------------- |
| 375      | `rgb(255, 255, 255)`                             | `#ffffff`                     | `#ffffff`               |
| 768      | `rgb(255, 255, 255)`                             | `#ffffff`                     | `#ffffff`               |
| 1440     | `rgb(0, 0, 0)`                                   | `#000000`                     | `#f8f8f8`               |
| 1920     | `rgb(0, 0, 0)`                                   | `#000000`                     | `#f8f8f8`               |

O preto é opaco, sem alpha, em repouso e com `.et-fixed-header`, com viewport de `900px` e de
`3441px` de altura. A página mede `3441px` hoje, idêntico ao baseline de 2026-08-25: **o site não
mudou**.

O `#f8f8f8` é artefato de rasterização do `fullPage`. `scripts/inventario/capture-baseline.mjs:9`
captura com `fullPage: true`; `sample-baseline.mjs` amostrou esses PNG e publicou o artefato como
cor medida; `src/index.css:9` seguiu. Altura (`80`/`94px`), sombra (`rgba(0,0,0,0.1) 0 1px 0 0`),
cor dos links do menu (`#24a2e0`) e o logo (`Fondo-Negro`) já batem — só o fundo diverge.

Duas afirmações do repositório não reproduzem contra a medição de hoje e são corrigidas pelo bloco:

- `04-tipografia.md` e `scripts/inventario/lib/site.mjs:96-98` afirmam que o cabeçalho mede
  `rgba(0, 0, 0, 0.03)` sobre branco. A medição devolve `rgb(0, 0, 0)` opaco, e o `body` do site é
  `rgb(0, 0, 0)`. O defeito de `rgbToHex` (descartar alpha) é real e continua justificando o
  candidato 5 de `revisao-arquitetura-2026-09`, mas o cabeçalho não é a prova dele.
- os cinco PNG de `docs/inventario/baseline/` — artefato da conferência humana pendente — pintam o
  cabeçalho desktop `#f8f8f8`, cor que nenhum usuário vê. Demonstrado para `#main-header`; **não
  provado** para o resto da paleta.

## `D-28` reenunciado

O backlog diz que a referência usa `400×300px` fixos. Medido nas quatro larguras:

| card              | asset                    | intrínseco | 375       | 768       | 1440 / 1920 |
| ----------------- | ------------------------ | ---------- | --------- | --------- | ----------- |
| 1 · Media Tensión | `home-office-12.jpg`     | `400×300`  | `300×225` | `400×300` | `320×240`   |
| 2 · Alta Tensión  | `LLVV_00-v1-BN2.jpeg`    | `250×250`  | `250×250` | `250×250` | `250×250`   |
| 3 · Supervisor    | `LLVV_Mantas02-BN2.jpeg` | `250×250`  | `250×250` | `250×250` | `250×250`   |

Não é tamanho fixo: é `max-width: 100%` + `height: auto` sobre o tamanho intrínseco de cada asset,
centralizado (deslocamento esquerdo igual ao direito nas quatro larguras). Os cards 2 e 3 são
**quadrados**, não `4:3`. Os assets de `src/assets/` já têm os tamanhos intrínsecos certos
(`400×300`, `250×250`, `250×250`); o defeito é o clone forçar `aspect-[4/3] w-full object-cover`
nos três, esticando e cortando dois quadrados.

O módulo da imagem abre `30px` até o nome do curso (`29.6875px` em 1440/1920); o clone abre `24px`
(`mt-6`). João autorizou incluir os `6px` no bloco em 2026-09-02, porque a mudança de tamanho da
imagem já obriga snapshot novo no mesmo eixo.

## Desenho

Uma regra só, sem breakpoint: a imagem perde `aspect-[4/3] w-full object-cover` e ganha
`mx-auto h-auto max-w-full`, com `width`/`height` por asset. Isso reproduz as quatro larguras sem
caso especial porque a coluna do clone já bate com a da referência (`320,391px` no desktop, medido
no bloco `paridade-espacamento-fontes`), e `max-width: 100%` faz o resto: o card 1 encolhe com a
coluna e nunca passa de `400px`; os cards 2 e 3 ficam em `250×250` porque nenhuma coluna medida é
menor que isso.

### Commit 1 — `test(paridade): medir cabeçalho e cards de curso contra a referência`

Evidência antes de qualquer pixel mudar. `scripts/qa/lib/header-cursos.mjs` mede, por viewport, o
`backgroundColor` computado de `#main-header` e, para cada card de `#Cursos`, o tamanho intrínseco,
o tamanho renderizado e o deslocamento horizontal dentro da coluna; reprova seletor que case com
zero ou mais de um nó, como `espacamento.mjs` já faz. `scripts/qa/medir-header-cursos.mjs` roda
contra referência e clone e escreve `docs/qa/paridade/2026-09-02/header-cursos.json` e `.md`.
`header-cursos.test.mjs` cobre o parsing e a catraca de nó.

Isto substitui o Context Packet: o bloco não delegou `site-context-packet`, e esta é a medição
externa versionada no repositório.

### Commit 2 — `fix(paridade): pintar o cabeçalho desktop com o preto medido`

- `src/index.css:9` — `--color-header: #f8f8f8` vira `#000000`. O token continua separado de
  `--color-ink`: são duas cores medidas distintas, ainda que iguais neste valor.
- `src/components/layout/Header.tsx:6-10` — o comentário afirma `#f8f8f8`; passa a citar a medição
  e o artefato do `fullPage`.
- `e2e/a11y-exceptions.ts` — as quatro entradas do menu desktop saem. Sobre preto, `#24a2e0` dá
  `7,31:1` (AAA), o axe deixa de reportar os nós e exceção órfã reprova `e2e/a11y.spec.ts`. Fecha
  quatro dos nove nós de `D-21`.
- `src/components/layout/Header.test.tsx` — asserção da classe de fundo, se houver.

### Commit 3 — `fix(paridade): dimensionar as imagens dos cards de curso como a referência`

- `src/components/sections/Cursos.tsx` — `IMAGES` passa a carregar `{ src, width, height }` por
  card; a imagem troca `aspect-[4/3] w-full object-cover` por `mx-auto h-auto max-w-full` e os
  atributos `width`/`height` deixam de ser `320`/`240` fixos.
- o `<p>` do nome do curso troca `mt-6` (`24px`) pelos `30px` medidos.
- `src/components/sections/Cursos.test.tsx` acompanha.

### Commit 4 — `chore(paridade): regerar os snapshots de regressão visual`

`e2e/regressao-visual.spec.ts-snapshots/**` regerado no projeto `producao`, que é onde o spec roda
desde o fechamento de `D-25`.

### Commit 5 — `docs(paridade): corrigir a paleta do cabeçalho e registrar os débitos novos`

- `docs/inventario/04-tipografia.md` — linha `#f8f8f8` da tabela de cores, o parágrafo do
  cabeçalho e o parágrafo do `rgba(0, 0, 0, 0.03)`.
- `docs/inventario/README.md` — matriz.
- `docs/superpowers/backlog.md` — `D-28` fechado com o enunciado corrigido, e dois débitos novos:
  a contaminação dos PNG de baseline pelo `fullPage` (que trava a conferência humana até
  recaptura) e a afirmação `rgba(0, 0, 0, 0.03)` que não reproduz.

## Fora do bloco

- **Recaptura do baseline.** Decisão de João em 2026-09-02: fica como débito, não entra aqui.
  Corrigir `capture-baseline.mjs` invalida os cinco PNG de uma vez e arrasta `sample-baseline.mjs`.
- **Conferência humana dos cinco PNG.** Continua pendente e agora bloqueada pelo débito acima.
- **`D-16`** (`extract-styles.mjs` mede o nó-eco do Divi) e **`D-23`/`D-26`** seguem como estão.

## Prova de aceite

1. `docs/qa/paridade/2026-09-02/header-cursos.md` mostra clone e referência batendo nas quatro
   larguras, para o fundo do cabeçalho e para os três cards.
2. `pnpm check` verde.
3. `pnpm e2e` completo verde, incluindo `a11y.spec.ts` sem exceção órfã e a regressão visual sob os
   snapshots novos.

Build verde não prova paridade; o item 1 é o aceite específico e vem antes dos gates genéricos.
