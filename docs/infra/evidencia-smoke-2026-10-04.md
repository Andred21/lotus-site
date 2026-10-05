# Evidência — smoke de produção no domínio próprio (`7.2.4`)

Bloco `B4`, spec `docs/superpowers/specs/2026-09-28-7.2.3-7.2.4-backup-rollback-smoke-design.md`,
§4.5 e §5. Datas e comandos abaixo são os executados; nada é digitado de memória.

## 1. Change set do domínio (`lotus-site`, sa-east-1)

- **Change set:**
  `arn:aws:cloudformation:sa-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791152307/bef63f37-78c0-409e-97f3-a4675afa5382`,
  criado por Claude em 2026-10-04T22:18:27Z (`deploy --no-execute-changeset` com
  `ArnDoCertificadoDoDominio`; os demais parâmetros, os do stack). Duas linhas, e só elas:
  `RedirecionarWww` `Add` e `Distribuicao` `Modify` com `Substituicao: False`, esta só em
  `DistributionConfig`. O corpo que `get-template --change-set-name` devolve é o
  `infra/lotus-site.yaml` de `5d0a41b`, salvo cinco linhas de comentário em que `─` e `§` voltam
  como `?` e uma linha vazia no fim.
- **Certificado:**
  `arn:aws:acm:us-east-1:760144413534:certificate/db812e1a-cfed-40f4-997e-ada91b7e852b`, `ISSUED`,
  `NotAfter` 2027-04-11T23:59:59Z.
- **Data e quem executou:** 2026-10-04, João, no terminal dele, como nos estágios 4b a 5 do ensaio
  DNS: rodou o script preparado para o passo (`t15-deploy.sh`, fora do repo), com saída 0.

O script parava antes do `execute` se o change set não estivesse executável, com outro corpo ou
outras linhas; se o stack tivesse mudado desde a revisão (`LastUpdatedTime` do update de `B3`); se
o certificado não estivesse `ISSUED`; ou se a distribuição não estivesse `Deployed` e sem aliases.
Passou em todos. A saída dele, do primeiro portão ao fim do update (consulta ao stack a cada 10 s):

```text
== change set 2026-10-04T22:23:20Z
change set: CREATE_COMPLETE AVAILABLE
corpo igual ao revisado
mudancas: Add RedirecionarWww None;Modify Distribuicao False
stack: UPDATE_COMPLETE (LastUpdatedTime 2026-09-28T03:00:57.265000+00:00)
certificado: ISSUED
distribuicao: Deployed, aliases 0
dominio do CloudFront antes: 200
== execute 2026-10-04T22:23:25Z
estado: UPDATE_IN_PROGRESS (LastUpdatedTime 2026-10-04T22:23:27.190000+00:00) 2026-10-04T22:23:27Z
estado: UPDATE_COMPLETE (LastUpdatedTime 2026-10-04T22:23:27.190000+00:00) 2026-10-04T22:26:59Z
== fim UPDATE_COMPLETE 2026-10-04T22:26:59Z
```

Eventos do stack desde o `execute` (`describe-stack-events`, em ordem de tempo):

| Quando                           | Recurso           | Estado                                | Motivo                               |
| -------------------------------- | ----------------- | ------------------------------------- | ------------------------------------ |
| 2026-10-04T22:23:27.190000+00:00 | `lotus-site`      | `UPDATE_IN_PROGRESS`                  | User Initiated                       |
| 2026-10-04T22:23:30.552000+00:00 | `RedirecionarWww` | `CREATE_IN_PROGRESS`                  | None                                 |
| 2026-10-04T22:23:33.979000+00:00 | `RedirecionarWww` | `CREATE_IN_PROGRESS`                  | Resource creation Initiated          |
| 2026-10-04T22:23:34.185000+00:00 | `RedirecionarWww` | `CREATE_IN_PROGRESS`                  | Eventual consistency check initiated |
| 2026-10-04T22:23:35.372000+00:00 | `RedirecionarWww` | `CREATE_COMPLETE`                     | None                                 |
| 2026-10-04T22:23:38.739000+00:00 | `Distribuicao`    | `UPDATE_IN_PROGRESS`                  | None                                 |
| 2026-10-04T22:26:49.561000+00:00 | `Distribuicao`    | `UPDATE_IN_PROGRESS`                  | Eventual consistency check initiated |
| 2026-10-04T22:26:50.587000+00:00 | `Distribuicao`    | `UPDATE_COMPLETE`                     | None                                 |
| 2026-10-04T22:26:54.381000+00:00 | `lotus-site`      | `UPDATE_COMPLETE_CLEANUP_IN_PROGRESS` | None                                 |
| 2026-10-04T22:26:55.318000+00:00 | `lotus-site`      | `UPDATE_COMPLETE`                     | None                                 |

O stack chegou a `UPDATE_COMPLETE` 3 min 30 s depois do `execute`, quase todo no `Distribuicao`
(de 22:23:38Z a 22:26:50Z). O change set terminou `EXECUTE_COMPLETE`, sem `StatusReason`, e o
`wait distribution-deployed` voltou às 22:27:01Z, com a distribuição já `Deployed`.

**Depois:** a distribuição com os dois aliases, o certificado do ACM e a função no
`viewer-request` do behavior padrão (`get-distribution`, 22:27Z):

```text
{
    "Estado": "Deployed",
    "Aliases": [
        "lotusotec.cl",
        "www.lotusotec.cl"
    ],
    "Certificado": {
        "CloudFrontDefaultCertificate": false,
        "ACMCertificateArn": "arn:aws:acm:us-east-1:760144413534:certificate/db812e1a-cfed-40f4-997e-ada91b7e852b",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021",
        "Certificate": "arn:aws:acm:us-east-1:760144413534:certificate/db812e1a-cfed-40f4-997e-ada91b7e852b",
        "CertificateSource": "acm"
    },
    "Funcoes": {
        "Quantity": 1,
        "Items": [
            {
                "FunctionARN": "arn:aws:cloudfront::760144413534:function/lotus-site-redirecionar-www",
                "EventType": "viewer-request"
            }
        ]
    }
}
```

A função `lotus-site-redirecionar-www` ficou `DEPLOYED` no estágio `LIVE` (`cloudfront-js-2.0`).
O certificado ficou em uso pela distribuição (`InUseBy` `E1R7SPH4OLUIEQ`) e com
`RenewalEligibility` `ELIGIBLE`: elegível à renovação gerenciada já em `B4`, e não em `B5` como o
`runbook-aws.md` §6.6 dizia, porque o domínio entrou na distribuição neste bloco (spec D5).

**Prova rápida** (Task 15, Step 4), no mesmo script, às 22:27:05Z, contra a borda que o
`getent ahostsv4 dhpoztt69jydz.cloudfront.net` deu: os três primeiros cabeçalhos do apex e a linha
`server:` dele; o status e o `location` do `www`; o domínio do CloudFront, 200 como antes.

```text
== prova rapida 2026-10-04T22:27:05Z
borda: 3.166.160.83
HTTP/2 200
server: CloudFront
content-type: text/html
server: CloudFront
HTTP/2 301
location: https://lotusotec.cl/a?b=1
dominio do CloudFront depois: 200
== fim do script 2026-10-04T22:27:07Z
```

O `www`, inteiro (o mesmo `curl -sI`): `x-cache: FunctionGeneratedResponse` — o 301 é da função,
sem ir à origem — e com a política de cabeçalhos de `B3`.

```text
HTTP/2 301
server: CloudFront
date: Sun, 04 Oct 2026 22:27:07 GMT
content-length: 0
location: https://lotusotec.cl/a?b=1
x-cache: FunctionGeneratedResponse from cloudfront
via: 1.1 1d0391bbfdc11bd51d0e04191d028e40.cloudfront.net (CloudFront)
x-amz-cf-pop: MIA50-P3
alt-svc: h3=":443"; ma=86400
x-amz-cf-id: TdfHU9msoTPKvnA8DtWB1wZUN6TN6sQRHCE_7hlWW2iI_HsSqw0pHg==
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
content-security-policy: default-src 'none'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'; frame-ancestors 'none'
x-content-type-options: nosniff
strict-transport-security: max-age=31536000
permissions-policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
x-robots-tag: noindex, nofollow
```

## 2. SHA no ar

`ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb` — último `CI` verde de `Gatika-CL/lotus-site` em
`main` (`gh run list --repo Gatika-CL/lotus-site --workflow CI --branch main --status success
--limit 1 --json headSha,updatedAt`, `updatedAt` 2026-09-28T01:10:23Z). É o mesmo de `B3`: não
houve deploy desde então. O smoke lê o SHA pelo mesmo `gh` (item 1).

## 3. `pnpm smoke` contra `https://lotusotec.cl` forçado para a distribuição

`SMOKE_URL=https://lotusotec.cl SMOKE_VIA=dhpoztt69jydz.cloudfront.net pnpm smoke`, rodado por
Claude duas vezes: a primeira deu o item 3 vermelho; a segunda, depois da correção, verde.

### Primeira execução: item 3 vermelho

2026-10-04T22:29:30Z a 22:30:07Z, saída 1, com 9 passed e 1 failed. Os outros nove testes
passaram, com as mesmas linhas `[smoke]` da segunda execução. Do relatório:

```text
[smoke] http://lotusotec.cl/ → 301 https://lotusotec.cl/
[smoke] https://www.lotusotec.cl/cursos/?a=1&a=2&b=x → 301 https://lotusotec.cl/cursos/?b=x&a=1&a=2
  ✘   4 [smoke] › e2e/smoke/3-redirects.spec.ts:6:1 › 3 · redirects: http → https, www → apex com caminho e query; cadeia registrada (581ms)
[…]
    Error: expect(received).toBe(expected) // Object.is equality

    Expected: "https://lotusotec.cl/cursos/?a=1&a=2&b=x"
    Received: "https://lotusotec.cl/cursos/?b=x&a=1&a=2"
[…]
  1 failed
    [smoke] › e2e/smoke/3-redirects.spec.ts:6:1 › 3 · redirects: http → https, www → apex com caminho e query; cadeia registrada
  9 passed (32.5s)
```

**Causa.** A função monta a query na ordem do objeto `querystring` que o CloudFront entrega a ela
(`RedirecionarWww`, `infra/lotus-site.yaml`), e o evento não traz a query crua: "The `querystring`
object contains one field for each query string parameter in the request", e nada sobre ordem
(AWS, "CloudFront Functions event structure", lida em 2026-10-04):
<https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html>

O que a borda faz, medido por Claude, fora do plano, com
`curl -sI --resolve "www.lotusotec.cl:443:<IP>" "https://www.lotusotec.cl/c/?<query>"` — só
`HEAD`; a resposta é da função, sem ir à origem.

Ordem, às 22:31:02Z, na borda `3.166.160.79`:

| Pedido                                      | `location`                                                         |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `?a=1&a=2&b=x`                              | `https://lotusotec.cl/c/?b=x&a=1&a=2`                              |
| `?b=x&a=1&a=2`                              | `https://lotusotec.cl/c/?b=x&a=1&a=2`                              |
| `?a=1&b=x`                                  | `https://lotusotec.cl/c/?b=x&a=1`                                  |
| `?b=1&a=2`                                  | `https://lotusotec.cl/c/?b=1&a=2`                                  |
| `?z=1&y=2&x=3`                              | `https://lotusotec.cl/c/?y=2&x=3&z=1`                              |
| `?a=1&b=x&a=2`                              | `https://lotusotec.cl/c/?b=x&a=1&a=2`                              |
| `?c=1&c=2&b=1&a=1`                          | `https://lotusotec.cl/c/?b=1&c=1&c=2&a=1`                          |
| `?m=1&k=1&k=2&j=1&j=2&i=1`                  | `https://lotusotec.cl/c/?m=1&k=1&k=2&j=1&j=2&i=1`                  |
| `?utm_source=x&utm_medium=y&utm_campaign=z` | `https://lotusotec.cl/c/?utm_medium=y&utm_campaign=z&utm_source=x` |

Codificação, às 22:31:51Z, na mesma borda:

| Pedido                               | `location`                          |
| ------------------------------------ | ----------------------------------- |
| `?q=a%26b`                           | `https://lotusotec.cl/c/?q=a%26b`   |
| `?q=a%20b`                           | `https://lotusotec.cl/c/?q=a%20b`   |
| `?q=a+b`                             | `https://lotusotec.cl/c/?q=a+b`     |
| `?q=%C3%A9`                          | `https://lotusotec.cl/c/?q=%C3%A9`  |
| `?q=a%3Db`                           | `https://lotusotec.cl/c/?q=a%3Db`   |
| `?q=a%23b`                           | `https://lotusotec.cl/c/?q=a%23b`   |
| `?vazio`                             | `https://lotusotec.cl/c/?vazio=`    |
| `?vazio=`                            | `https://lotusotec.cl/c/?vazio=`    |
| `?k=1&k=1`                           | `https://lotusotec.cl/c/?k=1&k=1`   |
| `?A=1&a=2`                           | `https://lotusotec.cl/c/?A=1&a=2`   |
| `?q=a/b?c`                           | `https://lotusotec.cl/c/?q=a/b?c`   |
| `/%C3%A9/a%20b` (caminho, sem query) | `https://lotusotec.cl/%C3%A9/a%20b` |

A ordem entre chaves diferentes não é a da URL, com chave repetida ou sem ela (`?a=1&b=x` sai
`?b=x&a=1`), nem a alfabética (`?b=1&a=2` fica como veio; `?z=1&y=2&x=3` sai `?y=2&x=3&z=1`). A
dos valores de uma mesma chave é a da URL, mesmo com outra chave no meio (`?a=1&b=x&a=2` sai
`?b=x&a=1&a=2`). Valores e caminho passam como vieram, nem decodificados nem reencodados; chave
sem valor vira `chave=`; chaves que só diferem na caixa ficam separadas. A função não tem como
devolver a ordem da URL, e a spec não a pede (§4.5, item 3: "`www` → 301 apex com caminho e
query"): o defeito era do smoke.

**Correção:** `b23fe46` (`fix(7.2.4)`). O item 3 passa a conferir o caminho exato e os pares crus
da query agrupados por chave, com a ordem dos valores de cada chave; o pedido ganhou um valor com
`%26`, que tem de voltar como veio. Antes do commit, Claude conferiu num script fora do repo que a
comparação nova reprova os defeitos que precisa pegar (valor perdido, `%26` decodificado ou
reencodado, valores de uma chave trocados, query ausente) e aceita só a reordenação. `pnpm check`
verde.

### Segunda execução, depois de `b23fe46`

2026-10-04T22:33:49Z a 22:34:20Z, saída 0:

```text
$ playwright test --config playwright.smoke.config.ts

Running 10 tests using 1 worker

[smoke] SHA no ar: ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb (index.html d3836b522c218bca68d2f7c533189200596a54f109769fb733e0dc4f227fe3cd)
  ✓   1 [smoke] › e2e/smoke/1-artefato.spec.ts:7:1 › 1 · artefato: index.html servido ≡ releases/ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb/index.html (1.3s)
[smoke] lotusotec.cl: TLSv1.3, Amazon, válido até 2027-04-11T23:59:59.000Z
  ✓   2 [smoke] › e2e/smoke/2-tls.spec.ts:7:3 › 2 · TLS de lotusotec.cl: certificado da Amazon com os dois nomes, ≥ 30 dias, TLS ≥ 1.2 (246ms)
[smoke] www.lotusotec.cl: TLSv1.3, Amazon, válido até 2027-04-11T23:59:59.000Z
  ✓   3 [smoke] › e2e/smoke/2-tls.spec.ts:7:3 › 2 · TLS de www.lotusotec.cl: certificado da Amazon com os dois nomes, ≥ 30 dias, TLS ≥ 1.2 (242ms)
[smoke] http://lotusotec.cl/ → 301 https://lotusotec.cl/
[smoke] https://www.lotusotec.cl/cursos/?a=1&a=2&b=x%26y → 301 https://lotusotec.cl/cursos/?b=x%26y&a=1&a=2
[smoke] http://www.lotusotec.cl/x?y=1 → 301 https://www.lotusotec.cl/x?y=1
[smoke] https://www.lotusotec.cl/x?y=1 → 301 https://lotusotec.cl/x?y=1
  ✓   4 [smoke] › e2e/smoke/3-redirects.spec.ts:15:1 › 3 · redirects: http → https, www → apex com caminho e query; cadeia registrada (954ms)
  ✓   5 [smoke] › e2e/smoke/4-home.spec.ts:6:1 › 4 · home: 200, H1, âncoras do menu, console limpo, nenhuma resposta ≥ 400 do site (4.8s)
[smoke] 16 assets immutable (HTML 7, CSS 5, JS 6); 3 de nome fixo no-cache
[smoke] importados pelo JS: /assets/LOTUS_TRANSP_Fondo-Negro-REC2-boV8wriy.png, /assets/shutterstock_1444636373-1-scaled-Bm9ZLwYf.jpg, /assets/home-office-12-C_nJ1MKt.jpg, /assets/LLVV_00-v1-BN2-BOwYFW68.jpeg, /assets/LLVV_Mantas02-BN2-DB-pMcHr.jpeg, /assets/LOTUS-G2_TRANSP_Fondo-Blanco-B3GzsLLb.png
  ✓   6 [smoke] › e2e/smoke/5-assets.spec.ts:16:1 › 5 · assets: todo asset referenciado 200 e immutable; nome fixo no-cache; fontes carregam (7.1s)
  ✓   7 [smoke] › e2e/smoke/6-formulario.spec.ts:11:1 › 6 · formulário: Turnstile carrega; /api/contacto recusa GET, corpo vazio, token ausente e token falso (6.2s)
  ✓   8 [smoke] › e2e/smoke/7-seo.spec.ts:6:1 › 7 · SEO técnico: title, description, canonical, og:*, JSON-LD, robots, sitemap, X-Robots-Tag (1.6s)
  ✓   9 [smoke] › e2e/smoke/8-cabecalhos.spec.ts:8:1 › 8 · cabeçalhos: a política de B3 em /, asset, /api/contacto e 404 (1.9s)
  ✓  10 [smoke] › e2e/smoke/9-404.spec.ts:5:1 › 9 · 404: caminho inexistente devolve 404 (130ms)

  10 passed (27.6s)
```

## 4. `pnpm smoke` contra `https://dhpoztt69jydz.cloudfront.net`

`SMOKE_URL=https://dhpoztt69jydz.cloudfront.net pnpm smoke`, rodado por Claude depois de
`b23fe46`, de 2026-10-04T22:34:29Z a 22:34:55Z, saída 0:

```text
$ playwright test --config playwright.smoke.config.ts

Running 10 tests using 1 worker

[smoke] SHA no ar: ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb (index.html d3836b522c218bca68d2f7c533189200596a54f109769fb733e0dc4f227fe3cd)
  ✓   1 [smoke] › e2e/smoke/1-artefato.spec.ts:7:1 › 1 · artefato: index.html servido ≡ releases/ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb/index.html (1.3s)
[smoke] lotusotec.cl: TLSv1.3, Amazon, válido até 2027-04-11T23:59:59.000Z
  ✓   2 [smoke] › e2e/smoke/2-tls.spec.ts:7:3 › 2 · TLS de lotusotec.cl: certificado da Amazon com os dois nomes, ≥ 30 dias, TLS ≥ 1.2 (255ms)
[smoke] www.lotusotec.cl: TLSv1.3, Amazon, válido até 2027-04-11T23:59:59.000Z
  ✓   3 [smoke] › e2e/smoke/2-tls.spec.ts:7:3 › 2 · TLS de www.lotusotec.cl: certificado da Amazon com os dois nomes, ≥ 30 dias, TLS ≥ 1.2 (266ms)
[smoke] http://lotusotec.cl/ → 301 https://lotusotec.cl/
[smoke] https://www.lotusotec.cl/cursos/?a=1&a=2&b=x%26y → 301 https://lotusotec.cl/cursos/?b=x%26y&a=1&a=2
[smoke] http://www.lotusotec.cl/x?y=1 → 301 https://www.lotusotec.cl/x?y=1
[smoke] https://www.lotusotec.cl/x?y=1 → 301 https://lotusotec.cl/x?y=1
  ✓   4 [smoke] › e2e/smoke/3-redirects.spec.ts:15:1 › 3 · redirects: http → https, www → apex com caminho e query; cadeia registrada (1.1s)
  ✓   5 [smoke] › e2e/smoke/4-home.spec.ts:6:1 › 4 · home: 200, H1, âncoras do menu, console limpo, nenhuma resposta ≥ 400 do site (4.6s)
[smoke] 16 assets immutable (HTML 7, CSS 5, JS 6); 3 de nome fixo no-cache
[smoke] importados pelo JS: /assets/LOTUS_TRANSP_Fondo-Negro-REC2-boV8wriy.png, /assets/shutterstock_1444636373-1-scaled-Bm9ZLwYf.jpg, /assets/home-office-12-C_nJ1MKt.jpg, /assets/LLVV_00-v1-BN2-BOwYFW68.jpeg, /assets/LLVV_Mantas02-BN2-DB-pMcHr.jpeg, /assets/LOTUS-G2_TRANSP_Fondo-Blanco-B3GzsLLb.png
  ✓   6 [smoke] › e2e/smoke/5-assets.spec.ts:16:1 › 5 · assets: todo asset referenciado 200 e immutable; nome fixo no-cache; fontes carregam (7.0s)
  ✓   7 [smoke] › e2e/smoke/6-formulario.spec.ts:11:1 › 6 · formulário: Turnstile carrega; /api/contacto recusa GET, corpo vazio, token ausente e token falso (4.2s)
  ✓   8 [smoke] › e2e/smoke/7-seo.spec.ts:6:1 › 7 · SEO técnico: title, description, canonical, og:*, JSON-LD, robots, sitemap, X-Robots-Tag (1.4s)
  ✓   9 [smoke] › e2e/smoke/8-cabecalhos.spec.ts:8:1 › 8 · cabeçalhos: a política de B3 em /, asset, /api/contacto e 404 (1.7s)
  ✓  10 [smoke] › e2e/smoke/9-404.spec.ts:5:1 › 9 · 404: caminho inexistente devolve 404 (121ms)

  10 passed (24.6s)
```

## 5. Envio real (spec D11)

- **Envio:** por João, em 2026-10-04, num navegador com `lotusotec.cl` e `www.lotusotec.cl`
  forçados para a distribuição, pelo roteiro passado a ele no Step 4: perfil novo do navegador com
  `--host-resolver-rules` para a borda `3.166.160.83`; o certificado da Amazon no cadeado;
  `https://lotusotec.cl/`, o formulário e o envio. João deu o roteiro como feito.
- **No servidor:** os logs da função `lotus-site-contato` (CloudWatch Logs, lidos por Claude às
  22:46Z, fora do plano) têm uma invocação só desde 22:38Z, quando o fluxo parou neste passo:
  `START` às 22:44:20Z e, às 22:44:23.442Z,
  `{"requestId":"a2afb22e-65d7-4d3b-b944-35f2a0cb64b6","desfecho":"enviado"}`. `enviado` é o
  último degrau do handler (`lambda/contato/handler.ts`: método, tamanho, JSON, schema, captcha,
  envio): o siteverify aceitou o token do widget e o SES aceitou a mensagem. O handler só registra
  o `requestId` e o desfecho, nenhum campo do formulário. A Function URL só aceita chamada
  assinada (`AuthType: AWS_IAM`), com a permissão presa à distribuição por `SourceArn`
  (`infra/lotus-site.yaml`): o pedido veio pela distribuição, e não do WordPress.
- **Recebido:** em `contacto@lotusotec.cl`, com o assunto fixo
  `Nuevo mensaje desde el sitio de Lotus OTEC` (`lambda/contato/ses.ts`); o cliente confirmou a
  João a chegada (declaração de João, 2026-10-04). A hora da chegada e o texto da mensagem não
  foram informados.

## Limites declarados (spec §7)

- O smoke roda em Chromium.
- O apex e `www` continuam no WordPress: o que se provou é a distribuição respondendo pelos dois
  nomes; o corte é `B5`.
- Itens 2 e 3 são conferidos contra os nomes reais em ambas as execuções; só o navegador e os
  pedidos relativos mudam de host entre as duas.
- Pelo `www`, a query chega ao apex com todos os pares, mas na ordem do objeto que o CloudFront
  entrega à função, não na da URL (§3). Depois do corte, isso vale para todo visitante que entrar
  pelo `www` com query; parâmetros de campanha (`utm_*`, `gclid`) são lidos pelo nome.
- O recebimento é declaração de João, pela confirmação do cliente: o log da função prova o envio
  aceito pelo SES, não a entrega na caixa.
