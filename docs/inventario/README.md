# Inventário do site — `lotusotec.cl`

> Sprint 1 do clone (EAP `2.1.1`–`2.1.10`). Toda evidência bruta fica em `dom.json`, `styles.json`, `assets/manifest.json` e `baseline/*.png`; os documentos abaixo são redigidos sobre essa evidência, capturada em `2026-08-25`: `dom.json` `sha256` `0d8a8d45a434de23…`, `styles.json` `cb3e5bfb6e5400e9…`, `assets/manifest.json` `3065570bf6e1502f…`.

## Índice

| documento                                | propósito                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`01-estrutura.md`](./01-estrutura.md)   | seções da home, menu, CTAs, navegação, página residual, endpoints WordPress                 |
| [`02-conteudo.md`](./02-conteudo.md)     | todo texto visível da home, transcrito verbatim, com chave estável por trecho               |
| [`03-assets.md`](./03-assets.md)         | assets visuais baixados, com origem, host, `sha256` e candidato local (`src/` vs `public/`) |
| [`04-tipografia.md`](./04-tipografia.md) | famílias, escala tipográfica, paleta de cor, borda e sombra                                 |
| [`05-layout.md`](./05-layout.md)         | container, altura por seção, espaçamento vertical, grid interno, breakpoints observados     |
| [`06-baseline.md`](./06-baseline.md)     | capturas de tela full-page nos 4 viewports-alvo + estado de menu mobile aberto              |
| [`07-formulario.md`](./07-formulario.md) | contrato observado do formulário de contato (nunca submetido — decisão D5)                  |
| [`08-seo.md`](./08-seo.md)               | `<head>`, robots.txt, sitemap, hierarquia de headings, URLs publicadas                      |
| [`09-dados.md`](./09-dados.md)           | dados institucionais e links externos, com status `verificado`/`pendente João`              |

## Como regerar

```bash
pnpm inventario:dom       # 1º — grava dom.json; os outros três leem esse arquivo
pnpm inventario:assets    # baixa docs/inventario/assets/*, grava manifest.json
pnpm inventario:styles    # grava styles.json (tipografia/cor/layout, 4 viewports)
pnpm inventario:baseline  # grava baseline/*.png (screenshots full-page)
```

`dom.json` precisa vir primeiro: `fetch-assets.mjs` lê `assets[]` e `extract-styles.mjs` lê `sections[]`. `capture-baseline.mjs` é independente, mas mantém a ordem para reprodutibilidade.

Depois de regerar, rode `pnpm format`: os scripts gravam com `JSON.stringify(…, null, 2)` e o Prettier reindenta arrays curtos, então sem esse passo `pnpm format:check` fica vermelho. Os `sha256` citados no cabeçalho de cada documento são do arquivo **depois** do `pnpm format` — carimbar antes produz hash que não identifica os bytes versionados. `inventario.test.mjs` falha quando um documento cita hash que não pertence a nenhuma evidência versionada. O que o aceite compara entre execuções é o conteúdo de `assets[]` (URL, `bytes`, `sha256`, ordenado por URL), não os bytes do arquivo formatado — `capturedAt` muda a cada corrida por ser metadado de execução.

## Matriz de paridade

`decisão` restrita a `fiel` (o clone reproduz como está), `divergência intencional` (o clone muda de propósito, listado abaixo) ou `pendente decisão` (depende de João).

| item                                                   | seção/id                                                                                                                                           | decisão                   | justificativa                                                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero                                                   | `Intrucción`                                                                                                                                       | `fiel`                    | título, subtítulo, corpo e imagem replicados como medidos (`01`–`06`)                                                                              |
| CTA do hero                                            | `Intrucción` (link `Learn More`)                                                                                                                   | `fiel`                    | reproduzido como medido, invisibilidade inclusa — decisão D1 do bloco `3.1.1-3.2.11` (2026-08-25)                                                  |
| Institucional                                          | `Somos`                                                                                                                                            | `fiel`                    | texto e 3 destaques replicados como medidos: linha 1 com `320px`+`700px` e vão de `59.39px`, linha 2 com 3 colunas de `320px` (`02`, `05`)         |
| Destaque "ALUMNOS"                                     | `Somos` (`h4` `ALUMNOS`)                                                                                                                           | `fiel`                    | rótulo e corpo verbatim, inconsistência preservada — decisão D2 do bloco `3.1.1-3.2.11` (2026-08-25)                                               |
| Grade de cursos                                        | `Cursos`                                                                                                                                           | `fiel`                    | 3 cards em 3 colunas Divi de `320px` (`05`), nomes e imagens replicados; CTA `See More` tem a mesma ressalva do CTA do hero                        |
| CTA "See More"                                         | `Cursos` (link `See More`)                                                                                                                         | `fiel`                    | mesma condição do CTA do hero — decisão D1 (2026-08-25)                                                                                            |
| Formulário de contato                                  | `Contacto`, `et_pb_contact_form_0`, `et_pb_contact_name_0`, `et_pb_contact_email_0`, `et_pb_contact_company_0`, `et_pb_contact_message_0`          | `divergência intencional` | backend muda de PHP/Divi para solução própria do clone estático — contrato em `07-formulario.md`                                                   |
| Menu principal                                         | `main-header`, `et-top-navigation`, `top-menu-nav`, `top-menu`, `menu-item-47811`, `menu-item-47885`, `menu-item-47886`, `menu-item-47887`, `logo` | `fiel`                    | 4 itens, mesmos destinos por âncora, mesmo breakpoint mobile/desktop observado (`01`, `05`)                                                        |
| Rodapé                                                 | `main-footer`, `footer-bottom`                                                                                                                     | `fiel`                    | ano `2022` publicado, mantido verbatim — decisão D2 (2026-08-25)                                                                                   |
| Wrappers estruturais                                   | `page-container`, `et-main-area`, `main-content`, `post-47805`                                                                                     | `divergência intencional` | são artefatos do Divi Builder (wrappers de página/post do WordPress); o clone não precisa desses `id`, só do conteúdo que eles envolvem            |
| Google Fonts                                           | (tipografia global)                                                                                                                                | `divergência intencional` | remoto (`fonts.googleapis.com`) hoje vs. self-host proposto — ver seção abaixo                                                                     |
| Host de assets `stackstaging`                          | logo do header, imagem de `Somos`, 3 imagens de curso, foto do hero, textura de fundo                                                              | `divergência intencional` | 7 assets vêm hoje de `lotusotec-cl.us.stackstaging.com`, em `http://` dentro de página `https://`; o clone serve todos localmente (`03-assets.md`) |
| Favicon e ícones                                       | `<head>`                                                                                                                                           | `fiel`                    | 4 arquivos publicados (32×32, 180×180, 192×192, 270×270) — vão para `public/` no clone (`03-assets.md`, `08-seo.md`)                               |
| Imagens responsivas (`srcset`)                         | `Somos`, `Cursos`                                                                                                                                  | `divergência intencional` | variantes fora; cada imagem entra cheia — decisão D4 (2026-08-25)                                                                                  |
| `/wp-json`, `/xmlrpc.php`, `/feed/`, `/comments/feed/` | (endpoints WordPress)                                                                                                                              | `divergência intencional` | sem equivalente funcional num site estático (`01-estrutura.md`)                                                                                    |
| Página residual `/http-18-230-15-185/`                 | (fora da navegação)                                                                                                                                | `pendente decisão`        | sem link de entrada hoje; João decide se cria redirect, 404 proposital ou ignora (`01-estrutura.md`, `08-seo.md`)                                  |
| `meta description` / tags `og:`/`twitter:`             | `<head>`                                                                                                                                           | `divergência intencional` | ausentes hoje; propostos para o clone (`08-seo.md`)                                                                                                |
| `preloader.gif` do Divi                                | tema Divi (`wp-content/themes/Divi-3/`)                                                                                                            | `divergência intencional` | spinner de carregamento do WordPress/Divi; sem equivalente num build estático Vite                                                                 |
| `lang` do `<html>`                                     | `<head>`                                                                                                                                           | `divergência intencional` | `es` → `es-CL`, pedido pelo aceite da EAP `3.1.1` (D8); sem efeito visual (`08-seo.md`)                                                            |
| `<label>` dos campos do formulário                     | `Contacto`                                                                                                                                         | `divergência intencional` | rótulo oculto por campo, `placeholder` visível intacto — zero pixel (D9)                                                                           |
| `alt` das imagens de conteúdo                          | `Somos`, `Cursos`                                                                                                                                  | `divergência intencional` | `alt=""` → descrição real — zero pixel (D9)                                                                                                        |
| Ícones dos três destaques                              | `Somos`                                                                                                                                            | `divergência intencional` | glifo `ETmodules` do Divi → `lucide-react`, desenho aproximado (2026-08-25)                                                                        |
| `background-texture.jpg`                               | `Intrucción`                                                                                                                                       | `divergência intencional` | catalogado, sem pixel visível no baseline (fundo `#000000` em 100% da amostra); não portado                                                        |
| Menu duplicado no DOM                                  | `main-header`                                                                                                                                      | `divergência intencional` | o Divi renderiza o menu duas vezes (fixo + sticky); o clone renderiza uma vez                                                                      |
| Estado sticky do cabeçalho                             | `main-header`                                                                                                                                      | `divergência intencional` | o Divi encolhe o cabeçalho ao rolar; o clone mantém a altura medida (`80px`/`94px`)                                                                |
| Quebra de linha do hero em 1440                        | `Intrucción`                                                                                                                                       | `divergência intencional` | a coluna de texto do clone é mais larga que a do Divi: `LOTUS OTEC` fica em uma linha, não duas — nenhum valor medido cobre a diferença            |

## Divergências intencionais propostas

1. **Google Fonts**: hoje carregado remoto de `fonts.googleapis.com` (`Open Sans`, `Montserrat`, `display=swap`); proposta é self-host no clone para não depender de rede externa em runtime (`04-tipografia.md`).
2. **Host de assets**: os 7 assets servidos por `lotusotec-cl.us.stackstaging.com` (staging de terceiro, em `http://`) passam a ser servidos pelo próprio clone. Três deles — a foto de fundo do hero, a textura de seção e o **logo do cabeçalho** — existem **só** nesse host, sem cópia catalogada em `lotusotec.cl` (`03-assets.md`).
3. **Endpoints WordPress** (`/wp-json/`, `/xmlrpc.php`, `/feed/`, `/comments/feed/`): não existem no clone estático — não há CMS por trás (`01-estrutura.md`).
4. **Página residual** `/http-18-230-15-185/`: sem link de entrada hoje; decisão de recriar, redirecionar ou deixar de fora é de João (`01-estrutura.md`).
5. **`meta description` e tags `og:`**: ausentes hoje; propostas para criação no clone, já que SEO básico se beneficia delas (`08-seo.md`).
6. **`preloader.gif` do Divi**: spinner de carregamento do tema WordPress; sem equivalente necessário num build estático Vite.
7. **Fontes self-hosted**: 5 faces (`Open Sans` 500/600, `Montserrat` 400/500/700, subset `latin`) em `src/assets/fonts/`; nenhuma requisição a `fonts.googleapis.com` em runtime, provado por E2E (D6).
8. **`lang` `es` → `es-CL`**: pedido pelo aceite da EAP `3.1.1` (D8).
9. **Rótulo e `alt` acessíveis**: `<label>` oculto por campo e `alt` descritivo nas imagens de conteúdo, sem mudar um pixel (D9).
10. **Ícones dos destaques e do menu mobile**: `lucide-react` no lugar dos glifos `ETmodules` do Divi.
11. **`background-texture.jpg`**: não portado — não pinta pixel visível no baseline.
12. **Estrutura do cabeçalho**: menu renderizado uma vez e sem estado sticky.

## Pendências de João

Consolidado de `09-dados.md`:

1. Validade atual da certificação `NCH 2728:2015` / `CA-751` / `INN: A-10981`.
2. O número `888 horas` sob o rótulo `ALUMNOS` (`Somos`) — manter a inconsistência do site original ou corrigir.
3. Carga horária, público-alvo e descrição completa de cada um dos 3 cursos.
4. Ano de copyright do rodapé (`2022`).
5. Destino da página residual `/http-18-230-15-185/` (`01-estrutura.md`).
6. Se os CTAs `Learn More` e `See More` — hoje invisíveis no site real (`06-baseline.md`) — devem ganhar contraste no clone ou se há intenção original a preservar.

Os itens 2, 4 e 6 foram decididos por João em 2026-08-25, no bloco `3.1.1-3.2.11`: manter o texto verbatim (inclusive `888 horas` sob `ALUMNOS`), manter o ano `2022` e reproduzir os dois CTAs como estão. Os itens 1, 3 e 5 continuam abertos.
