# 05 — Containers, grid, espaçamento e breakpoints

> Evidência: `docs/inventario/styles.json` (`sha256` `cb3e5bfb6e5400e9…`), capturado em `2026-08-25T20:51:25.721Z` via `pnpm inventario:styles` (4 viewports: 375/768/1440/1920), sobre `docs/inventario/dom.json` (`sha256` `5f4d41cf10641ce2…`). `extract-styles.mjs` mede cada `.et_pb_row` e cada `.et_pb_column` da seção individualmente (`#<seção> .et_pb_row[i]`, `#<seção> .et_pb_column[i]`), além de `maxWidth`, `padding`, `margin` e borda.

## Container

O wrapper de página (`#page-container`, `#et-main-area`, `#main-content`, `#post-47805`) tem `max-width: 100%` e ocupa a largura inteira do viewport nos quatro tamanhos medidos — ele não é o container de conteúdo.

O container real é `.et_pb_row` (linha do Divi) dentro de cada seção, com `max-width: 1080px`:

| seção      | 375   | 768   | 1440   | 1920   |
| ---------- | ----- | ----- | ------ | ------ |
| `Somos`    | 300px | 614px | 1080px | 1080px |
| `Cursos`   | 300px | 614px | 1080px | 1080px |
| `Contacto` | 300px | 614px | 1080px | 1080px |

Abaixo de 1080px de viewport disponível, a linha ocupa o espaço todo (`width` = largura do viewport, já descontada a calha do body); a partir de ~1080px de conteúdo disponível, ela trava em `1080px` e fica centralizada. `Intrucción` (hero) é exceção: seu `.et_pb_row` mede `max-width: 100%` — o hero é full-bleed, sem o teto de `1080px` das demais seções.

Padding lateral (`paddingLeft`/`paddingRight`) do próprio `.et_pb_row` é `0px` em todos os viewports e seções, e o das colunas também: `#Somos .et_pb_column[*]` e `#Cursos .et_pb_column[*]` medem `padding-left: 0px` nos quatro viewports. A calha lateral vem da própria largura da linha (`max-width: 1080px` centralizada) e, no mobile, da margem do body — não de padding de coluna. A exceção é o hero: `#Intrucción .et_pb_column[0]` tem `padding-left` proporcional ao viewport (`30px` em 375, `61.4px` em 768, `115.2px` em 1440, `153.6px` em 1920).

## Altura por seção

| seção         | 375    | 768    | 1440  | 1920  |
| ------------- | ------ | ------ | ----- | ----- |
| `Intrucción`  | 774px  | 568px  | 831px | 798px |
| `Somos`       | 1974px | 1875px | 865px | 865px |
| `Cursos`      | 1630px | 1522px | 809px | 809px |
| `Contacto`    | 1010px | 893px  | 867px | 867px |
| `main-footer` | 78px   | 54px   | 54px  | 54px  |

`Somos` e `Cursos` quase dobram de altura no mobile (conteúdo empilha em vez de ficar lado a lado — coerente com o container de `1080px` não caber e o layout de colunas colapsar). `Contacto` varia pouco porque o formulário já é de coluna única em todos os tamanhos.

## Espaçamento vertical

| seção      | padding-top | padding-bottom |
| ---------- | ----------- | -------------- |
| `Somos`    | `110px`     | `16px`         |
| `Cursos`   | `0px`       | `110px`        |
| `Contacto` | `57px`      | `58px`         |

Os três valores são idênticos nos quatro viewports — o espaçamento vertical entre seções é fixo em `px`, não responsivo (não usa `vw`, `%`, nem `clamp()`). O cabeçalho fixo reserva `padding-top` no `#page-container`: `79px` em 375/768 (header de `80px` de altura) e `94px` em 1440/1920 (header de `94px` de altura) — o valor muda porque o próprio header muda de altura, não porque o espaçamento é responsivo por si.

## Grid interno

Cada linha e cada coluna do Divi foi medida individualmente. Larguras em px, por viewport:

| seção        | linha | colunas (375)   | colunas (768)   | colunas (1440)  | colunas (1920)  | conteúdo                            |
| ------------ | ----- | --------------- | --------------- | --------------- | --------------- | ----------------------------------- |
| `Intrucción` | `[0]` | 375 / 0         | 768 / 0         | 720 / 720       | 960 / 960       | hero: texto + CTA (2ª coluna vazia) |
| `Somos`      | `[0]` | 300 / 300       | 614 / 614       | 320 / 700       | 320 / 700       | logo institucional + texto          |
| `Somos`      | `[1]` | 300 / 300 / 300 | 614 / 614 / 614 | 320 / 320 / 320 | 320 / 320 / 320 | os 3 destaques                      |
| `Cursos`     | `[0]` | 300             | 614             | 1080            | 1080            | título + intro                      |
| `Cursos`     | `[1]` | 300 / 300 / 300 | 614 / 614 / 614 | 320 / 320 / 320 | 320 / 320 / 320 | os 3 cards de curso                 |
| `Cursos`     | `[2]` | 300             | 614             | 1080            | 1080            | CTA `See More`                      |
| `Contacto`   | `[0]` | 300             | 614             | 1080            | 1080            | título + texto                      |
| `Contacto`   | `[1]` | 300             | 614             | 1080            | 1080            | formulário                          |

Vão entre colunas: o Divi não usa `gap` (`gap: normal` em toda linha medida). O vão vem de `margin-right` da coluna — `59.3906px` em `1440` e `1920` para as colunas que não são a última da linha, e `0px` em `375` e `768`, onde as colunas empilham em largura cheia.

Isso corrige duas leituras anteriores: os 3 destaques de `Somos` ficam em **linha própria** (`[1]`), abaixo da linha logo+texto, não distribuídos nas duas colunas de `[0]`; e os 3 cards de `Cursos` **são** 3 colunas Divi de `320px` na linha `[1]`, não um módulo interno dentro de uma coluna full-width.

## Breakpoints

Os únicos breakpoints observáveis com os quatro viewports medidos:

- **Menu desktop → menu mobile**: `top-menu`/`top-menu-nav` medem `0×0` (ocultos) em `375` e `768`, e aparecem com largura real em `1440` (`394px`) e `1920`. O breakpoint está em algum ponto entre `768px` e `1440px` — os quatro viewports do inventário não permitem apontar o valor exato.
- **Container `1080px`**: `Somos`/`Cursos`/`Contacto` atingem o teto de `1080px` em `1440` e `1920`, e ficam abaixo dele (acompanhando o viewport) em `375` e `768`. O breakpoint de container fica, por definição, em `1080px` de viewport disponível — não é um valor observado por tentativa, é o próprio `max-width` do Divi.

Ambos são breakpoints observados por amostragem em quatro larguras, não valores declarados lidos de CSS — se a Sprint 2 precisar do breakpoint exato do menu, a medição precisa rodar em viewports intermediários (ex. `900px`, `1000px`, `1100px`).
