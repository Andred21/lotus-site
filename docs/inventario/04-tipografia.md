# 04 — Tipografia, cores e tokens

> Evidência: `docs/inventario/styles.json`, capturado em `2026-08-25T19:13:10.575Z` via `pnpm inventario:styles` (4 viewports: 375/768/1440/1920). Commit-base: `4715ddf`. Valores abaixo são do viewport `1440` salvo indicação contrária; cada linha cita o `selector` de `styles.json` para conferência.

## Famílias

| família      | pesos carregados                   | pesos observados no DOM | origem                                       | `font-display` |
| ------------ | ---------------------------------- | ----------------------- | -------------------------------------------- | -------------- |
| `Open Sans`  | 300, 400, 600, 700, 800 + itálicos | 500, 600                | Google Fonts remoto (`fonts.googleapis.com`) | `swap`         |
| `Montserrat` | 100–900 + itálicos                 | 400, 500, 700           | Google Fonts remoto (`fonts.googleapis.com`) | `swap`         |

Fallback stacks medidos: `"Open Sans", Arial, sans-serif` e `Montserrat, Helvetica, Arial, Lucida, sans-serif`.

O Elementor também carrega CSS próprio para `Roboto` e `Roboto Slab` (`wp-content/uploads/elementor/google-fonts/css/{roboto,robotoslab}.css`), mas nenhum elemento medido na home usa essas famílias — ficam registradas aqui como carregadas-mas-não-observadas, prováveis defaults globais do Elementor sem uso nesta página.

## Escala

| papel                           | seletor                             | font-size | font-weight | line-height | letter-spacing |
| ------------------------------- | ----------------------------------- | --------- | ----------- | ----------- | -------------- |
| h1 hero                         | `#Intrucción h1`                    | 60px      | 700         | 78px        | normal         |
| h2 seção                        | `#Cursos h2` / `#Contacto h2`       | 42px      | 700         | 54.6px      | normal         |
| h3 subtítulo (hero)             | `#Intrucción h3`                    | 22px      | 500         | 22px        | normal         |
| h4 destaque (`Somos`)           | `#Somos h4`                         | 22px      | 700         | 30.8px      | normal         |
| corpo — hero                    | `#Intrucción p`                     | 16px      | 500         | 23.8px      | 3px            |
| corpo — institucional (`Somos`) | `#Somos p`                          | 19px      | 500         | 34.2px      | normal         |
| corpo — destaque (`Somos`)      | `#Somos p` (por `h4`, mesma classe) | 19px      | 500         | 34.2px      | normal         |
| corpo — cursos                  | `#Cursos p`                         | 16px      | 500         | 28.8px      | normal         |
| botão                           | `#page-container button`            | 20px      | 700         | 34px        | 2px            |
| menu (label)                    | `#top-menu a`                       | 18px      | 600         | 14px        | normal         |
| campo de formulário             | `#et_pb_contact_name_0`             | 16px      | 400         | normal      | normal         |

`Contacto p` mediu `42px 700 54.6px` — idêntico ao `h2` da mesma seção — porque o primeiro `<p>` que o script encontra dentro de `#Contacto` fica visualmente próximo do título; a régua de conteúdo (`contacto.body` em `02-conteudo.md`) descreve o texto certo, mas o valor tipográfico real do corpo do formulário precisa ser conferido contra o baseline visual (`06-baseline.md`) antes de virar token — registrado aqui como pendência de conferência, não como fato.

## Paleta

| hex       | onde aparece                                                               | papel                              |
| --------- | -------------------------------------------------------------------------- | ---------------------------------- |
| `#000000` | fundo de `#Intrucción`, `#Cursos`, `#Contacto` (seções escuras)            | cor de fundo — seção escura        |
| `#f0f0f0` | fundo de `#Somos`; fundo/cor de texto do botão (`#545454` sobre `#f0f0f0`) | cor de fundo — seção clara / botão |
| `#f7f7f7` | texto do `h1` sobre fundo escuro                                           | texto — título sobre escuro        |
| `#333333` | texto de `h2`/`h3` sobre fundo claro                                       | texto — título sobre claro         |
| `#666666` | texto de corpo default (`body`, wrappers)                                  | texto — corpo neutro               |
| `#545454` | texto de corpo institucional (`Somos p`) e texto do botão                  | texto — corpo secundário / botão   |
| `#353740` | texto de `h4` (`Somos`) e dos campos de formulário                         | texto — destaque / formulário      |
| `#2ea3f2` | links de conteúdo (`a` fora do menu) e ícones                              | cor de destaque — link             |
| `#24a2e0` | links do menu (`top-menu a`)                                               | cor de destaque — menu             |
| `#222222` | fundo de `#main-footer`                                                    | cor de fundo — rodapé              |
| `#ffffff` | fundo dos campos de formulário                                             | cor de fundo — input               |

O par `#2ea3f2` (links de conteúdo) e `#24a2e0` (links de menu) são dois azuis próximos, não o mesmo token — mantidos separados porque a medição não encontrou um só valor usado nos dois lugares.

O CTA `Learn More` (`#Intrucción a`) mediu `color`, `background-color` e `border-color` idênticos — `rgb(0, 0, 0)` os três, com borda de `4px`. Sobre o fundo igualmente preto de `#Intrucción`, isso é um botão sem contraste nos valores computados; se ele aparece visível no baseline (`06-baseline.md`) é por outro efeito (hover, ícone, sombra) não capturado por `getComputedStyle` em repouso — registrado como achado, decisão de tratamento fica para a Sprint 2.

## Borda e sombra

| elemento                   | `border-radius`  | `box-shadow`                                                          |
| -------------------------- | ---------------- | --------------------------------------------------------------------- |
| botões (`button`, CTA `a`) | `100px` (pílula) | `none`                                                                |
| cabeçalho (`#main-header`) | `0px`            | `rgba(0, 0, 0, 0.1) 0px 1px 0px 0px` (linha inferior sutil)           |
| campos de formulário       | `0px`            | `rgba(0, 0, 0, 0.18) 0px -1px 0px 0px inset` (linha inferior interna) |
| demais elementos medidos   | `0px`            | `none`                                                                |

Nenhum elemento medido usa `border-radius` intermediário — é `0px` (retangular) ou `100px` (pílula/círculo), sem meio-termo.
