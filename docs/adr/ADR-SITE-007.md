# ADR-SITE-007 · Uma página é um HTML próprio, servido por reescrita explícita na borda

- **Status:** aceito
- **Data:** 2026-11-24
- **Escopo:** `validacao-certificado`
- **Relaciona:** `ADR-SITE-004` (sem fallback genérico)

## Contexto

`/validar` é a primeira página do site além da home. O QR impresso nos certificados aponta para o
caminho fixo `/validar/<uuid>` (`K7`), então a página precisa responder nesse caminho, não em
fragmento nem em query.

A `ADR-SITE-004` proíbe o fallback genérico: caminho inventado não pode responder 200 com a home.
Servir `/validar/<uuid>` exige, portanto, que a borda saiba quais caminhos pertencem a qual página.

## Decisão

- **Um `.html` por página**, como entrada do Vite (`validar/index.html` ao lado de `index.html`). Cada
  página tem o próprio `<head>`: `title`, `canonical`, `robots` e `og:*` não são reescritos em
  JavaScript.
- **A função `viewer-request` do behavior padrão reescreve só as formas de caminho declaradas de cada
  página.** Para `validar`: `/validar`, `/validar/` e `/validar/<uuid>` (8-4-4-4-12 hexadecimal, sem
  diferenciar caixa) viram `/validar/index.html`. Qualquer outro caminho segue inalterado e o S3
  responde 404 se não houver objeto.
- **Dev e preview reproduzem a borda** com um plugin do Vite (`appType: 'mpa'` mais a mesma reescrita).
  A regra existe em dois lugares, a função no template e o plugin, e **uma tabela única de casos**
  prova que os dois decidem igual.
- **Sem router** (D6). Um router no navegador exige a borda servindo o mesmo `index.html` e põe o
  `<head>` da home em toda rota.

## Consequências

- Página nova custa: uma entrada no `vite.config.ts`, casos na tabela, o arquivo de nome fixo no
  `ci.yml` e no rollback (que tratam `index.html` por nome exato) e o caminho na invalidação.
- O `<head>` de cada página é estático; nada de metadados dependentes de rota em tempo de execução.
- A navegação entre a home e a página é por `<a>`, com carga completa de documento.
- A regra de reescrita vive em dois lugares; a tabela única de casos é o que impede a divergência.

## Alternativas

| Abordagem                                                 | Por que não                                                                                                                               |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Uma página só, com reescrita para `/index.html`           | `/validar/<uuid>` herdaria `canonical` de `/`, `og:*`, JSON-LD e o preload do hero; corrigir exigiria reescrever o `<head>` em JavaScript |
| Router (`react-router`) mais lista de rotas na borda      | dependência nova para duas páginas ligadas por `<a>`; mesmo problema de `<head>`; ver D6                                                  |
| Fallback genérico (`CustomErrorResponses` 404 para index) | proibido pela `ADR-SITE-004`: qualquer caminho inventado responderia 200                                                                  |
| Hash ou query (`/validar#<uuid>`)                         | o QR impresso usa o caminho fixo `/validar/<uuid>` (`K7`)                                                                                 |

## Quando revisitar

Quando o site tiver páginas que se beneficiem de navegação no cliente ou de pré-renderização. O
caminho para um site maior é um framework com pré-renderização, e isso é decisão de bloco próprio
(D6), não um router acrescentado a este desenho.
