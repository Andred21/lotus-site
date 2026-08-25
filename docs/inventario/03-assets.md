# 03 — Assets visuais

> Evidência: `docs/inventario/assets/manifest.json` (`sha256` `3065570bf6e1502f…`), capturado em `2026-08-25T20:57:14.015Z` via `pnpm inventario:assets`, sobre `docs/inventario/dom.json` (`sha256` `0d8a8d45a434de23…`, capturado em `2026-08-25T21:21:22.608Z`). Determinismo: `capturedAt` muda a cada execução por ser metadado de corrida; o que o aceite compara é `assets[]` — ordenado por URL, com `bytes` e `sha256` do conteúdo remoto.

## Cobertura

São **20 URLs de imagem únicas**, **811 910 B** (~0,79 MB), baixadas para `docs/inventario/assets/`. O catálogo não vem só de `<img>`: `extract-dom.mjs` percorre quatro origens, porque o Divi publica boa parte do visual fora do markup de imagem.

| origem (`kinds`)   | o que cobre                                               | quantos |
| ------------------ | --------------------------------------------------------- | ------- |
| `img`              | atributo `src` e `currentSrc` de cada `<img>`             | 9       |
| `srcset`           | variantes de tamanho publicadas pelo WordPress            | 8       |
| `background-image` | `getComputedStyle().backgroundImage` de qualquer elemento | 2       |
| `icon`             | `link[rel*=icon]` e `meta[name=msapplication-TileImage]`  | 4       |
| `css`              | `url()` das folhas de estilo do próprio site (`cssRules`) | 2       |

A soma passa de 20 porque a mesma URL aparece em mais de uma origem (por exemplo `home-office-12.jpg` é `img` e `srcset`; `background-texture.jpg` é `background-image` e `css`).

## Manifesto

`insecure` marca o asset cujo markup publica a URL em `http://` — o Chromium resolve o mesmo arquivo em `https://`, e a chave do manifesto é sempre a versão com TLS.

| arquivo local                                           | caminho de origem                                                       | host         | kinds                | insecure | bytes  | sha256 (8) | usado em     |
| ------------------------------------------------------- | ----------------------------------------------------------------------- | ------------ | -------------------- | -------- | ------ | ---------- | ------------ |
| `staging-background-texture.jpg`                        | `…/2022/08/background-texture.jpg`                                      | staging      | background-image+css | sim      | 12961  | `2c7137db` | `Intrucción` |
| `staging-home-office-12.jpg`                            | `…/2022/08/home-office-12.jpg`                                          | staging      | img                  | sim      | 13252  | `f1f25036` | `Cursos`     |
| `staging-LLVV_00-v1-BN2.jpeg`                           | `…/2022/08/LLVV_00-v1-BN2.jpeg`                                         | staging      | img                  | sim      | 30521  | `02aa388c` | `Cursos`     |
| `staging-LLVV_Mantas02-BN2.jpeg`                        | `…/2022/08/LLVV_Mantas02-BN2.jpeg`                                      | staging      | img                  | sim      | 31900  | `ff937685` | `Cursos`     |
| `staging-LOTUS_TRANSP_Fondo-Negro-REC2.png`             | `…/2022/08/LOTUS_TRANSP_Fondo-Negro-REC2.png`                           | staging      | img                  | sim      | 4228   | `c17ea81f` | `logo`       |
| `staging-LOTUS-G2_TRANSP_Fondo-Blanco.png`              | `…/2022/08/LOTUS-G2_TRANSP_Fondo-Blanco.png`                            | staging      | img                  | sim      | 6363   | `b796843c` | `Somos`      |
| `staging-shutterstock_1444636373-1-scaled.jpg`          | `…/2022/08/shutterstock_1444636373-1-scaled.jpg`                        | staging      | background-image     | sim      | 564274 | `d1fd7974` | `Intrucción` |
| `preloader.gif`                                         | `wp-content/themes/Divi-3/includes/builder/styles/images/preloader.gif` | lotusotec.cl | css                  | não      | 9427   | `27422f83` | folha Divi   |
| `cropped-Logo-LOTUS-_Fondo-Negro_Recortado-32x32.png`   | `…/2022/08/cropped-Logo-LOTUS-_Fondo-Negro_Recortado-32x32.png`         | lotusotec.cl | icon                 | não      | 819    | `147744fc` | `<head>`     |
| `cropped-Logo-LOTUS-_Fondo-Negro_Recortado-180x180.png` | `…/2022/08/cropped-Logo-LOTUS-_Fondo-Negro_Recortado-180x180.png`       | lotusotec.cl | icon                 | não      | 5668   | `2c1d6a42` | `<head>`     |
| `cropped-Logo-LOTUS-_Fondo-Negro_Recortado-192x192.png` | `…/2022/08/cropped-Logo-LOTUS-_Fondo-Negro_Recortado-192x192.png`       | lotusotec.cl | icon                 | não      | 6098   | `1a3ab286` | `<head>`     |
| `cropped-Logo-LOTUS-_Fondo-Negro_Recortado-270x270.png` | `…/2022/08/cropped-Logo-LOTUS-_Fondo-Negro_Recortado-270x270.png`       | lotusotec.cl | icon                 | não      | 8905   | `15dddadf` | `<head>`     |
| `LOTUS-G2_TRANSP_Fondo-Blanco.png`                      | `…/2022/08/LOTUS-G2_TRANSP_Fondo-Blanco.png`                            | lotusotec.cl | img+srcset           | não      | 6363   | `b796843c` | `Somos`      |
| `LOTUS-G2_TRANSP_Fondo-Blanco-480x480.png`              | `…/2022/08/LOTUS-G2_TRANSP_Fondo-Blanco-480x480.png`                    | lotusotec.cl | srcset               | não      | 6584   | `9e559a67` | `Somos`      |
| `home-office-12.jpg`                                    | `…/2022/08/home-office-12.jpg`                                          | lotusotec.cl | img+srcset           | não      | 13252  | `f1f25036` | `Cursos`     |
| `home-office-12-300x225.jpg`                            | `…/2022/08/home-office-12-300x225.jpg`                                  | lotusotec.cl | srcset               | não      | 8621   | `9ee95d2b` | `Cursos`     |
| `LLVV_00-v1-BN2.jpeg`                                   | `…/2022/08/LLVV_00-v1-BN2.jpeg`                                         | lotusotec.cl | img+srcset           | não      | 30521  | `02aa388c` | `Cursos`     |
| `LLVV_00-v1-BN2-150x150.jpeg`                           | `…/2022/08/LLVV_00-v1-BN2-150x150.jpeg`                                 | lotusotec.cl | srcset               | não      | 13089  | `72c617b3` | `Cursos`     |
| `LLVV_Mantas02-BN2.jpeg`                                | `…/2022/08/LLVV_Mantas02-BN2.jpeg`                                      | lotusotec.cl | img+srcset           | não      | 31900  | `ff937685` | `Cursos`     |
| `LLVV_Mantas02-BN2-150x150.jpeg`                        | `…/2022/08/LLVV_Mantas02-BN2-150x150.jpeg`                              | lotusotec.cl | srcset               | não      | 7164   | `4099579c` | `Cursos`     |

`usedIn` na tabela cita a seção de conteúdo; o manifesto guarda o `id` do ancestral mais próximo de cada uso, que é o que `extract-dom.mjs` observa.

## O mesmo arquivo em dois hosts

Sete assets vêm do host de staging `lotusotec-cl.us.stackstaging.com`, sempre em `http://`, porque é para lá que o markup dos cards e do logo aponta. Desses sete, **quatro** têm cópia idêntica em `lotusotec.cl`: `home-office-12.jpg` (`f1f25036`), `LLVV_00-v1-BN2.jpeg` (`02aa388c`), `LLVV_Mantas02-BN2.jpeg` (`ff937685`) e `LOTUS-G2_TRANSP_Fondo-Blanco.png` (`b796843c`) — `sha256` igual, mesmo binário servido por dois hosts.

Os outros **três existem só no staging**, sem nenhuma cópia catalogada no host principal:

| arquivo                                        | bytes   | origem                     | usado em                      |
| ---------------------------------------------- | ------- | -------------------------- | ----------------------------- |
| `staging-shutterstock_1444636373-1-scaled.jpg` | 564 274 | `background-image`         | `Intrucción`                  |
| `staging-background-texture.jpg`               | 12 961  | `background-image` / `css` | `Intrucción`, folha de estilo |
| `staging-LOTUS_TRANSP_Fondo-Negro-REC2.png`    | 4 228   | `img`                      | `logo`                        |

A foto do hero é o maior asset da home (564 kB, 70% do peso total). O terceiro caso é o mais sensível para o clone: **o logo do cabeçalho** só existe no staging, então tirar o host do ar derruba a marca no topo da página, não só uma imagem de fundo.

Consequência para o clone: baixar os dois hosts uma vez elimina o hotlink e o conteúdo misto (`http://` dentro de página `https://`). A escolha entre manter as duas cópias ou deduplicar por `sha256` fica para a Sprint 2 — aqui as duas são registradas porque as duas são requisição real da home.

## Candidato local

- `src/assets/` — logo do header, imagem de `Somos`, as três imagens de curso, a foto do hero e a textura de fundo: cada um é usado por um componente e pode ser fingerprintado pelo Vite.
- `public/` — os quatro ícones de `<head>` (`favicon` 32×32 e 192×192, `apple-touch-icon` 180×180, `msapplication-TileImage` 270×270): precisam de URL estável, referenciada por `<link>` no HTML.
- **Nenhum** — `preloader.gif` é do próprio Divi, não do conteúdo; o clone estático não tem preloader. Entra na matriz de `README.md` como divergência intencional.
- As variantes de `srcset` (`-150x150`, `-300x225`, `-480x480`) só fazem sentido se a Sprint 2 reproduzir imagem responsiva; sem isso, o clone usa o arquivo cheio.

O site **tem** favicon (quatro arquivos, todos recortes do logo em fundo preto) e **não tem** imagem de Open Graph — `openGraph` está vazio em `dom.json` e nenhum `og:image` foi publicado. Ver `08-seo.md`.
