# Medição de espaçamento — https://lotusotec.cl/ × clone

## Estrutura do parágrafo institucional (Task 5 Step 3 — premissa de D4)

Medição direta em `https://lotusotec.cl/` (`document.querySelectorAll('#Somos p')`, viewport 375):

```json
[
  { "texto": "", "height": 53.203125, "marginBottom": "0px" },
  { "texto": "", "height": 53.203125, "marginBottom": "0px" },
  {
    "texto": "En LOTUS OTEC tenemos una oferta especializada en satisfacer",
    "height": 307.828125,
    "marginBottom": "0px"
  },
  {
    "texto": "Somos especialistas en entrenamiento de métodos de trabajo e",
    "height": 115.1875,
    "marginBottom": "0px"
  },
  {
    "texto": "A la fecha hemos realizado un total de 888 horas de capacita",
    "height": 115.1875,
    "marginBottom": "0px"
  },
  {
    "texto": "Estamos certificados bajo la norma NCH 2728:2015 como consta",
    "height": 115.1875,
    "marginBottom": "0px"
  }
]
```

`#Somos p` alcança 6 nós: os dois primeiros são `<p>&nbsp;</p>` decorativos (espaçamento vertical
do Divi, texto vazio), o terceiro é **o parágrafo institucional inteiro, num bloco só** — as duas
frases de `site.institucional.body` juntas, sem quebra — e os três últimos pertencem aos cards de
destaque (`ENERGIZADAS`/`ALUMNOS`/`CERTIFICACIÓN`), fora do escopo do corpo institucional.

**Desfecho: outcome 2 do Step 3 do plano.** A referência publica o texto institucional como um
`<p>` único, não repartido. `margin-bottom` é `0px` nesse parágrafo — não há segundo parágrafo de
conteúdo para medir espaçamento entre eles. **A premissa de D4 (a referência quebra o corpo em
vários `<p>` com ~19px entre eles) não se confirma.**

Isso contradiz a leitura anterior, registrada em
`docs/qa/paridade/2026-08-29/classificacao.md:34`: "a referência quebra o texto em `<p>` com 19px
de espaçamento entre eles" — leitura feita a olho durante a review de 2026-08-29, não com o
`querySelectorAll` desta medição. As duas leituras:

| leitura                            | método                                                                              | conclusão                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-29 (`classificacao.md:34`) | comparação visual do contact-sheet + estimativa de altura                           | referência quebra o corpo institucional em parágrafos separados, ~19px entre eles                                                                                                                                                                                                       |
| 2026-08-30 (esta medição)          | `document.querySelectorAll('#Somos p')`, `textContent` e `getComputedStyle` nó a nó | referência publica o corpo institucional como um único `<p>`; os "19px" da review anterior não têm nó correspondente — o delta de altura `institucional.corpo` desta rodada (+34.2px em 375, clone MAIOR que a referência, não menor) já não bate com a hipótese de "faltam parágrafos" |

Consequência prática: **a Task 7 do plano (repartir `site.institucional.body` em array de
parágrafos) não deve rodar como especificada** — dividiria o conteúdo do clone sem que a referência
faça o mesmo, o oposto do objetivo de paridade. Decisão de D4 fica para João revisar à luz desta
medição, conforme D9 da spec (divergência entre duas leituras do repositório não se resolve em
silêncio).

## Divergência entre medições — calha de cursos (D9) — RESOLVIDA

`docs/inventario/05-layout.md` registra `--spacing-gutter: 59.39px`; a review de 2026-08-29 mediu
"30px" entre os cards de curso a olho. O `rowGap` computado (tabela acima) não resolvia isso — a
referência não usa a propriedade CSS `gap`. Medição direta adicional (fora de `NOS`, ad-hoc),
comparando `#Cursos .et_pb_column_8`/`_9` (referência) e o primeiro/segundo `<article>` (clone),
`getBoundingClientRect` nas duas larguras onde o layout muda de coluna (375 empilhado, 1440 em
grade):

| largura | eixo medido            | referência | clone      |
| ------- | ---------------------- | ---------- | ---------- |
| 375     | vertical (empilhado)   | `30px`     | `59.375px` |
| 1440    | horizontal (3 colunas) | `59.39px`  | `59.375px` |

**As duas leituras estavam certas, cada uma no seu eixo — não há contradição real.** `59.39px` é o
gap HORIZONTAL entre colunas no desktop (`--spacing-gutter` está certo para esse eixo, bate com a
referência). `30px` é o gap VERTICAL entre cards empilhados no mobile — um eixo diferente, que
`05-layout.md` nunca mediu. O defeito do clone é usar `gap-gutter` (que aplica o MESMO valor aos
dois eixos via `gap` CSS) em vez de separar `gap-x`/`gap-y`. Correção para a Task 9: trocar
`gap-gutter` por `gap-x-gutter gap-y-[30px]` na grade de cursos — mantém `--spacing-gutter` para a
coluna (não muda o token, não contradiz `05-layout.md`) e corrige só o eixo vertical.

| nó                         | largura | propriedade   | referência  | clone       | delta   |
| -------------------------- | ------- | ------------- | ----------- | ----------- | ------- |
| `hero.secao`               | 375     | height        | 771.96875   | 625.375     | -146.59 |
| `hero.secao`               | 375     | bottom        | 850.96875   | 704.375     | -146.59 |
| `hero.secao`               | 375     | fontSize      | 14          | 16          | +2      |
| `hero.secao`               | 375     | lineHeight    | 23.8        | 24          | +0.2    |
| `hero.secao`               | 375     | fontWeight    | 500         | 400         | -100    |
| `hero.titulo`              | 375     | height        | 166         | 156         | -10     |
| `hero.titulo`              | 375     | top           | 256.6875    | 211.6875    | -45     |
| `hero.titulo`              | 375     | bottom        | 422.6875    | 367.6875    | -55     |
| `hero.titulo`              | 375     | paddingBottom | 10          | 0           | -10     |
| `hero.subtitulo`           | 375     | height        | 76          | 66          | -10     |
| `hero.subtitulo`           | 375     | top           | 422.6875    | 367.6875    | -55     |
| `hero.subtitulo`           | 375     | bottom        | 498.6875    | 433.6875    | -65     |
| `hero.subtitulo`           | 375     | paddingBottom | 10          | 0           | -10     |
| `hero.corpo`               | 375     | height        | 172.78125   | 115.1875    | -57.59  |
| `hero.corpo`               | 375     | top           | 538.6875    | 465.6875    | -73     |
| `hero.corpo`               | 375     | bottom        | 711.46875   | 580.875     | -130.59 |
| `hero.corpo`               | 375     | marginTop     | 0           | 32          | +32     |
| `hero.cta`                 | 375     | height        | 52          | 54          | +2      |
| `hero.cta`                 | 375     | top           | 761.46875   | 612.875     | -148.59 |
| `hero.cta`                 | 375     | bottom        | 813.46875   | 666.875     | -146.59 |
| `hero.cta`                 | 375     | marginTop     | 0           | 32          | +32     |
| `hero.cta`                 | 375     | fontWeight    | 690         | 700         | +10     |
| `institucional.secao`      | 375     | height        | 1974.1875   | 1628.3125   | -345.87 |
| `institucional.secao`      | 375     | top           | 849.96875   | 704.375     | -145.59 |
| `institucional.secao`      | 375     | bottom        | 2824.15625  | 2332.6875   | -491.47 |
| `institucional.secao`      | 375     | marginTop     | -1          | 0           | +1      |
| `institucional.secao`      | 375     | fontSize      | 14          | 16          | +2      |
| `institucional.secao`      | 375     | lineHeight    | 23.8        | 24          | +0.2    |
| `institucional.secao`      | 375     | fontWeight    | 500         | 400         | -100    |
| `institucional.corpo`      | 375     | height        | 307.828125  | 342.03125   | +34.2   |
| `institucional.corpo`      | 375     | top           | 1426.375    | 1203.75     | -222.62 |
| `institucional.corpo`      | 375     | bottom        | 1734.203125 | 1545.78125  | -188.42 |
| `destaque.primeiro.card`   | 375     | height        | 305.984375  | 209.984375  | -96     |
| `destaque.primeiro.card`   | 375     | top           | 1805.203125 | 1571.78125  | -233.42 |
| `destaque.primeiro.card`   | 375     | bottom        | 2111.1875   | 1781.765625 | -329.42 |
| `destaque.primeiro.card`   | 375     | paddingTop    | 30          | 0           | -30     |
| `destaque.primeiro.card`   | 375     | paddingBottom | 30          | 0           | -30     |
| `destaque.primeiro.card`   | 375     | lineHeight    | 28.8        | 24          | -4.8    |
| `destaque.primeiro.card`   | 375     | fontWeight    | 500         | 400         | -100    |
| `destaque.primeiro.titulo` | 375     | height        | 40.796875   | 30.796875   | -10     |
| `destaque.primeiro.titulo` | 375     | top           | 1925.203125 | 1635.78125  | -289.42 |
| `destaque.primeiro.titulo` | 375     | bottom        | 1966        | 1666.578125 | -299.42 |
| `destaque.primeiro.titulo` | 375     | paddingBottom | 10          | 0           | -10     |
| `destaque.primeiro.titulo` | 375     | marginTop     | 0           | 16          | +16     |
| `destaque.primeiro.corpo`  | 375     | top           | 1966        | 1666.578125 | -299.42 |
| `destaque.primeiro.corpo`  | 375     | bottom        | 2081.1875   | 1781.765625 | -299.42 |
| `cursos.secao`             | 375     | height        | 1628.15625  | 1558.90625  | -69.25  |
| `cursos.secao`             | 375     | top           | 2852.15625  | 2332.6875   | -519.47 |
| `cursos.secao`             | 375     | bottom        | 4480.3125   | 3891.59375  | -588.72 |
| `cursos.secao`             | 375     | marginBottom  | -105        | 0           | +105    |
| `cursos.secao`             | 375     | fontSize      | 14          | 16          | +2      |
| `cursos.secao`             | 375     | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.secao`             | 375     | fontWeight    | 500         | 400         | -100    |
| `cursos.linha`             | 375     | height        | 1077.78125  | 1062.53125  | -15.25  |
| `cursos.linha`             | 375     | top           | 3180.53125  | 2611.0625   | -569.47 |
| `cursos.linha`             | 375     | bottom        | 4258.3125   | 3673.59375  | -584.72 |
| `cursos.linha`             | 375     | paddingTop    | 30          | 27          | -3      |
| `cursos.linha`             | 375     | paddingBottom | 30          | 27          | -3      |
| `cursos.linha`             | 375     | rowGap        | 0           | 59.39       | +59.39  |
| `cursos.linha`             | 375     | fontSize      | 14          | 16          | +2      |
| `cursos.linha`             | 375     | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.linha`             | 375     | fontWeight    | 500         | 400         | -100    |
| `cursos.primeiro.card`     | 375     | height        | 302.59375   | 296.59375   | -6      |
| `cursos.primeiro.card`     | 375     | top           | 3210.53125  | 2638.0625   | -572.47 |
| `cursos.primeiro.card`     | 375     | bottom        | 3513.125    | 2934.65625  | -578.47 |
| `cursos.primeiro.card`     | 375     | marginBottom  | 30          | 0           | -30     |
| `cursos.primeiro.card`     | 375     | fontSize      | 14          | 16          | +2      |
| `cursos.primeiro.card`     | 375     | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.primeiro.card`     | 375     | fontWeight    | 500         | 400         | -100    |
| `contacto.secao`           | 375     | height        | 1010.140625 | 942.96875   | -67.17  |
| `contacto.secao`           | 375     | top           | 4375.3125   | 3891.59375  | -483.72 |
| `contacto.secao`           | 375     | bottom        | 5385.453125 | 4834.5625   | -550.89 |
| `contacto.secao`           | 375     | fontSize      | 14          | 16          | +2      |
| `contacto.secao`           | 375     | lineHeight    | 23.8        | 24          | +0.2    |
| `contacto.secao`           | 375     | fontWeight    | 500         | 400         | -100    |
| `contacto.linha`           | 375     | height        | 383.96875   | 335.96875   | -48     |
| `contacto.linha`           | 375     | top           | 4432.3125   | 3948.59375  | -483.72 |
| `contacto.linha`           | 375     | bottom        | 4816.28125  | 4284.5625   | -531.72 |
| `contacto.linha`           | 375     | paddingTop    | 30          | 27          | -3      |
| `contacto.linha`           | 375     | paddingBottom | 30          | 27          | -3      |
| `contacto.linha`           | 375     | marginBottom  | 9           | 0           | -9      |
| `contacto.linha`           | 375     | fontSize      | 14          | 16          | +2      |
| `contacto.linha`           | 375     | lineHeight    | 23.8        | 24          | +0.2    |
| `contacto.linha`           | 375     | fontWeight    | 500         | 400         | -100    |
| `rodape.copyright`         | 375     | height        | 57.59375    | 47.59375    | -10     |
| `rodape.copyright`         | 375     | top           | 5400.453125 | 4849.5625   | -550.89 |
| `rodape.copyright`         | 375     | bottom        | 5458.046875 | 4897.15625  | -560.89 |
| `rodape.copyright`         | 375     | paddingBottom | 10          | 0           | -10     |
| `rodape.copyright`         | 375     | fontSize      | 14          | 16          | +2      |
| `rodape.copyright`         | 375     | lineHeight    | 23.8        | 24          | +0.2    |
| `rodape.copyright`         | 375     | fontWeight    | 500         | 400         | -100    |
| `hero.secao`               | 768     | height        | 565.78125   | 476.78125   | -89     |
| `hero.secao`               | 768     | bottom        | 644.78125   | 555.78125   | -89     |
| `hero.secao`               | 768     | fontSize      | 14          | 16          | +2      |
| `hero.secao`               | 768     | lineHeight    | 23.8        | 24          | +0.2    |
| `hero.secao`               | 768     | fontWeight    | 500         | 400         | -100    |
| `hero.titulo`              | 768     | height        | 88          | 78          | -10     |
| `hero.titulo`              | 768     | top           | 248.390625  | 203.390625  | -45     |
| `hero.titulo`              | 768     | bottom        | 336.390625  | 281.390625  | -55     |
| `hero.titulo`              | 768     | paddingBottom | 10          | 0           | -10     |
| `hero.subtitulo`           | 768     | height        | 32          | 22          | -10     |
| `hero.subtitulo`           | 768     | top           | 336.390625  | 281.390625  | -55     |
| `hero.subtitulo`           | 768     | bottom        | 368.390625  | 303.390625  | -65     |
| `hero.subtitulo`           | 768     | paddingBottom | 10          | 0           | -10     |
| `hero.corpo`               | 768     | top           | 408.390625  | 335.390625  | -73     |
| `hero.corpo`               | 768     | bottom        | 465.984375  | 392.984375  | -73     |
| `hero.corpo`               | 768     | marginTop     | 0           | 32          | +32     |
| `hero.cta`                 | 768     | height        | 52          | 54          | +2      |
| `hero.cta`                 | 768     | top           | 515.984375  | 424.984375  | -91     |
| `hero.cta`                 | 768     | bottom        | 567.984375  | 478.984375  | -89     |
| `hero.cta`                 | 768     | marginTop     | 0           | 32          | +32     |
| `hero.cta`                 | 768     | fontWeight    | 690         | 700         | +10     |
| `institucional.secao`      | 768     | height        | 1875.0625   | 1333.3125   | -541.75 |
| `institucional.secao`      | 768     | top           | 643.78125   | 555.78125   | -88     |
| `institucional.secao`      | 768     | bottom        | 2518.84375  | 1889.09375  | -629.75 |
| `institucional.secao`      | 768     | marginTop     | -1          | 0           | +1      |
| `institucional.secao`      | 768     | fontSize      | 14          | 16          | +2      |
| `institucional.secao`      | 768     | lineHeight    | 23.8        | 24          | +0.2    |
| `institucional.secao`      | 768     | fontWeight    | 500         | 400         | -100    |
| `institucional.corpo`      | 768     | top           | 1420.1875   | 1075.15625  | -345.03 |
| `institucional.corpo`      | 768     | bottom        | 1591.203125 | 1246.171875 | -345.03 |
| `destaque.primeiro.card`   | 768     | height        | 248.390625  | 152.390625  | -96     |
| `destaque.primeiro.card`   | 768     | top           | 1672.671875 | 1272.171875 | -400.5  |
| `destaque.primeiro.card`   | 768     | bottom        | 1921.0625   | 1424.5625   | -496.5  |
| `destaque.primeiro.card`   | 768     | paddingTop    | 30          | 0           | -30     |
| `destaque.primeiro.card`   | 768     | paddingBottom | 30          | 0           | -30     |
| `destaque.primeiro.card`   | 768     | lineHeight    | 28.8        | 24          | -4.8    |
| `destaque.primeiro.card`   | 768     | fontWeight    | 500         | 400         | -100    |
| `destaque.primeiro.titulo` | 768     | height        | 40.796875   | 30.796875   | -10     |
| `destaque.primeiro.titulo` | 768     | top           | 1792.671875 | 1336.171875 | -456.5  |
| `destaque.primeiro.titulo` | 768     | bottom        | 1833.46875  | 1366.96875  | -466.5  |
| `destaque.primeiro.titulo` | 768     | paddingBottom | 10          | 0           | -10     |
| `destaque.primeiro.titulo` | 768     | marginTop     | 0           | 16          | +16     |
| `destaque.primeiro.corpo`  | 768     | top           | 1833.46875  | 1366.96875  | -466.5  |
| `destaque.primeiro.corpo`  | 768     | bottom        | 1891.0625   | 1424.5625   | -466.5  |
| `cursos.secao`             | 768     | height        | 1519.578125 | 2082.671875 | +563.09 |
| `cursos.secao`             | 768     | top           | 2546.84375  | 1889.09375  | -657.75 |
| `cursos.secao`             | 768     | bottom        | 4066.421875 | 3971.765625 | -94.66  |
| `cursos.secao`             | 768     | marginBottom  | -105        | 0           | +105    |
| `cursos.secao`             | 768     | fontSize      | 14          | 16          | +2      |
| `cursos.secao`             | 768     | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.secao`             | 768     | fontWeight    | 500         | 400         | -100    |
| `cursos.linha`             | 768     | height        | 1081.390625 | 1698.484375 | +617.09 |
| `cursos.linha`             | 768     | top           | 2763.03125  | 2055.28125  | -707.75 |
| `cursos.linha`             | 768     | bottom        | 3844.421875 | 3753.765625 | -90.66  |
| `cursos.linha`             | 768     | paddingTop    | 30          | 27          | -3      |
| `cursos.linha`             | 768     | paddingBottom | 30          | 27          | -3      |
| `cursos.linha`             | 768     | rowGap        | 0           | 59.39       | +59.39  |
| `cursos.linha`             | 768     | fontSize      | 14          | 16          | +2      |
| `cursos.linha`             | 768     | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.linha`             | 768     | fontWeight    | 500         | 400         | -100    |
| `cursos.primeiro.card`     | 768     | height        | 353.796875  | 508.578125  | +154.78 |
| `cursos.primeiro.card`     | 768     | top           | 2793.03125  | 2082.28125  | -710.75 |
| `cursos.primeiro.card`     | 768     | bottom        | 3146.828125 | 2590.859375 | -555.97 |
| `cursos.primeiro.card`     | 768     | marginBottom  | 30          | 0           | -30     |
| `cursos.primeiro.card`     | 768     | fontSize      | 14          | 16          | +2      |
| `cursos.primeiro.card`     | 768     | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.primeiro.card`     | 768     | fontWeight    | 500         | 400         | -100    |
| `contacto.secao`           | 768     | height        | 893.453125  | 801.984375  | -91.47  |
| `contacto.secao`           | 768     | top           | 3961.421875 | 3971.765625 | +10.34  |
| `contacto.secao`           | 768     | bottom        | 4854.875    | 4773.75     | -81.12  |
| `contacto.secao`           | 768     | fontSize      | 14          | 16          | +2      |
| `contacto.secao`           | 768     | lineHeight    | 23.8        | 24          | +0.2    |
| `contacto.secao`           | 768     | fontWeight    | 500         | 400         | -100    |
| `contacto.linha`           | 768     | height        | 242.984375  | 194.984375  | -48     |
| `contacto.linha`           | 768     | top           | 4018.421875 | 4028.765625 | +10.34  |
| `contacto.linha`           | 768     | bottom        | 4261.40625  | 4223.75     | -37.66  |
| `contacto.linha`           | 768     | paddingTop    | 30          | 27          | -3      |
| `contacto.linha`           | 768     | paddingBottom | 30          | 27          | -3      |
| `contacto.linha`           | 768     | marginBottom  | 9           | 0           | -9      |
| `contacto.linha`           | 768     | fontSize      | 14          | 16          | +2      |
| `contacto.linha`           | 768     | lineHeight    | 23.8        | 24          | +0.2    |
| `contacto.linha`           | 768     | fontWeight    | 500         | 400         | -100    |
| `rodape.copyright`         | 768     | height        | 33.796875   | 23.796875   | -10     |
| `rodape.copyright`         | 768     | top           | 4869.875    | 4788.75     | -81.12  |
| `rodape.copyright`         | 768     | bottom        | 4903.671875 | 4812.546875 | -91.12  |
| `rodape.copyright`         | 768     | paddingBottom | 10          | 0           | -10     |
| `rodape.copyright`         | 768     | fontSize      | 14          | 16          | +2      |
| `rodape.copyright`         | 768     | lineHeight    | 23.8        | 24          | +0.2    |
| `rodape.copyright`         | 768     | fontWeight    | 500         | 400         | -100    |
| `hero.secao`               | 1440    | height        | 830.984375  | 711.1875    | -119.8  |
| `hero.secao`               | 1440    | bottom        | 924.984375  | 805.1875    | -119.8  |
| `hero.secao`               | 1440    | fontSize      | 14          | 16          | +2      |
| `hero.secao`               | 1440    | lineHeight    | 23.8        | 24          | +0.2    |
| `hero.secao`               | 1440    | fontWeight    | 500         | 400         | -100    |
| `hero.titulo`              | 1440    | height        | 166         | 156         | -10     |
| `hero.titulo`              | 1440    | top           | 330.59375   | 285.59375   | -45     |
| `hero.titulo`              | 1440    | bottom        | 496.59375   | 441.59375   | -55     |
| `hero.titulo`              | 1440    | paddingBottom | 10          | 0           | -10     |
| `hero.subtitulo`           | 1440    | height        | 54          | 44          | -10     |
| `hero.subtitulo`           | 1440    | top           | 496.59375   | 441.59375   | -55     |
| `hero.subtitulo`           | 1440    | bottom        | 550.59375   | 485.59375   | -65     |
| `hero.subtitulo`           | 1440    | paddingBottom | 10          | 0           | -10     |
| `hero.corpo`               | 1440    | height        | 86.390625   | 57.59375    | -28.8   |
| `hero.corpo`               | 1440    | top           | 590.59375   | 517.59375   | -73     |
| `hero.corpo`               | 1440    | bottom        | 676.984375  | 575.1875    | -101.8  |
| `hero.corpo`               | 1440    | marginTop     | 0           | 32          | +32     |
| `hero.cta`                 | 1440    | top           | 726.984375  | 607.1875    | -119.8  |
| `hero.cta`                 | 1440    | bottom        | 780.984375  | 661.1875    | -119.8  |
| `hero.cta`                 | 1440    | marginTop     | 0           | 32          | +32     |
| `institucional.secao`      | 1440    | height        | 864.6875    | 736.984375  | -127.7  |
| `institucional.secao`      | 1440    | top           | 923.984375  | 805.1875    | -118.8  |
| `institucional.secao`      | 1440    | bottom        | 1788.671875 | 1542.171875 | -246.5  |
| `institucional.secao`      | 1440    | marginTop     | -1          | 0           | +1      |
| `institucional.secao`      | 1440    | fontSize      | 14          | 16          | +2      |
| `institucional.secao`      | 1440    | lineHeight    | 23.8        | 24          | +0.2    |
| `institucional.secao`      | 1440    | fontWeight    | 500         | 400         | -100    |
| `institucional.corpo`      | 1440    | top           | 1167.390625 | 1036.78125  | -130.61 |
| `institucional.corpo`      | 1440    | bottom        | 1304.203125 | 1173.59375  | -130.61 |
| `destaque.primeiro.card`   | 1440    | height        | 305.984375  | 209.984375  | -96     |
| `destaque.primeiro.card`   | 1440    | top           | 1419.875    | 1291.1875   | -128.69 |
| `destaque.primeiro.card`   | 1440    | bottom        | 1725.859375 | 1501.171875 | -224.69 |
| `destaque.primeiro.card`   | 1440    | paddingTop    | 30          | 0           | -30     |
| `destaque.primeiro.card`   | 1440    | paddingBottom | 30          | 0           | -30     |
| `destaque.primeiro.card`   | 1440    | lineHeight    | 28.8        | 24          | -4.8    |
| `destaque.primeiro.card`   | 1440    | fontWeight    | 500         | 400         | -100    |
| `destaque.primeiro.titulo` | 1440    | height        | 40.796875   | 30.796875   | -10     |
| `destaque.primeiro.titulo` | 1440    | top           | 1539.875    | 1355.1875   | -184.69 |
| `destaque.primeiro.titulo` | 1440    | bottom        | 1580.671875 | 1385.984375 | -194.69 |
| `destaque.primeiro.titulo` | 1440    | paddingBottom | 10          | 0           | -10     |
| `destaque.primeiro.titulo` | 1440    | marginTop     | 0           | 16          | +16     |
| `destaque.primeiro.corpo`  | 1440    | height        | 115.1875    | 86.390625   | -28.8   |
| `destaque.primeiro.corpo`  | 1440    | top           | 1580.671875 | 1385.984375 | -194.69 |
| `destaque.primeiro.corpo`  | 1440    | bottom        | 1695.859375 | 1472.375    | -223.48 |
| `cursos.secao`             | 1440    | height        | 809.15625   | 750.09375   | -59.06  |
| `cursos.secao`             | 1440    | top           | 1816.671875 | 1542.171875 | -274.5  |
| `cursos.secao`             | 1440    | bottom        | 2625.828125 | 2292.265625 | -333.56 |
| `cursos.secao`             | 1440    | marginBottom  | -105        | 0           | +105    |
| `cursos.secao`             | 1440    | fontSize      | 14          | 16          | +2      |
| `cursos.secao`             | 1440    | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.secao`             | 1440    | fontWeight    | 500         | 400         | -100    |
| `cursos.linha`             | 1440    | height        | 381.28125   | 365.90625   | -15.37  |
| `cursos.linha`             | 1440    | top           | 2026.546875 | 1708.359375 | -318.19 |
| `cursos.linha`             | 1440    | bottom        | 2407.828125 | 2074.265625 | -333.56 |
| `cursos.linha`             | 1440    | rowGap        | 0           | 59.39       | +59.39  |
| `cursos.linha`             | 1440    | fontSize      | 14          | 16          | +2      |
| `cursos.linha`             | 1440    | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.linha`             | 1440    | fontWeight    | 500         | 400         | -100    |
| `cursos.primeiro.card`     | 1440    | height        | 317.5625    | 311.90625   | -5.66   |
| `cursos.primeiro.card`     | 1440    | top           | 2053.546875 | 1735.359375 | -318.19 |
| `cursos.primeiro.card`     | 1440    | bottom        | 2371.109375 | 2047.265625 | -323.84 |
| `cursos.primeiro.card`     | 1440    | fontSize      | 14          | 16          | +2      |
| `cursos.primeiro.card`     | 1440    | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.primeiro.card`     | 1440    | fontWeight    | 500         | 400         | -100    |
| `contacto.secao`           | 1440    | height        | 866.671875  | 773.1875    | -93.48  |
| `contacto.secao`           | 1440    | top           | 2520.828125 | 2292.265625 | -228.56 |
| `contacto.secao`           | 1440    | bottom        | 3387.5      | 3065.453125 | -322.05 |
| `contacto.secao`           | 1440    | fontSize      | 14          | 16          | +2      |
| `contacto.secao`           | 1440    | lineHeight    | 23.8        | 24          | +0.2    |
| `contacto.secao`           | 1440    | fontWeight    | 500         | 400         | -100    |
| `contacto.linha`           | 1440    | height        | 207.875     | 166.1875    | -41.69  |
| `contacto.linha`           | 1440    | top           | 2577.828125 | 2349.265625 | -228.56 |
| `contacto.linha`           | 1440    | bottom        | 2785.703125 | 2515.453125 | -270.25 |
| `contacto.linha`           | 1440    | marginBottom  | 9           | 0           | -9      |
| `contacto.linha`           | 1440    | fontSize      | 14          | 16          | +2      |
| `contacto.linha`           | 1440    | lineHeight    | 23.8        | 24          | +0.2    |
| `contacto.linha`           | 1440    | fontWeight    | 500         | 400         | -100    |
| `rodape.copyright`         | 1440    | height        | 33.796875   | 23.796875   | -10     |
| `rodape.copyright`         | 1440    | top           | 3402.5      | 3080.453125 | -322.05 |
| `rodape.copyright`         | 1440    | bottom        | 3436.296875 | 3104.25     | -332.05 |
| `rodape.copyright`         | 1440    | paddingBottom | 10          | 0           | -10     |
| `rodape.copyright`         | 1440    | fontSize      | 14          | 16          | +2      |
| `rodape.copyright`         | 1440    | lineHeight    | 23.8        | 24          | +0.2    |
| `rodape.copyright`         | 1440    | fontWeight    | 500         | 400         | -100    |
| `hero.secao`               | 1920    | height        | 796.1875    | 707.1875    | -89     |
| `hero.secao`               | 1920    | bottom        | 890.1875    | 801.1875    | -89     |
| `hero.secao`               | 1920    | fontSize      | 14          | 16          | +2      |
| `hero.secao`               | 1920    | lineHeight    | 23.8        | 24          | +0.2    |
| `hero.secao`               | 1920    | fontWeight    | 500         | 400         | -100    |
| `hero.titulo`              | 1920    | height        | 88          | 78          | -10     |
| `hero.titulo`              | 1920    | top           | 378.59375   | 333.59375   | -45     |
| `hero.titulo`              | 1920    | bottom        | 466.59375   | 411.59375   | -55     |
| `hero.titulo`              | 1920    | paddingBottom | 10          | 0           | -10     |
| `hero.subtitulo`           | 1920    | height        | 32          | 22          | -10     |
| `hero.subtitulo`           | 1920    | top           | 466.59375   | 411.59375   | -55     |
| `hero.subtitulo`           | 1920    | bottom        | 498.59375   | 433.59375   | -65     |
| `hero.subtitulo`           | 1920    | paddingBottom | 10          | 0           | -10     |
| `hero.corpo`               | 1920    | top           | 538.59375   | 465.59375   | -73     |
| `hero.corpo`               | 1920    | bottom        | 596.1875    | 523.1875    | -73     |
| `hero.corpo`               | 1920    | marginTop     | 0           | 32          | +32     |
| `hero.cta`                 | 1920    | height        | 52          | 54          | +2      |
| `hero.cta`                 | 1920    | top           | 646.1875    | 555.1875    | -91     |
| `hero.cta`                 | 1920    | bottom        | 698.1875    | 609.1875    | -89     |
| `hero.cta`                 | 1920    | marginTop     | 0           | 32          | +32     |
| `hero.cta`                 | 1920    | fontWeight    | 678.5       | 700         | +21.5   |
| `institucional.secao`      | 1920    | height        | 864.6875    | 736.984375  | -127.7  |
| `institucional.secao`      | 1920    | top           | 889.1875    | 801.1875    | -88     |
| `institucional.secao`      | 1920    | bottom        | 1753.875    | 1538.171875 | -215.7  |
| `institucional.secao`      | 1920    | marginTop     | -1          | 0           | +1      |
| `institucional.secao`      | 1920    | fontSize      | 14          | 16          | +2      |
| `institucional.secao`      | 1920    | lineHeight    | 23.8        | 24          | +0.2    |
| `institucional.secao`      | 1920    | fontWeight    | 500         | 400         | -100    |
| `institucional.corpo`      | 1920    | top           | 1132.59375  | 1032.78125  | -99.81  |
| `institucional.corpo`      | 1920    | bottom        | 1269.40625  | 1169.59375  | -99.81  |
| `destaque.primeiro.card`   | 1920    | height        | 305.984375  | 209.984375  | -96     |
| `destaque.primeiro.card`   | 1920    | top           | 1385.078125 | 1287.1875   | -97.89  |
| `destaque.primeiro.card`   | 1920    | bottom        | 1691.0625   | 1497.171875 | -193.89 |
| `destaque.primeiro.card`   | 1920    | paddingTop    | 30          | 0           | -30     |
| `destaque.primeiro.card`   | 1920    | paddingBottom | 30          | 0           | -30     |
| `destaque.primeiro.card`   | 1920    | lineHeight    | 28.8        | 24          | -4.8    |
| `destaque.primeiro.card`   | 1920    | fontWeight    | 500         | 400         | -100    |
| `destaque.primeiro.titulo` | 1920    | height        | 40.796875   | 30.796875   | -10     |
| `destaque.primeiro.titulo` | 1920    | top           | 1505.078125 | 1351.1875   | -153.89 |
| `destaque.primeiro.titulo` | 1920    | bottom        | 1545.875    | 1381.984375 | -163.89 |
| `destaque.primeiro.titulo` | 1920    | paddingBottom | 10          | 0           | -10     |
| `destaque.primeiro.titulo` | 1920    | marginTop     | 0           | 16          | +16     |
| `destaque.primeiro.corpo`  | 1920    | height        | 115.1875    | 86.390625   | -28.8   |
| `destaque.primeiro.corpo`  | 1920    | top           | 1545.875    | 1381.984375 | -163.89 |
| `destaque.primeiro.corpo`  | 1920    | bottom        | 1661.0625   | 1468.375    | -192.69 |
| `cursos.secao`             | 1920    | height        | 807.15625   | 750.09375   | -57.06  |
| `cursos.secao`             | 1920    | top           | 1781.875    | 1538.171875 | -243.7  |
| `cursos.secao`             | 1920    | bottom        | 2589.03125  | 2288.265625 | -300.77 |
| `cursos.secao`             | 1920    | marginBottom  | -105        | 0           | +105    |
| `cursos.secao`             | 1920    | fontSize      | 14          | 16          | +2      |
| `cursos.secao`             | 1920    | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.secao`             | 1920    | fontWeight    | 500         | 400         | -100    |
| `cursos.linha`             | 1920    | height        | 381.28125   | 365.90625   | -15.37  |
| `cursos.linha`             | 1920    | top           | 1991.75     | 1704.359375 | -287.39 |
| `cursos.linha`             | 1920    | bottom        | 2373.03125  | 2070.265625 | -302.77 |
| `cursos.linha`             | 1920    | rowGap        | 0           | 59.39       | +59.39  |
| `cursos.linha`             | 1920    | fontSize      | 14          | 16          | +2      |
| `cursos.linha`             | 1920    | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.linha`             | 1920    | fontWeight    | 500         | 400         | -100    |
| `cursos.primeiro.card`     | 1920    | height        | 317.5625    | 311.90625   | -5.66   |
| `cursos.primeiro.card`     | 1920    | top           | 2018.75     | 1731.359375 | -287.39 |
| `cursos.primeiro.card`     | 1920    | bottom        | 2336.3125   | 2043.265625 | -293.05 |
| `cursos.primeiro.card`     | 1920    | fontSize      | 14          | 16          | +2      |
| `cursos.primeiro.card`     | 1920    | lineHeight    | 23.8        | 24          | +0.2    |
| `cursos.primeiro.card`     | 1920    | fontWeight    | 500         | 400         | -100    |
| `contacto.secao`           | 1920    | height        | 864.671875  | 773.1875    | -91.48  |
| `contacto.secao`           | 1920    | top           | 2484.03125  | 2288.265625 | -195.77 |
| `contacto.secao`           | 1920    | bottom        | 3348.703125 | 3061.453125 | -287.25 |
| `contacto.secao`           | 1920    | fontSize      | 14          | 16          | +2      |
| `contacto.secao`           | 1920    | lineHeight    | 23.8        | 24          | +0.2    |
| `contacto.secao`           | 1920    | fontWeight    | 500         | 400         | -100    |
| `contacto.linha`           | 1920    | height        | 207.875     | 166.1875    | -41.69  |
| `contacto.linha`           | 1920    | top           | 2541.03125  | 2345.265625 | -195.77 |
| `contacto.linha`           | 1920    | bottom        | 2748.90625  | 2511.453125 | -237.45 |
| `contacto.linha`           | 1920    | marginBottom  | 9           | 0           | -9      |
| `contacto.linha`           | 1920    | fontSize      | 14          | 16          | +2      |
| `contacto.linha`           | 1920    | lineHeight    | 23.8        | 24          | +0.2    |
| `contacto.linha`           | 1920    | fontWeight    | 500         | 400         | -100    |
| `rodape.copyright`         | 1920    | height        | 33.796875   | 23.796875   | -10     |
| `rodape.copyright`         | 1920    | top           | 3363.703125 | 3076.453125 | -287.25 |
| `rodape.copyright`         | 1920    | bottom        | 3397.5      | 3100.25     | -297.25 |
| `rodape.copyright`         | 1920    | paddingBottom | 10          | 0           | -10     |
| `rodape.copyright`         | 1920    | fontSize      | 14          | 16          | +2      |
| `rodape.copyright`         | 1920    | lineHeight    | 23.8        | 24          | +0.2    |
| `rodape.copyright`         | 1920    | fontWeight    | 500         | 400         | -100    |

## Adendo da review — padding horizontal do card de destaque (achado C-4)

`medirNo` captura só `paddingTop`/`paddingBottom`, então o `p-[30px]` aplicado em
`src/components/sections/Destaques.tsx` tinha evidência para o eixo vertical e nenhuma para o
horizontal. Medição ad-hoc direta em 2026-08-31 (mesmo par de seletores da lista `NOS`:
`#Somos .et_pb_blurb_0` na referência, `#Somos .text-center:nth-of-type(1)` no clone), com o clone
servido pelo build em `http://localhost:5184/`:

| largura | lado       | paddingLeft | paddingRight | paddingTop | paddingBottom | largura do card |
| ------: | ---------- | ----------- | ------------ | ---------- | ------------- | --------------- |
|     375 | referência | `30px`      | `30px`       | `30px`     | `30px`        | `300px`         |
|     375 | clone      | `30px`      | `30px`       | `30px`     | `30px`        | `300px`         |
|     768 | referência | `30px`      | `30px`       | `30px`     | `30px`        | `614.39px`      |
|     768 | clone      | `30px`      | `30px`       | `30px`     | `30px`        | `614.39px`      |
|    1440 | referência | `30px`      | `30px`       | `30px`     | `30px`        | `320.39px`      |
|    1440 | clone      | `30px`      | `30px`       | `30px`     | `30px`        | `320.41px`      |
|    1920 | referência | `30px`      | `30px`       | `30px`     | `30px`        | `320.39px`      |
|    1920 | clone      | `30px`      | `30px`       | `30px`     | `30px`        | `320.41px`      |

A referência usa `30px` nos quatro lados, nas quatro larguras: `p-[30px]` está certo e agora tem
linha de medição para o eixo que faltava. Nenhuma mudança de código decorre deste adendo.

## Adendo da review — margens da referência não reproduzidas (achado C-2)

Duas margens medidas na referência ficaram sem correção e, até esta review, sem declaração:

| nó               | largura           | propriedade    | referência | clone | efeito no clone                                             |
| ---------------- | ----------------- | -------------- | ---------- | ----- | ----------------------------------------------------------- |
| `cursos.secao`   | 375/768/1440/1920 | `marginBottom` | `-105`     | `0`   | falta a sobreposição de 105px entre `#Cursos` e `#Contacto` |
| `contacto.linha` | 375/768/1440/1920 | `marginBottom` | `9`        | `0`   | falta 9px abaixo da linha de contato                        |

As duas são constantes nas quatro larguras. A de `cursos.secao` é a maior divergência de espaçamento
que sobrou depois das Tasks 6-9 e não estava nomeada na classificação da rodada: reproduzi-la muda a
posição de `#Contacto` e do rodapé em 105px, o que é decisão de João, não ajuste dentro deste bloco.
Registradas como `D-29` no backlog.

### Desfecho — reproduzidas em 2026-08-31 por decisão de João

João mandou resolver todos os achados da review. Medição adicional na referência (ad-hoc, 1440,
`getBoundingClientRect`/`getComputedStyle`) para saber o que a margem negativa faz de fato antes de
copiá-la:

| nó                           | referência       | leitura                                                     |
| ---------------------------- | ---------------- | ----------------------------------------------------------- |
| `#Cursos`                    | `bottom 2625.83` | `paddingBottom 110px`, `marginBottom -105px`                |
| `#Cursos .et_pb_row_5` (CTA) | `bottom 2515.83` | última linha de conteúdo da seção                           |
| `#Contacto`                  | `top 2520.83`    | começa 5px depois da linha do CTA, não 110px                |
| `#Contacto .et_pb_row_6`     | `top 2577.83`    | linha branca, já dentro do `paddingTop 57px` de `#Contacto` |

**A margem negativa não sobrepõe conteúdo: ela cancela 105 dos 110px de `paddingBottom` de
`#Cursos`.** As duas seções têm o mesmo fundo (`rgb(0, 0, 0)`), e a linha branca do contato entra
62px abaixo do fim do CTA. Sem a margem, o clone abria 110px onde a referência abre 5px.

Correção aplicada: `-mb-26.25` em `#Cursos` (`src/components/sections/Cursos.tsx`) e `mb-2.25` na
linha de título do contato, no lugar do `<div className="h-2.25" />` separador
(`src/components/sections/Contacto.tsx`) — o separador produzia a mesma altura pela propriedade
errada, o mesmo defeito do `py-1.25` do rodapé no achado `C-1`.

Medição do clone depois da correção (build de produção local, quatro larguras):

| largura | `#Cursos` `marginBottom` | `#Contacto` `top` − `#Cursos` `bottom` | `contacto.linha` `marginBottom` |
| ------: | ------------------------ | -------------------------------------- | ------------------------------- |
|     375 | `-105px`                 | `-105`                                 | `9px`                           |
|     768 | `-105px`                 | `-105`                                 | `9px`                           |
|    1440 | `-105px`                 | `-105`                                 | `9px`                           |
|    1920 | `-105px`                 | `-105`                                 | `9px`                           |

As duas propriedades passam a bater com a referência nas quatro larguras. `D-29` fechada.
