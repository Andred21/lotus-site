# Cabeçalho e cards de curso — https://lotusotec.cl/ × clone

## Resumo

50 divergência(s):

- cabecalho @ 1440: backgroundColor rgb(0, 0, 0) != rgb(248, 248, 248)
- cabecalho @ 1920: backgroundColor rgb(0, 0, 0) != rgb(248, 248, 248)
- curso.1.media-tension @ 375: ateLegenda 30 != 24
- curso.2.alta-tension @ 375: larguraRenderizada 250 != 300
- curso.2.alta-tension @ 375: alturaRenderizada 250 != 225
- curso.2.alta-tension @ 375: offsetEsquerdo 25 != 0
- curso.2.alta-tension @ 375: offsetDireito 25 != 0
- curso.2.alta-tension @ 375: ateLegenda 30 != 24
- curso.3.supervisor @ 375: larguraRenderizada 250 != 300
- curso.3.supervisor @ 375: alturaRenderizada 250 != 225
- curso.3.supervisor @ 375: offsetEsquerdo 25 != 0
- curso.3.supervisor @ 375: offsetDireito 25 != 0
- curso.3.supervisor @ 375: ateLegenda 30 != 24
- curso.1.media-tension @ 768: larguraRenderizada 400 != 614.39
- curso.1.media-tension @ 768: alturaRenderizada 300 != 460.78
- curso.1.media-tension @ 768: offsetEsquerdo 107.19 != 0
- curso.1.media-tension @ 768: offsetDireito 107.2 != 0
- curso.1.media-tension @ 768: ateLegenda 30 != 24
- curso.2.alta-tension @ 768: larguraRenderizada 250 != 614.39
- curso.2.alta-tension @ 768: alturaRenderizada 250 != 460.78
- curso.2.alta-tension @ 768: offsetEsquerdo 182.19 != 0
- curso.2.alta-tension @ 768: offsetDireito 182.2 != 0
- curso.2.alta-tension @ 768: ateLegenda 30 != 24
- curso.3.supervisor @ 768: larguraRenderizada 250 != 614.39
- curso.3.supervisor @ 768: alturaRenderizada 250 != 460.78
- curso.3.supervisor @ 768: offsetEsquerdo 182.19 != 0
- curso.3.supervisor @ 768: offsetDireito 182.2 != 0
- curso.3.supervisor @ 768: ateLegenda 30 != 24
- curso.1.media-tension @ 1440: ateLegenda 29.69 != 24
- curso.2.alta-tension @ 1440: larguraRenderizada 250 != 320.42
- curso.2.alta-tension @ 1440: alturaRenderizada 250 != 240.31
- curso.2.alta-tension @ 1440: offsetEsquerdo 35.19 != 0
- curso.2.alta-tension @ 1440: offsetDireito 35.2 != 0
- curso.2.alta-tension @ 1440: ateLegenda 29.69 != 24
- curso.3.supervisor @ 1440: larguraRenderizada 250 != 320.41
- curso.3.supervisor @ 1440: alturaRenderizada 250 != 240.3
- curso.3.supervisor @ 1440: offsetEsquerdo 35.19 != 0
- curso.3.supervisor @ 1440: offsetDireito 35.2 != 0
- curso.3.supervisor @ 1440: ateLegenda 29.69 != 24
- curso.1.media-tension @ 1920: ateLegenda 29.69 != 24
- curso.2.alta-tension @ 1920: larguraRenderizada 250 != 320.42
- curso.2.alta-tension @ 1920: alturaRenderizada 250 != 240.31
- curso.2.alta-tension @ 1920: offsetEsquerdo 35.19 != 0
- curso.2.alta-tension @ 1920: offsetDireito 35.2 != 0
- curso.2.alta-tension @ 1920: ateLegenda 29.69 != 24
- curso.3.supervisor @ 1920: larguraRenderizada 250 != 320.41
- curso.3.supervisor @ 1920: alturaRenderizada 250 != 240.3
- curso.3.supervisor @ 1920: offsetEsquerdo 35.19 != 0
- curso.3.supervisor @ 1920: offsetDireito 35.2 != 0
- curso.3.supervisor @ 1920: ateLegenda 29.69 != 24

## Cabeçalho

| nó          | largura | propriedade     | referência                         | clone                                                                                                                                                                      | bate    |
| ----------- | ------- | --------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `cabecalho` | 375     | backgroundColor | rgb(255, 255, 255)                 | rgb(255, 255, 255)                                                                                                                                                         | sim     |
| `cabecalho` | 375     | height          | 80                                 | 80                                                                                                                                                                         | sim     |
| `cabecalho` | 375     | boxShadow       | rgba(0, 0, 0, 0.1) 0px 1px 0px 0px | rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 0px 0px | sim     |
| `cabecalho` | 768     | backgroundColor | rgb(255, 255, 255)                 | rgb(255, 255, 255)                                                                                                                                                         | sim     |
| `cabecalho` | 768     | height          | 80                                 | 80                                                                                                                                                                         | sim     |
| `cabecalho` | 768     | boxShadow       | rgba(0, 0, 0, 0.1) 0px 1px 0px 0px | rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 0px 0px | sim     |
| `cabecalho` | 1440    | backgroundColor | rgb(0, 0, 0)                       | rgb(248, 248, 248)                                                                                                                                                         | **não** |
| `cabecalho` | 1440    | height          | 94                                 | 94                                                                                                                                                                         | sim     |
| `cabecalho` | 1440    | boxShadow       | rgba(0, 0, 0, 0.1) 0px 1px 0px 0px | rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 0px 0px | sim     |
| `cabecalho` | 1920    | backgroundColor | rgb(0, 0, 0)                       | rgb(248, 248, 248)                                                                                                                                                         | **não** |
| `cabecalho` | 1920    | height          | 94                                 | 94                                                                                                                                                                         | sim     |
| `cabecalho` | 1920    | boxShadow       | rgba(0, 0, 0, 0.1) 0px 1px 0px 0px | rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 0px 0px | sim     |

## Cards de curso

| card                    | largura | propriedade        | referência | clone  | bate        |
| ----------------------- | ------- | ------------------ | ---------- | ------ | ----------- |
| `curso.1.media-tension` | 375     | larguraColuna      | 300        | 300    | sim         |
| `curso.1.media-tension` | 375     | larguraIntrinseca  | 374        | 400    | diagnóstico |
| `curso.1.media-tension` | 375     | alturaIntrinseca   | 281        | 300    | diagnóstico |
| `curso.1.media-tension` | 375     | larguraRenderizada | 300        | 300    | sim         |
| `curso.1.media-tension` | 375     | alturaRenderizada  | 225        | 225    | sim         |
| `curso.1.media-tension` | 375     | offsetEsquerdo     | 0          | 0      | sim         |
| `curso.1.media-tension` | 375     | offsetDireito      | 0          | 0      | sim         |
| `curso.1.media-tension` | 375     | ateLegenda         | 30         | 24     | **não**     |
| `curso.2.alta-tension`  | 375     | larguraColuna      | 300        | 300    | sim         |
| `curso.2.alta-tension`  | 375     | larguraIntrinseca  | 250        | 250    | diagnóstico |
| `curso.2.alta-tension`  | 375     | alturaIntrinseca   | 250        | 250    | diagnóstico |
| `curso.2.alta-tension`  | 375     | larguraRenderizada | 250        | 300    | **não**     |
| `curso.2.alta-tension`  | 375     | alturaRenderizada  | 250        | 225    | **não**     |
| `curso.2.alta-tension`  | 375     | offsetEsquerdo     | 25         | 0      | **não**     |
| `curso.2.alta-tension`  | 375     | offsetDireito      | 25         | 0      | **não**     |
| `curso.2.alta-tension`  | 375     | ateLegenda         | 30         | 24     | **não**     |
| `curso.3.supervisor`    | 375     | larguraColuna      | 300        | 300    | sim         |
| `curso.3.supervisor`    | 375     | larguraIntrinseca  | 250        | 250    | diagnóstico |
| `curso.3.supervisor`    | 375     | alturaIntrinseca   | 250        | 250    | diagnóstico |
| `curso.3.supervisor`    | 375     | larguraRenderizada | 250        | 300    | **não**     |
| `curso.3.supervisor`    | 375     | alturaRenderizada  | 250        | 225    | **não**     |
| `curso.3.supervisor`    | 375     | offsetEsquerdo     | 25         | 0      | **não**     |
| `curso.3.supervisor`    | 375     | offsetDireito      | 25         | 0      | **não**     |
| `curso.3.supervisor`    | 375     | ateLegenda         | 30         | 24     | **não**     |
| `curso.1.media-tension` | 768     | larguraColuna      | 614.39     | 614.39 | sim         |
| `curso.1.media-tension` | 768     | larguraIntrinseca  | 400        | 400    | diagnóstico |
| `curso.1.media-tension` | 768     | alturaIntrinseca   | 300        | 300    | diagnóstico |
| `curso.1.media-tension` | 768     | larguraRenderizada | 400        | 614.39 | **não**     |
| `curso.1.media-tension` | 768     | alturaRenderizada  | 300        | 460.78 | **não**     |
| `curso.1.media-tension` | 768     | offsetEsquerdo     | 107.19     | 0      | **não**     |
| `curso.1.media-tension` | 768     | offsetDireito      | 107.2      | 0      | **não**     |
| `curso.1.media-tension` | 768     | ateLegenda         | 30         | 24     | **não**     |
| `curso.2.alta-tension`  | 768     | larguraColuna      | 614.39     | 614.39 | sim         |
| `curso.2.alta-tension`  | 768     | larguraIntrinseca  | 250        | 250    | diagnóstico |
| `curso.2.alta-tension`  | 768     | alturaIntrinseca   | 250        | 250    | diagnóstico |
| `curso.2.alta-tension`  | 768     | larguraRenderizada | 250        | 614.39 | **não**     |
| `curso.2.alta-tension`  | 768     | alturaRenderizada  | 250        | 460.78 | **não**     |
| `curso.2.alta-tension`  | 768     | offsetEsquerdo     | 182.19     | 0      | **não**     |
| `curso.2.alta-tension`  | 768     | offsetDireito      | 182.2      | 0      | **não**     |
| `curso.2.alta-tension`  | 768     | ateLegenda         | 30         | 24     | **não**     |
| `curso.3.supervisor`    | 768     | larguraColuna      | 614.39     | 614.39 | sim         |
| `curso.3.supervisor`    | 768     | larguraIntrinseca  | 250        | 250    | diagnóstico |
| `curso.3.supervisor`    | 768     | alturaIntrinseca   | 250        | 250    | diagnóstico |
| `curso.3.supervisor`    | 768     | larguraRenderizada | 250        | 614.39 | **não**     |
| `curso.3.supervisor`    | 768     | alturaRenderizada  | 250        | 460.78 | **não**     |
| `curso.3.supervisor`    | 768     | offsetEsquerdo     | 182.19     | 0      | **não**     |
| `curso.3.supervisor`    | 768     | offsetDireito      | 182.2      | 0      | **não**     |
| `curso.3.supervisor`    | 768     | ateLegenda         | 30         | 24     | **não**     |
| `curso.1.media-tension` | 1440    | larguraColuna      | 320.39     | 320.41 | sim         |
| `curso.1.media-tension` | 1440    | larguraIntrinseca  | 400        | 400    | diagnóstico |
| `curso.1.media-tension` | 1440    | alturaIntrinseca   | 300        | 300    | diagnóstico |
| `curso.1.media-tension` | 1440    | larguraRenderizada | 320.39     | 320.41 | sim         |
| `curso.1.media-tension` | 1440    | alturaRenderizada  | 240.28     | 240.3  | sim         |
| `curso.1.media-tension` | 1440    | offsetEsquerdo     | 0          | 0      | sim         |
| `curso.1.media-tension` | 1440    | offsetDireito      | 0          | 0      | sim         |
| `curso.1.media-tension` | 1440    | ateLegenda         | 29.69      | 24     | **não**     |
| `curso.2.alta-tension`  | 1440    | larguraColuna      | 320.39     | 320.42 | sim         |
| `curso.2.alta-tension`  | 1440    | larguraIntrinseca  | 250        | 250    | diagnóstico |
| `curso.2.alta-tension`  | 1440    | alturaIntrinseca   | 250        | 250    | diagnóstico |
| `curso.2.alta-tension`  | 1440    | larguraRenderizada | 250        | 320.42 | **não**     |
| `curso.2.alta-tension`  | 1440    | alturaRenderizada  | 250        | 240.31 | **não**     |
| `curso.2.alta-tension`  | 1440    | offsetEsquerdo     | 35.19      | 0      | **não**     |
| `curso.2.alta-tension`  | 1440    | offsetDireito      | 35.2       | 0      | **não**     |
| `curso.2.alta-tension`  | 1440    | ateLegenda         | 29.69      | 24     | **não**     |
| `curso.3.supervisor`    | 1440    | larguraColuna      | 320.39     | 320.41 | sim         |
| `curso.3.supervisor`    | 1440    | larguraIntrinseca  | 250        | 250    | diagnóstico |
| `curso.3.supervisor`    | 1440    | alturaIntrinseca   | 250        | 250    | diagnóstico |
| `curso.3.supervisor`    | 1440    | larguraRenderizada | 250        | 320.41 | **não**     |
| `curso.3.supervisor`    | 1440    | alturaRenderizada  | 250        | 240.3  | **não**     |
| `curso.3.supervisor`    | 1440    | offsetEsquerdo     | 35.19      | 0      | **não**     |
| `curso.3.supervisor`    | 1440    | offsetDireito      | 35.2       | 0      | **não**     |
| `curso.3.supervisor`    | 1440    | ateLegenda         | 29.69      | 24     | **não**     |
| `curso.1.media-tension` | 1920    | larguraColuna      | 320.39     | 320.41 | sim         |
| `curso.1.media-tension` | 1920    | larguraIntrinseca  | 400        | 400    | diagnóstico |
| `curso.1.media-tension` | 1920    | alturaIntrinseca   | 300        | 300    | diagnóstico |
| `curso.1.media-tension` | 1920    | larguraRenderizada | 320.39     | 320.41 | sim         |
| `curso.1.media-tension` | 1920    | alturaRenderizada  | 240.28     | 240.3  | sim         |
| `curso.1.media-tension` | 1920    | offsetEsquerdo     | 0          | 0      | sim         |
| `curso.1.media-tension` | 1920    | offsetDireito      | 0          | 0      | sim         |
| `curso.1.media-tension` | 1920    | ateLegenda         | 29.69      | 24     | **não**     |
| `curso.2.alta-tension`  | 1920    | larguraColuna      | 320.39     | 320.42 | sim         |
| `curso.2.alta-tension`  | 1920    | larguraIntrinseca  | 250        | 250    | diagnóstico |
| `curso.2.alta-tension`  | 1920    | alturaIntrinseca   | 250        | 250    | diagnóstico |
| `curso.2.alta-tension`  | 1920    | larguraRenderizada | 250        | 320.42 | **não**     |
| `curso.2.alta-tension`  | 1920    | alturaRenderizada  | 250        | 240.31 | **não**     |
| `curso.2.alta-tension`  | 1920    | offsetEsquerdo     | 35.19      | 0      | **não**     |
| `curso.2.alta-tension`  | 1920    | offsetDireito      | 35.2       | 0      | **não**     |
| `curso.2.alta-tension`  | 1920    | ateLegenda         | 29.69      | 24     | **não**     |
| `curso.3.supervisor`    | 1920    | larguraColuna      | 320.39     | 320.41 | sim         |
| `curso.3.supervisor`    | 1920    | larguraIntrinseca  | 250        | 250    | diagnóstico |
| `curso.3.supervisor`    | 1920    | alturaIntrinseca   | 250        | 250    | diagnóstico |
| `curso.3.supervisor`    | 1920    | larguraRenderizada | 250        | 320.41 | **não**     |
| `curso.3.supervisor`    | 1920    | alturaRenderizada  | 250        | 240.3  | **não**     |
| `curso.3.supervisor`    | 1920    | offsetEsquerdo     | 35.19      | 0      | **não**     |
| `curso.3.supervisor`    | 1920    | offsetDireito      | 35.2       | 0      | **não**     |
| `curso.3.supervisor`    | 1920    | ateLegenda         | 29.69      | 24     | **não**     |
