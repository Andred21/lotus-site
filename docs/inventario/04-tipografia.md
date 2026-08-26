# 04 — Tipografia, cores e tokens

> Evidência: `docs/inventario/styles.json` (`sha256` `cb3e5bfb6e5400e9…`), capturado em `2026-08-25T20:51:25.721Z` via `pnpm inventario:styles` (4 viewports: 375/768/1440/1920), sobre `docs/inventario/dom.json` (`sha256` `0d8a8d45a434de23…`). Valores abaixo são do viewport `1440` salvo indicação contrária; cada linha cita o `selector` de `styles.json` para conferência.

## Famílias

| família      | pesos carregados                   | pesos observados no DOM | origem                                       | `font-display` |
| ------------ | ---------------------------------- | ----------------------- | -------------------------------------------- | -------------- |
| `Open Sans`  | 300, 400, 600, 700, 800 + itálicos | 500, 600                | Google Fonts remoto (`fonts.googleapis.com`) | `swap`         |
| `Montserrat` | 100–900 + itálicos                 | 400, 500, 700           | Google Fonts remoto (`fonts.googleapis.com`) | `swap`         |

Fallback stacks medidos: `"Open Sans", Arial, sans-serif` e `Montserrat, Helvetica, Arial, Lucida, sans-serif`.

O Elementor também carrega CSS próprio para `Roboto` e `Roboto Slab` (`wp-content/uploads/elementor/google-fonts/css/{roboto,robotoslab}.css`), mas nenhum elemento medido na home usa essas famílias — ficam registradas aqui como carregadas-mas-não-observadas, prováveis defaults globais do Elementor sem uso nesta página.

## Escala

| papel                           | seletor                             | font-size  | font-weight | line-height | letter-spacing | cor       |
| ------------------------------- | ----------------------------------- | ---------- | ----------- | ----------- | -------------- | --------- |
| h1 hero                         | `#Intrucción h1`                    | 60px       | 700         | 78px        | normal         | `#24a2e0` |
| h2 seção — cursos               | `#Cursos h2`                        | 42px       | 700         | 54.6px      | normal         | `#24a2e0` |
| h2 seção — contacto             | `#Contacto h2`                      | 42px       | 700         | 54.6px      | normal         | `#333333` |
| h3 subtítulo (hero)             | `#Intrucción h3`                    | 22px       | 500         | 22px        | normal         | `#f0f0f0` |
| h4 destaque (`Somos`)           | `#Somos h4`                         | 22px       | 700         | 30.8px      | normal         | `#353740` |
| corpo — hero                    | `#Intrucción p`                     | 16px       | 500         | 23.8px      | 3px            | `#f0f0f0` |
| corpo — institucional (`Somos`) | `#Somos p`                          | 19px       | 500         | 34.2px      | normal         | `#545454` |
| corpo — destaque (`Somos`)      | `#Somos p` (por `h4`, mesma classe) | 19px       | 500         | 34.2px      | normal         | `#747d88` |
| corpo — cursos                  | `#Cursos p`                         | 16px       | 500         | 28.8px      | normal         | `#f0f0f0` |
| corpo — contacto                | `#Contacto p`                       | não medido | não medido  | não medido  | não medido     | `#353740` |
| botão                           | `#page-container button`            | 20px       | 700         | 34px        | 2px            | `#545454` |
| menu (label)                    | `#top-menu a`                       | 18px       | 600         | 14px        | normal         | `#24a2e0` |
| campo de formulário             | `#et_pb_contact_name_0`             | 16px       | 400         | normal      | normal         | `#353740` |

Três medições desta página descreviam o nó-eco escondido que o Divi duplica (`hero.title_subtitle_echo`, `02-conteudo.md`), não o elemento pintado: `#Intrucción h1`, `#Intrucción h3` e `#Cursos h2` foram medidos com a cor default do tema (`#f7f7f7`/`#333333`), enquanto a página pinta `#24a2e0`, `#f0f0f0` e `#24a2e0`. `#Contacto p` alcança um parágrafo vazio de altura `0px`, cujo estilo computado é o do `h2` vizinho; o corpo real de `#Contacto` é `#353740`. As quatro correções vêm de `node scripts/inventario/sample-baseline.mjs`, que amostra os PNG de `baseline/` — evidência congelada, com `sha256` citado em `06-baseline.md`.

`extract-styles.mjs` nunca capturou `text-transform`: a propriedade não está em `styles.json`. Os PNG de `baseline/` mostram `h2` de seção e o botão `Enviar` pintados em caixa alta (`NUESTROS CURSOS`, `ENVIAR`) enquanto o DOM publica `NUESTRos cursos` e `Enviar` — o tema aplica `text-transform: uppercase`. O clone reproduz a caixa visual pelo utilitário `uppercase` e mantém a string do conteúdo verbatim. Fechar a lacuna no extrator é débito de inventário.

## Paleta

| hex       | onde aparece                                                               | papel                              |
| --------- | -------------------------------------------------------------------------- | ---------------------------------- |
| `#000000` | fundo de `#Intrucción`, `#Cursos`, `#Contacto` (seções escuras)            | cor de fundo — seção escura        |
| `#f0f0f0` | fundo de `#Somos`; fundo/cor de texto do botão (`#545454` sobre `#f0f0f0`) | cor de fundo — seção clara / botão |
| `#f7f7f7` | divisória entre itens do menu mobile (amostrada em `home-375-menu.png`)    | linha — separador de menu          |
| `#333333` | texto de `h2`/`h3` sobre fundo claro                                       | texto — título sobre claro         |
| `#666666` | texto de corpo default (`body`, wrappers)                                  | texto — corpo neutro               |
| `#545454` | texto de corpo institucional (`Somos p`) e texto do botão                  | texto — corpo secundário / botão   |
| `#353740` | texto de `h4` (`Somos`) e dos campos de formulário                         | texto — destaque / formulário      |
| `#2ea3f2` | links de conteúdo (`a` fora do menu) e ícones                              | cor de destaque — link             |
| `#24a2e0` | links do menu (`top-menu a`)                                               | cor de destaque — menu             |
| `#f8f8f8` | fundo de `#main-header` em 1440/1920                                       | cor de fundo — cabeçalho desktop   |
| `#ffffff` | fundo de `#main-header` em 375/768                                         | cor de fundo — cabeçalho mobile    |
| `#323232` | faixa visível de `#main-footer`/`#footer-bottom`                           | cor de fundo — rodapé              |
| `#747d88` | corpo dos três destaques de `#Somos`                                       | texto — destaque secundário        |

O cabeçalho é o único elemento medido que troca de cor de fundo entre viewports: `#main-header` pinta `#f8f8f8` em `1440` e `1920` e `#ffffff` em `375` e `768` (amostragem do baseline). São dois tokens distintos, não um valor com ressalva — a Sprint 2 precisa reproduzir a troca, não escolher um dos dois.

`getComputedStyle` devolve `rgba(0, 0, 0, 0.03)` para o fundo do cabeçalho e `rgbToHex` descartava o alpha, publicando `#000000` numa faixa que a tela pinta `#f8f8f8`. `cssColor` em `lib/site.mjs` preserva o alpha; a faixa do rodapé caía no mesmo erro (`#545454` na tabela, `#323232` na tela).

O par `#2ea3f2` (links de conteúdo) e `#24a2e0` (links de menu) são dois azuis próximos, não o mesmo token — mantidos separados porque a medição não encontrou um só valor usado nos dois lugares.

Os campos do formulário **não têm fundo próprio**: `#et_pb_contact_name_0`, `_email_0`, `_company_0` e `_message_0` medem `background-color: transparent` nos quatro viewports (o CSS publicado usa `rgba(255,255,255,0)`, branco com alpha zero). O que se vê atrás do campo é o `#f0f0f0` do painel `#et_pb_contact_form_0`. Um clone que pinte o input de branco quebra paridade — o token de fundo do formulário é `#f0f0f0`, no painel, não no campo.

O CTA `Learn More` (`#Intrucción a`) mediu `color`, `background-color` e `border-color` idênticos — `#000000` os três, com `border-width: 4px` e `border-style: solid` (`#Intrucción a` em `styles.json`). Sobre o fundo igualmente preto de `#Intrucción`, isso é um botão sem contraste nos valores computados; se ele aparece visível no baseline (`06-baseline.md`) é por outro efeito (hover, ícone, sombra) não capturado por `getComputedStyle` em repouso — registrado como achado, decisão de tratamento fica para a Sprint 2.

## Borda e sombra

| elemento                   | `border-radius`  | `box-shadow`                                                          |
| -------------------------- | ---------------- | --------------------------------------------------------------------- |
| botões (`button`, CTA `a`) | `100px` (pílula) | `none`                                                                |
| cabeçalho (`#main-header`) | `0px`            | `rgba(0, 0, 0, 0.1) 0px 1px 0px 0px` (linha inferior sutil)           |
| campos de formulário       | `0px`            | `rgba(0, 0, 0, 0.18) 0px -1px 0px 0px inset` (linha inferior interna) |
| demais elementos medidos   | `0px`            | `none`                                                                |

Larguras de borda medidas (`borderWidth`/`borderColor`/`borderStyle` em `styles.json`): CTA de conteúdo (`#Intrucción a`) `4px solid #000000`; botão `Enviar` (`#et_pb_contact_form_0 button`) `5px solid rgb(84, 84, 84)`; links de menu e demais `a` medem `0px` com `border-style: none`.

Nenhum elemento medido usa `border-radius` intermediário — é `0px` (retangular) ou `100px` (pílula/círculo), sem meio-termo.
