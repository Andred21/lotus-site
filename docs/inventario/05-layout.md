# 05 — Containers, grid, espaçamento e breakpoints

> Evidência: `docs/inventario/styles.json`, capturado em `2026-08-25T19:17:16.591Z` via `pnpm inventario:styles` (4 viewports: 375/768/1440/1920). Commit-base: `c99c400`. `extract-styles.mjs` foi estendido nesta task para medir `maxWidth`, `paddingLeft` e `paddingRight`, além de incluir o seletor `.et_pb_row` (container de conteúdo do Divi) — campos que as tasks anteriores não precisavam e por isso não existiam em `styles.json`.

## Container

O wrapper de página (`#page-container`, `#et-main-area`, `#main-content`, `#post-47805`) tem `max-width: 100%` e ocupa a largura inteira do viewport nos quatro tamanhos medidos — ele não é o container de conteúdo.

O container real é `.et_pb_row` (linha do Divi) dentro de cada seção, com `max-width: 1080px`:

| seção      | 375   | 768   | 1440   | 1920   |
| ---------- | ----- | ----- | ------ | ------ |
| `Somos`    | 300px | 614px | 1080px | 1080px |
| `Cursos`   | 300px | 614px | 1080px | 1080px |
| `Contacto` | 300px | 614px | 1080px | 1080px |

Abaixo de 1080px de viewport disponível, a linha ocupa o espaço todo (`width` = largura do viewport, já descontada a calha do body); a partir de ~1080px de conteúdo disponível, ela trava em `1080px` e fica centralizada. `Intrucción` (hero) é exceção: seu `.et_pb_row` mede `max-width: 100%` — o hero é full-bleed, sem o teto de `1080px` das demais seções.

Padding lateral (`paddingLeft`/`paddingRight`) do próprio `.et_pb_row` é `0px` em todos os viewports e seções — a calha visual entre o card e a borda da tela (perceptível no baseline visual, `06-baseline.md`) vem de um nível mais interno (`.et_pb_column`), não medido nesta passagem.

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

`Somos`: `.et_pb_row` tem 2 colunas Divi (`et_pb_column_1_3` e `et_pb_column_2_3`), medidas em 1440px como `320px` + `700px`, com `59px` de vão entre elas. As 3 estatísticas (`ENERGIZADAS`/`ALUMNOS`/`CERTIFICACIÓN`, ver `04-tipografia.md`) e o texto institucional ficam distribuídos entre essas duas colunas — qual conteúdo cai em qual coluna não foi remedido nesta task; conferir contra o baseline visual.

`Cursos`: os 3 cards de curso **não** são 3 colunas Divi — o `.et_pb_row` tem uma única coluna (`et_pb_column_4_4`) full-width contendo os três cards. O grid de cards é produzido por um módulo interno (galeria/blurb) um nível abaixo da coluna, não resolvido nesta medição — `gap`/número de colunas do grid de cards fica como pendência para a Sprint 2 ler direto do baseline visual ou inspecionar a página ao vivo.

## Breakpoints

Os únicos breakpoints observáveis com os quatro viewports medidos:

- **Menu desktop → menu mobile**: `top-menu`/`top-menu-nav` medem `0×0` (ocultos) em `375` e `768`, e aparecem com largura real em `1440` (`394px`) e `1920`. O breakpoint está em algum ponto entre `768px` e `1440px` — os quatro viewports do inventário não permitem apontar o valor exato.
- **Container `1080px`**: `Somos`/`Cursos`/`Contacto` atingem o teto de `1080px` em `1440` e `1920`, e ficam abaixo dele (acompanhando o viewport) em `375` e `768`. O breakpoint de container fica, por definição, em `1080px` de viewport disponível — não é um valor observado por tentativa, é o próprio `max-width` do Divi.

Ambos são breakpoints observados por amostragem em quatro larguras, não valores declarados lidos de CSS — se a Sprint 2 precisar do breakpoint exato do menu, a medição precisa rodar em viewports intermediários (ex. `900px`, `1000px`, `1100px`).
