# Inventário do site — `lotusotec.cl`

> Sprint 1 do clone (EAP `2.1.1`–`2.1.10`). Toda evidência bruta fica em `dom.json`, `styles.json`, `assets/manifest.json` e `baseline/*.png`; os documentos abaixo são redigidos sobre essa evidência. Commit-base deste README: `5ca69d1`.

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

`dom.json` precisa vir primeiro: `fetch-assets.mjs` e `extract-styles.mjs` leem os `sections[]` que ele grava. `capture-baseline.mjs` é independente, mas mantém a ordem para reprodutibilidade.

## Matriz de paridade

`decisão` restrita a `fiel` (o clone reproduz como está), `divergência intencional` (o clone muda de propósito, listado abaixo) ou `pendente decisão` (depende de João).

| item                                                   | seção/id                                                                                                                                           | decisão                   | justificativa                                                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero                                                   | `Intrucción`                                                                                                                                       | `fiel`                    | título, subtítulo, corpo e imagem replicados como medidos (`01`–`06`)                                                                              |
| CTA do hero                                            | `Intrucción` (link `Learn More`)                                                                                                                   | `pendente decisão`        | hoje é invisível no site real — cor/fundo/borda idênticos (`04-tipografia.md`, `06-baseline.md`); Sprint 2 decide se corrige ou reproduz o defeito |
| Institucional                                          | `Somos`                                                                                                                                            | `fiel`                    | texto, 2 colunas (`320px`+`700px`, gap `59px`), 3 destaques — replicados como medidos (`02`, `05`)                                                 |
| Destaque "ALUMNOS"                                     | `Somos` (`h4` `ALUMNOS`)                                                                                                                           | `pendente decisão`        | rótulo e conteúdo divergem no site original (`02-conteudo.md`, `09-dados.md`) — João decide se corrige                                             |
| Grade de cursos                                        | `Cursos`                                                                                                                                           | `fiel`                    | 3 cards, nomes e imagens replicados; CTA `See More` tem a mesma ressalva do CTA do hero                                                            |
| CTA "See More"                                         | `Cursos` (link `See More`)                                                                                                                         | `pendente decisão`        | mesma condição de invisibilidade do CTA do hero (`06-baseline.md`)                                                                                 |
| Formulário de contato                                  | `Contacto`, `et_pb_contact_form_0`, `et_pb_contact_name_0`, `et_pb_contact_email_0`, `et_pb_contact_company_0`, `et_pb_contact_message_0`          | `divergência intencional` | backend muda de PHP/Divi para solução própria do clone estático — contrato em `07-formulario.md`                                                   |
| Menu principal                                         | `main-header`, `et-top-navigation`, `top-menu-nav`, `top-menu`, `menu-item-47811`, `menu-item-47885`, `menu-item-47886`, `menu-item-47887`, `logo` | `fiel`                    | 4 itens, mesmos destinos por âncora, mesmo breakpoint mobile/desktop observado (`01`, `05`)                                                        |
| Rodapé                                                 | `main-footer`, `footer-bottom`                                                                                                                     | `pendente decisão`        | copyright cita `2022`; João decide se atualiza (`09-dados.md`)                                                                                     |
| Wrappers estruturais                                   | `page-container`, `et-main-area`, `main-content`, `post-47805`                                                                                     | `divergência intencional` | são artefatos do Divi Builder (wrappers de página/post do WordPress); o clone não precisa desses `id`, só do conteúdo que eles envolvem            |
| Google Fonts                                           | (tipografia global)                                                                                                                                | `divergência intencional` | remoto (`fonts.googleapis.com`) hoje vs. self-host proposto — ver seção abaixo                                                                     |
| Host de assets `stackstaging`                          | logo do header                                                                                                                                     | `divergência intencional` | `lotusotec-cl.us.stackstaging.com` deixa de ser dependência de runtime (`03-assets.md`)                                                            |
| `/wp-json`, `/xmlrpc.php`, `/feed/`, `/comments/feed/` | (endpoints WordPress)                                                                                                                              | `divergência intencional` | sem equivalente funcional num site estático (`01-estrutura.md`)                                                                                    |
| Página residual `/http-18-230-15-185/`                 | (fora da navegação)                                                                                                                                | `pendente decisão`        | sem link de entrada hoje; João decide se cria redirect, 404 proposital ou ignora (`01-estrutura.md`, `08-seo.md`)                                  |
| `meta description` / tags `og:`/`twitter:`             | `<head>`                                                                                                                                           | `divergência intencional` | ausentes hoje; propostos para o clone (`08-seo.md`)                                                                                                |
| `preloader.gif` do Divi                                | tema Divi (`wp-content/themes/Divi-3/`)                                                                                                            | `divergência intencional` | spinner de carregamento do WordPress/Divi; sem equivalente num build estático Vite                                                                 |

## Divergências intencionais propostas

1. **Google Fonts**: hoje carregado remoto de `fonts.googleapis.com` (`Open Sans`, `Montserrat`, `display=swap`); proposta é self-host no clone para não depender de rede externa em runtime (`04-tipografia.md`).
2. **Host de assets**: o logo do header sai de `lotusotec-cl.us.stackstaging.com` (staging de terceiro) e passa a ser servido pelo próprio clone (`03-assets.md`).
3. **Endpoints WordPress** (`/wp-json/`, `/xmlrpc.php`, `/feed/`, `/comments/feed/`): não existem no clone estático — não há CMS por trás (`01-estrutura.md`).
4. **Página residual** `/http-18-230-15-185/`: sem link de entrada hoje; decisão de recriar, redirecionar ou deixar de fora é de João (`01-estrutura.md`).
5. **`meta description` e tags `og:`**: ausentes hoje; propostas para criação no clone, já que SEO básico se beneficia delas (`08-seo.md`).
6. **`preloader.gif` do Divi**: spinner de carregamento do tema WordPress; sem equivalente necessário num build estático Vite.

## Pendências de João

Consolidado de `09-dados.md`:

1. Validade atual da certificação `NCH 2728:2015` / `CA-751` / `INN: A-10981`.
2. O número `888 horas` sob o rótulo `ALUMNOS` (`Somos`) — manter a inconsistência do site original ou corrigir.
3. Carga horária, público-alvo e descrição completa de cada um dos 3 cursos.
4. Ano de copyright do rodapé (`2022`).
5. Destino da página residual `/http-18-230-15-185/` (`01-estrutura.md`).
6. Se os CTAs `Learn More` e `See More` — hoje invisíveis no site real (`06-baseline.md`) — devem ganhar contraste no clone ou se há intenção original a preservar.
