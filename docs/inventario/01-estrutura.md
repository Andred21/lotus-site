# 01 — Estrutura e navegação

> Evidência: `docs/inventario/dom.json`, capturado em `2026-08-25T19:04:12.421Z` via `pnpm inventario:dom`. Commit-base: `5fb16a3`.

## Seções da home, em ordem de DOM

`page-container` é o elemento raiz; os `id` abaixo aparecem nessa ordem ao percorrer o documento. Âncora só existe quando algum link do menu ou do próprio corpo referencia o `id` com `#id`.

| id                        | tag       | âncora usada?                                      | headings | textos | links | imagens | papel                                              |
| ------------------------- | --------- | -------------------------------------------------- | -------- | ------ | ----- | ------- | -------------------------------------------------- |
| `page-container`          | `div`     | não                                                | 7        | 34     | 15    | 5       | wrapper de página inteira (Divi)                   |
| `main-header`             | `div`     | não                                                | 0        | 8      | 9     | 1       | cabeçalho fixo: logo + menu                        |
| `logo`                    | `div`     | não                                                | 0        | 0      | 0     | 0       | wrapper do link do logo                            |
| `et-top-navigation`       | `div`     | não                                                | 0        | 8      | 8     | 0       | barra de navegação (desktop + toggle mobile)       |
| `top-menu-nav`            | `nav`     | não                                                | 0        | 4      | 4     | 0       | `<nav>` do menu principal                          |
| `top-menu`                | `ul`      | não                                                | 0        | 4      | 4     | 0       | lista `Inicio / Quienes Somos / Cursos / Contacto` |
| `menu-item-47811`         | `li`      | não                                                | 0        | 0      | 1     | 0       | item de menu `Inicio`                              |
| `menu-item-47885`         | `li`      | não                                                | 0        | 0      | 1     | 0       | item de menu `Quienes Somos`                       |
| `menu-item-47886`         | `li`      | não                                                | 0        | 0      | 1     | 0       | item de menu `Cursos`                              |
| `menu-item-47887`         | `li`      | não                                                | 0        | 0      | 1     | 0       | item de menu `Contacto`                            |
| `et-main-area`            | `div`     | não                                                | 7        | 26     | 6     | 4       | wrapper do conteúdo principal                      |
| `main-content`            | `div`     | não                                                | 7        | 26     | 6     | 4       | container do post da home                          |
| `post-47805`              | `article` | não                                                | 7        | 26     | 6     | 4       | o post/página em si (Divi builder)                 |
| `Intrucción`              | `section` | sim (implícita: 1ª seção visível, sem link direto) | 2        | 5      | 1     | 0       | hero: título + subtítulo + CTA "Learn More"        |
| `Somos`                   | `section` | sim (`#Somos`)                                     | 3        | 5      | 0     | 1       | "Quienes Somos" — institucional                    |
| `Cursos`                  | `section` | sim (`#Cursos`)                                    | 1        | 9      | 4     | 3       | grade de cursos em destaque                        |
| `Contacto`                | `section` | sim (`#Contacto`)                                  | 1        | 7      | 1     | 0       | formulário de contato + email                      |
| `et_pb_contact_form_0`    | `form`    | não                                                | 0        | 4      | 0     | 0       | `<form>` do módulo de contato Divi                 |
| `et_pb_contact_name_0`    | `span`    | não                                                | 0        | 0      | 0     | 0       | wrapper do campo "Nombre Completo"                 |
| `et_pb_contact_email_0`   | `span`    | não                                                | 0        | 0      | 0     | 0       | wrapper do campo "Correo Electrónico"              |
| `et_pb_contact_company_0` | `span`    | não                                                | 0        | 0      | 0     | 0       | wrapper do campo "Empresa"                         |
| `et_pb_contact_message_0` | `span`    | não                                                | 0        | 0      | 0     | 0       | wrapper do campo "Mensaje"                         |
| `main-footer`             | `footer`  | não                                                | 0        | 1      | 0     | 0       | rodapé — contém `footer-bottom`                    |
| `footer-bottom`           | `div`     | não                                                | 0        | 1      | 0     | 0       | faixa inferior: `#footer-info` com o copyright     |

Conteúdo visualmente relevante para o clone: `Intrucción` (hero), `Somos`, `Cursos`, `Contacto`. Os demais `id` são wrappers estruturais do Divi/Elementor sem texto próprio.

## Menu principal

| item            | destino                 | tipo de navegação                                      |
| --------------- | ----------------------- | ------------------------------------------------------ |
| `Inicio`        | `https://lotusotec.cl/` | link absoluto para a própria home (recarrega a página) |
| `Quienes Somos` | `#Somos`                | âncora — rolagem na mesma página                       |
| `Cursos`        | `#Cursos`               | âncora — rolagem na mesma página                       |
| `Contacto`      | `#Contacto`             | âncora — rolagem na mesma página                       |

O menu se repete em duas instâncias no DOM (menu fixo e menu duplicado do Divi para o estado "sticky"), com os mesmos quatro destinos. Não existe rota própria (`/quienes-somos`, `/cursos`, `/contacto`): a navegação inteira é de âncora dentro da home.

## CTAs

| texto                   | seção de origem     | destino observado                                                                                                                                               |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Learn More`            | `Intrucción` (hero) | `href` vazio (`""`) — botão não navega hoje                                                                                                                     |
| `See More`              | `Cursos`            | `href="#"` — cada card de curso tem um `See More` que não leva a lugar nenhum (provável toggle de accordion via JS do Elementor, não capturado no DOM estático) |
| `contacto@lotusotec.cl` | `Contacto`          | `mailto:contacto@lotusotec.cl`                                                                                                                                  |

Nenhum CTA da home leva a uma URL de conteúdo real fora da própria página. Isso é achado, não suposição: os `href` foram lidos direto do atributo, sem seguir clique.

## Comportamento de navegação

Toda navegação interna da home é âncora (`#id`) com rolagem na mesma página — não há troca de rota nem de documento. O único link que recarrega a página é `Inicio`, que aponta para a própria home.

## Página residual

`https://lotusotec.cl/http-18-230-15-185/` responde `200`, título `http://18.230.15.185/ | LOTUS`. É uma página WordPress publicada sozinha, sem link algum apontando para ela a partir da home (não aparece em `nav`, `top-menu` nem em nenhum `href` capturado) — resíduo provável de migração do IP de origem para o domínio. Não tem equivalente planejado no clone.

## Endpoints WordPress sem equivalente no clone

| endpoint          | status hoje | observação                                    |
| ----------------- | ----------- | --------------------------------------------- |
| `/wp-json/`       | `200`       | API REST do WordPress, expõe rotas e usuários |
| `/xmlrpc.php`     | `403`       | endpoint existe mas host bloqueia a chamada   |
| `/feed/`          | `200`       | feed RSS do WordPress                         |
| `/comments/feed/` | `200`       | feed RSS de comentários                       |

Os quatro respondem hoje porque o site roda WordPress; o clone é estático (Vite) e nenhum tem equivalente funcional — ficam registrados aqui para a matriz de paridade (`2.1.10`) decidir `preservar`/`criar`/`pendente decisão`.
