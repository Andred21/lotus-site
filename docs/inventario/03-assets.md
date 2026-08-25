# 03 — Assets visuais

> Evidência: `docs/inventario/assets/manifest.json`, capturado em `2026-08-25T19:08:32.914Z` via `pnpm inventario:assets` (consome `docs/inventario/dom.json`). Commit-base: `66b2999`. Determinismo provado: rodar `pnpm inventario:assets` duas vezes seguidas produz o mesmo `sha256` para cada `url`.

## Manifesto

| arquivo                                     | origem                                                         | host                               | bytes | sha256 (8) | usado em                                                           | candidato local |
| ------------------------------------------- | -------------------------------------------------------------- | ---------------------------------- | ----- | ---------- | ------------------------------------------------------------------ | --------------- |
| `staging-LOTUS_TRANSP_Fondo-Negro-REC2.png` | `wp-content/uploads/2022/08/LOTUS_TRANSP_Fondo-Negro-REC2.png` | `lotusotec-cl.us.stackstaging.com` | 4228  | `c17ea81f` | logo do header (`main-header`)                                     | `src/assets/`   |
| `LOTUS-G2_TRANSP_Fondo-Blanco.png`          | `wp-content/uploads/2022/08/LOTUS-G2_TRANSP_Fondo-Blanco.png`  | `lotusotec.cl`                     | 6363  | `b796843c` | imagem da seção `Somos`                                            | `src/assets/`   |
| `home-office-12.jpg`                        | `wp-content/uploads/2022/08/home-office-12.jpg`                | `lotusotec.cl`                     | 13252 | `f1f25036` | card 1 de `Cursos` (Especialistas Líneas Vivas en Media Tensión)   | `src/assets/`   |
| `LLVV_00-v1-BN2.jpeg`                       | `wp-content/uploads/2022/08/LLVV_00-v1-BN2.jpeg`               | `lotusotec.cl`                     | 30521 | `02aa388c` | card 2 de `Cursos` (Especialistas en Líneas Vivas en Alta Tensión) | `src/assets/`   |
| `LLVV_Mantas02-BN2.jpeg`                    | `wp-content/uploads/2022/08/LLVV_Mantas02-BN2.jpeg`            | `lotusotec.cl`                     | 31900 | `ff937685` | card 3 de `Cursos` (Supervisor de Trabajos de Líneas Vivas)        | `src/assets/`   |

`usedIn` na tabela acima simplifica a cadeia de wrappers do manifesto (`page-container` → `et-main-area` → `main-content` → `post-47805` → seção de conteúdo) para a seção de conteúdo real; a lista completa por asset está em `assets/manifest.json`.

Todos os cinco assets são candidatos a `src/assets/`: cada um é usado por exatamente um componente visual (logo do header, imagem institucional, três imagens de curso), nenhum precisa de URL estável fora do bundle. Nenhum favicon ou imagem de Open Graph foi encontrado no `<head>` capturado (ver `08-seo.md`) — se a Sprint 2 criar esses arquivos, eles vão para `public/`, não para este manifesto.

## Host de staging

O logo do header (`staging-LOTUS_TRANSP_Fondo-Negro-REC2.png`) é servido hoje por `lotusotec-cl.us.stackstaging.com`, um host de staging externo ao domínio de produção. O clone baixa esse arquivo uma vez (prefixo `staging-` no manifesto evita colisão de nome com assets de `lotusotec.cl`) e o serve como asset próprio — `lotusotec-cl.us.stackstaging.com` deixa de ser dependência de runtime do clone.
