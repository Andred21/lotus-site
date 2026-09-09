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
| E1  | `procedencia` verde no corporativo                   | —      |
| E2  | `deploy` publicando `releases/<sha>/` no corporativo | —      |
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
