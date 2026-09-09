# Evidência do pipeline de publicação — 2026-09-09

> Bloco `B0 · espelho-8982f50`. Fecha o `D-33`, cujo pedido era exercitar o pipeline de verdade em
> vez de conferi-lo por simulação e inspeção de diff. Quatro evidências, cada uma com o run que a
> produziu. Nenhum arquivo de aplicação, infra ou build muda neste bloco.
>
> Decisão de hospedagem em [`ADR-SITE-004`](../adr/ADR-SITE-004.md). O pipeline está em
> `.github/workflows/ci.yml` e a promoção em `scripts/espelhar-corporativo.sh`.

## O que se quer provar

O aceite da `7.1.5` diz "merge/promoção definida gera deployment rastreável e falha de CI impede
publicação". As quatro evidências abaixo são as duas metades dessa frase: as duas primeiras provam
que a promoção publica, a terceira prova que o repositório pessoal não publica, e a quarta prova
que commit sem procedência não publica.

| #   | Evidência                                            | Estado |
| --- | ---------------------------------------------------- | ------ |
| E1  | `procedencia` verde no corporativo                   | ✅     |
| E2  | `deploy` publicando `releases/<sha>/` no corporativo | ✅     |
| E3  | `deploy` como `skipped` no run de push do pessoal    | ✅     |
| E4  | push direto sem trailer reprovando em `procedencia`  | —      |

## Ponto de partida medido

Medido em 2026-09-09, antes de qualquer push deste bloco:

```text
origin/main    c6c6f9a  Merge pull request #15 from Andred21/chore/reorg-decisoes-aws-2026-09
upstream/main  08026af  release: espelho de 257c807 -- Merge pull request #13 ...
```

O corporativo está três merges atrás: o `fix(7.1.2)` `4986caa` — que destrava o OIDC e a espera da
invalidação — nunca atravessou, e é justamente ele que o `deploy` precisa ter para funcionar. O
nome do bloco cita `8982f50` porque era a ponta de `origin/main` quando ele foi enfileirado; o que
atravessa é a ponta de agora, `c6c6f9a`, que já contém `8982f50`.

Variáveis de repositório do corporativo, conferidas antes de promover:

```text
AWS_BUCKET=lotus-site-prod
AWS_CLOUDFRONT_ID=E1R7SPH4OLUIEQ
AWS_DEPLOY_ROLE_ARN=arn:aws:iam::760144413534:role/lotus-site-deploy
ESPELHO_FONTE=Andred21/lotus-site
```

`ESPELHO_FONTE` é o que abre o caminho de espelho no job `procedencia`: sem ela, trailer nenhum
comprova origem e o job reprova por construção.

## E3 · `deploy` como `skipped` no run de push do pessoal

Esta evidência não precisou de push novo: o merge do PR #15 já tinha produzido o run de push em
`main` do pessoal.

`Andred21/lotus-site`, run 25, push em `main`, `c6c6f9a`:
<https://github.com/Andred21/lotus-site/actions/runs/34408572059>

```text
check        completed  success
procedencia  completed  success
deploy       completed  skipped
```

`procedencia` passa pelo caminho do Pull Request mesclado, não pelo de espelho — no pessoal a
árvore carrega `docs/` e `.claude/`, então a checagem de árvore limpa reprovaria o caminho de
espelho de qualquer jeito. E o `deploy` é `skipped` porque a condição `vars.AWS_DEPLOY_ROLE_ARN
!= ''` não se satisfaz: a variável só existe no corporativo. É a primeira das duas camadas
descritas no `ci.yml`; a segunda é a trust policy da role, que recusa qualquer `sub` diferente de
`repo:Gatika-CL/lotus-site:ref:refs/heads/main`.

## A promoção

`scripts/espelhar-corporativo.sh` rodado em 2026-09-09, sem `LOTUS_ESPELHO_SEM_CI`:

```text
==> conferindo o CI de c6c6f9a em Andred21/lotus-site
    CI verde.
==> commit de espelho f9069269cf61ac406eed8da892737d87e1eb3353 (fonte c6c6f9a)
   08026af..f906926  -> main
```

O `--simular` antes disso mediu a árvore filtrada: **95 arquivos**, contra 252 na origem. Nenhum
`docs/`, `.claude/`, `.agents/`, `CLAUDE.md` ou `scripts/espelhar-corporativo.sh` na lista de raiz —
o filtro do `.espelho-exclusoes` fez o que promete, e é essa mesma propriedade que o `procedencia`
confere do outro lado.

Run resultante: `Gatika-CL/lotus-site` run 2, push em `main`, `f906926`.
<https://github.com/Gatika-CL/lotus-site/actions/runs/34415359603>

```text
procedencia  completed  success
check        completed  success
deploy       completed  success
```

## E1 · `procedencia` verde no corporativo

Saída do job (`procedencia` do run 2):

```text
release de espelho. Fonte: Andred21/lotus-site@c6c6f9a335f5e61ee351b135cc7e7208767bb452
(identical em relação a main de Andred21/lotus-site).
```

`identical` é o caso forte dos dois aceitos: o trailer não só está no histórico de `main` da
origem, ele **é** a ponta dela. O caminho de espelho só abriu porque as três condições valeram ao
mesmo tempo — trailer presente, árvore sem nenhum path de `.espelho-exclusoes`, e `ESPELHO_FONTE`
definida para conferir a origem contra a API. A `E4` mostra o que acontece quando a primeira falta.

## E2 · `deploy` publicando `releases/<sha>/` no corporativo

O `deploy` assumiu a role por OIDC, sem segredo de longa duração:

```text
Authenticated as assumedRoleId AROA3B7BDINPHL2WCXNLV:GitHubActions
```

Este é o `fix(7.1.2)` `4986caa` funcionando pela primeira vez em run real: era ele que corrigia o
`sub` da trust policy e a espera da invalidação, e era ele que nunca tinha atravessado para o
corporativo (`D-33`).

Objetos movidos, contados no log do job:

```text
21 upload  -> s3://lotus-site-prod/releases/f9069269cf61ac406eed8da892737d87e1eb3353/
21 upload  -> s3://lotus-site-prod/            (promoção para a raiz)
 0 delete                                       (nada saiu do build desde o release anterior)
```

Invalidação criada e esperada até concluir, os dois passos no mesmo job:

```text
invalidação I64T5RWAP29QCQZEWV7CJS24X3 criada; esperando concluir
invalidação I64T5RWAP29QCQZEWV7CJS24X3 concluída
```

Rastro final, que é a parte "deployment rastreável" do aceite:

```text
release publicado em s3://lotus-site-prod/releases/f9069269cf61ac406eed8da892737d87e1eb3353/
commit de origem: c6c6f9a335f5e61ee351b135cc7e7208767bb452
```

Conferido no ar logo depois, em `https://dhpoztt69jydz.cloudfront.net/`:

```text
HTTP/2 200
last-modified: Wed, 09 Sep 2026 23:09:52 GMT
cache-control: no-cache
x-robots-tag: noindex, nofollow

/nao-existe -> 404
```

O `last-modified` é o minuto do `deploy`, não o de uma publicação anterior: o que está no ar é o
artefato deste run.
