# Rodada referência × clone — 2026-10-11

> Bloco `recaptura-baseline` (`B8`). Material da conferência humana de paridade (PENDÊNCIA 4):
> abra `contact-sheet.html` desta pasta. A rodada não decide paridade; o veredito é de João e entra
> no fechamento do bloco.

## Alvos

| lado         | URL                     | servido por                                                              | capturado em (`manifest.json`) |
| ------------ | ----------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| `referencia` | `https://lotusotec.cl/` | WordPress em `185.146.167.195` (Apache), por `--host-resolver-rules`     | `2026-10-11T18:13:54.976Z`     |
| `clone`      | `https://lotusotec.cl/` | produção, CloudFront, release `4e8b3bb1f7949676820561a8b584045cefb40076` | `2026-10-11T18:14:17.487Z`     |

O release foi conferido como o item 1 do smoke (`e2e/smoke/1-artefato.spec.ts`): o `index.html` da
raiz é byte a byte o de `releases/4e8b3bb1f7949676820561a8b584045cefb40076/index.html`, antes e
depois da captura do clone. O sha é o do último `CI` verde de `main` em `Gatika-CL/lotus-site`.

## Como foi gerada

```bash
pnpm qa:referencia
CLONE_URL=https://lotusotec.cl/ pnpm qa:clone
pnpm qa:contact-sheet
```

Os dois lados capturam a página inteira por `capturarPaginaInteira` (`scripts/inventario/lib/site.mjs`):
o topo vem de um screenshot de viewport e o resto do `fullPage`, porque o `fullPage` sozinho
redesenha o cabeçalho desktop do WordPress em outro estado (`D-30`). O menu aberto em `375` é
screenshot de viewport. A referência reprova se a resposta vier da CloudFront.

## O que a rodada já mostra, sem julgamento

- Os cinco PNG de `referencia/` são byte a byte os de `docs/inventario/baseline/`, recapturados no
  mesmo dia: a referência da conferência é o baseline.
- Altura capturada:

  | estado     | referência | clone  |
  | ---------- | ---------- | ------ |
  | `375`      | 5467px     | 5110px |
  | `375-menu` | 812px      | 812px  |
  | `768`      | 4913px     | 4364px |
  | `1440`     | 3441px     | 3175px |
  | `1920`     | 3409px     | 3171px |

- `node scripts/inventario/comparar-png.mjs referencia/<png> clone/<png>` acha divergência em todos
  os estados; o número de pixels não separa diferença de deslocamento vertical, então não é veredito.

## Alvo da referência provado por medição

`node scripts/qa/medir-header-cursos.mjs`, com o WordPress pelo IP e o build local servido na porta
5184, reproduz `docs/qa/paridade/2026-09-02/header-cursos.md` byte a byte; no `.json` só
`capturadoEm` mudou, e foi revertido. A coluna de referência daquela tabela traz o `boxShadow` do WordPress como uma sombra só (`rgba(0, 0, 0, 0.1) 0px 1px 0px 0px`); o do clone é uma pilha de cinco sombras. Medida contra a CloudFront, a coluna mudaria.

## Conferência humana

Pendente. O veredito de João sobre `contact-sheet.html` entra no fechamento do bloco; divergência
que a conferência achar vira débito novo no backlog, não correção neste bloco.
