# Evidência — cutover de `lotusotec.cl` (`7.2.5`)

Bloco `B5`, spec `docs/superpowers/specs/2026-10-04-7.2.5-cutover-lotusotec-design.md`, §5 e §7.
Horários em UTC; tabelas coladas da saída dos scripts.

## 1. `D-39` — `PriceClass_All` e a latência a partir do Chile (spec D4)

### 1.1 Linha de base: o WordPress

```bash
node scripts/infra/medir-latencia.mjs --alvo lotusotec.cl
```

Medição `2gCnAzOrC1AsubQxh00021G5S` de `lotusotec.cl`, criada em 2026-10-05T03:22:46.850Z; sondas: 10 novas de CL.

| #   | sonda        | rede                                | status   | IP resolvido    | HTTP | x-amz-cf-pop | x-cache | dns | tcp | tls | firstByte | total |
| --- | ------------ | ----------------------------------- | -------- | --------------- | ---- | ------------ | ------- | --- | --- | --- | --------- | ----- |
| 1   | Santiago     | AS20473 The Constant Company        | finished | 185.146.167.195 | 200  | —            | —       | 58  | 0   | 3   | 1         | 63    |
| 2   | Vina del Mar | AS31898 Oracle                      | finished | 185.146.167.195 | 200  | —            | —       | 9   | 4   | 7   | 4         | 26    |
| 3   | Santiago     | AS61138 Zappie Host                 | finished | 185.146.167.195 | 200  | —            | —       | 15  | 43  | 22  | 10        | 104   |
| 4   | Santiago     | AS136907 HUAWEI CLOUDS              | finished | 185.146.167.195 | 200  | —            | —       | 9   | 4   | 6   | 6         | 26    |
| 5   | Santiago     | AS31898 Oracle                      | finished | 185.146.167.195 | 200  | —            | —       | 58  | 1   | 17  | 4         | 80    |
| 6   | Santiago     | AS270013 J AND J SPA (INFOFRACTAL)  | finished | 185.146.167.195 | 200  | —            | —       | 226 | 2   | 6   | 3         | 238   |
| 7   | Curico       | AS52368 ZAM                         | finished | 185.146.167.195 | 200  | —            | —       | 45  | 7   | 17  | 9         | 81    |
| 8   | Vina del Mar | AS28099 iHosting Servicios Internet | finished | 185.146.167.195 | 200  | —            | —       | 12  | 5   | 9   | 6         | 34    |
| 9   | Santiago     | AS396982 Google                     | finished | 185.146.167.195 | 200  | —            | —       | 62  | 95  | 97  | 191       | 446   |
| 10  | Santiago     | AS266713 WMAX                       | finished | 185.146.167.195 | 200  | —            | —       | 59  | 2   | 4   | 2         | 68    |

10 de 10 sondas terminaram. `firstByte`: mediana 5 ms (1–191); `total`: mediana 74 ms (26–446).

### 1.2 A distribuição antes, em `PriceClass_100`, com as mesmas sondas

```bash
node scripts/infra/medir-latencia.mjs --alvo dhpoztt69jydz.cloudfront.net --sondas 2gCnAzOrC1AsubQxh00021G5S
```

Medição `2UgSBdcEZ1PSr1uFh00021G5S` de `dhpoztt69jydz.cloudfront.net`, criada em 2026-10-05T03:22:56.474Z; sondas: as mesmas da medição `2gCnAzOrC1AsubQxh00021G5S`.

| #   | sonda        | rede                                | status   | IP resolvido  | HTTP | x-amz-cf-pop | x-cache                    | dns | tcp | tls | firstByte | total |
| --- | ------------ | ----------------------------------- | -------- | ------------- | ---- | ------------ | -------------------------- | --- | --- | --- | --------- | ----- |
| 1   | Santiago     | AS20473 The Constant Company        | finished | 3.166.160.79  | 200  | MIA50-P3     | Hit from cloudfront        | 111 | 124 | 127 | 402       | 765   |
| 2   | Vina del Mar | AS31898 Oracle                      | finished | 3.166.160.121 | 200  | MIA50-P3     | Hit from cloudfront        | 57  | 128 | 132 | 445       | 763   |
| 3   | Santiago     | AS61138 Zappie Host                 | finished | 3.166.160.79  | 200  | MIA50-P3     | Hit from cloudfront        | 55  | 130 | 137 | 459       | 783   |
| 4   | Santiago     | AS136907 HUAWEI CLOUDS              | finished | 3.166.160.121 | 200  | MIA50-P3     | Hit from cloudfront        | 61  | 120 | 123 | 468       | 774   |
| 5   | Santiago     | AS31898 Oracle                      | finished | 3.166.160.79  | 200  | MIA50-P3     | Hit from cloudfront        | 63  | 115 | 119 | 469       | 767   |
| 6   | Santiago     | AS270013 J AND J SPA (INFOFRACTAL)  | finished | 3.166.160.56  | 200  | MIA50-P3     | Hit from cloudfront        | 167 | 105 | 107 | 361       | 741   |
| 7   | Curico       | AS52368 ZAM                         | finished | 3.166.160.56  | 200  | MIA50-P3     | Hit from cloudfront        | 84  | 136 | 144 | 378       | 745   |
| 8   | Vina del Mar | AS28099 iHosting Servicios Internet | finished | 3.166.160.56  | 200  | MIA50-P3     | RefreshHit from cloudfront | 60  | 101 | 108 | 498       | 770   |
| 9   | Santiago     | AS396982 Google                     | finished | 3.166.160.121 | 200  | MIA50-P3     | Hit from cloudfront        | 154 | 94  | 98  | 417       | 765   |
| 10  | Santiago     | AS266713 WMAX                       | finished | 3.166.160.79  | 200  | MIA50-P3     | Hit from cloudfront        | 152 | 107 | 110 | 399       | 769   |

10 de 10 sondas terminaram. `firstByte`: mediana 431 ms (361–498); `total`: mediana 766 ms (741–783).

### 1.3 Change set do `lotus-site`

- Data: 2026-10-05.
- Executou: Claude, com autorização explícita de João dada neste passo ("autorizado", em resposta
  ao portão do Step 10).
- Change set: `arn:aws:cloudformation:sa-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791170604/8724505d-678f-436e-be2a-dd6da6736a83`
  (stack `lotus-site`, `sa-east-1`).

```text
|  Acao  |    Recurso     | Substituicao   |
|  Modify|  Distribuicao  |  False         |
```

```text
Distribuicao /Properties/DistributionConfig/PriceClass: "PriceClass_100" -> "PriceClass_All"
```

- `execute-change-set`: 2026-10-05T03:26:34Z.
- `UPDATE_COMPLETE` da stack (evento): 2026-10-05T03:29:30Z.
- `Deployed` da distribuição, com `PriceClass_All` lido em `get-distribution`: visto às
  2026-10-05T03:29:55Z.

### 1.4 A distribuição depois, em `PriceClass_All`, com as mesmas sondas

```bash
node scripts/infra/medir-latencia.mjs --alvo dhpoztt69jydz.cloudfront.net --sondas 2gCnAzOrC1AsubQxh00021G5S
```

Primeira leitura, 12 s depois do `Deployed`:

Medição `2X2o1z7jJTybqe7oR00021G5a` de `dhpoztt69jydz.cloudfront.net`, criada em 2026-10-05T03:30:07.916Z; sondas: as mesmas da medição `2gCnAzOrC1AsubQxh00021G5S`.

| #   | sonda        | rede                                | status   | IP resolvido   | HTTP | x-amz-cf-pop | x-cache                    | dns | tcp | tls | firstByte | total |
| --- | ------------ | ----------------------------------- | -------- | -------------- | ---- | ------------ | -------------------------- | --- | --- | --- | --------- | ----- |
| 1   | Santiago     | AS20473 The Constant Company        | finished | 13.227.123.105 | 200  | SCL51-P6     | Miss from cloudfront       | 191 | 1   | 6   | 327       | 527   |
| 2   | Vina del Mar | AS31898 Oracle                      | finished | 13.227.123.119 | 200  | SCL51-P6     | Hit from cloudfront        | 60  | 4   | 9   | 451       | 527   |
| 3   | Santiago     | AS61138 Zappie Host                 | finished | 13.227.123.105 | 200  | SCL51-P6     | Hit from cloudfront        | 57  | 3   | 11  | 455       | 528   |
| 4   | Santiago     | AS136907 HUAWEI CLOUDS              | finished | 65.8.207.2     | 200  | EZE50-P6     | Hit from cloudfront        | 55  | 22  | 28  | 323       | 429   |
| 5   | Santiago     | AS31898 Oracle                      | finished | 13.227.123.109 | 200  | SCL51-P6     | Hit from cloudfront        | 62  | 1   | 7   | 453       | 524   |
| 6   | Santiago     | AS270013 J AND J SPA (INFOFRACTAL)  | finished | 3.166.160.56   | 200  | MIA50-P3     | RefreshHit from cloudfront | 77  | 134 | 142 | 540       | 895   |
| 7   | Curico       | AS52368 ZAM                         | finished | 13.227.123.109 | 200  | SCL51-P6     | Hit from cloudfront        | 125 | 6   | 22  | 350       | 507   |
| 8   | Vina del Mar | AS28099 iHosting Servicios Internet | finished | 13.227.123.109 | 200  | SCL51-P6     | Hit from cloudfront        | 61  | 5   | 13  | 446       | 527   |
| 9   | Santiago     | AS396982 Google                     | finished | 65.8.207.49    | 200  | EZE50-P6     | Miss from cloudfront       | 110 | 22  | 28  | 268       | 431   |
| 10  | Santiago     | AS266713 WMAX                       | finished | 13.227.123.117 | 200  | SCL51-P6     | Hit from cloudfront        | 152 | 1   | 8   | 364       | 525   |

10 de 10 sondas terminaram. `firstByte`: mediana 405 ms (268–540); `total`: mediana 526 ms (429–895).

Segunda leitura, cerca de 3 min depois, com o mesmo comando:

Medição `2oYqGnWU4l2ZpxpKU00021G5d` de `dhpoztt69jydz.cloudfront.net`, criada em 2026-10-05T03:33:29.792Z; sondas: as mesmas da medição `2gCnAzOrC1AsubQxh00021G5S`.

| #   | sonda        | rede                                | status   | IP resolvido   | HTTP | x-amz-cf-pop | x-cache                    | dns | tcp | tls | firstByte | total |
| --- | ------------ | ----------------------------------- | -------- | -------------- | ---- | ------------ | -------------------------- | --- | --- | --- | --------- | ----- |
| 1   | Santiago     | AS20473 The Constant Company        | finished | 13.227.123.109 | 200  | SCL51-P6     | Hit from cloudfront        | 106 | 1   | 7   | 164       | 279   |
| 2   | Vina del Mar | AS31898 Oracle                      | finished | 13.227.123.109 | 200  | SCL51-P6     | RefreshHit from cloudfront | 62  | 3   | 9   | 203       | 278   |
| 3   | Santiago     | AS61138 Zappie Host                 | finished | 54.230.124.29  | 200  | LIM50-P4     | Hit from cloudfront        | 116 | 33  | 38  | 613       | 801   |
| 4   | Santiago     | AS136907 HUAWEI CLOUDS              | finished | 65.8.207.78    | 200  | EZE50-P6     | RefreshHit from cloudfront | 54  | 23  | 29  | 145       | 251   |
| 5   | Santiago     | AS31898 Oracle                      | finished | 13.227.123.105 | 200  | SCL51-P6     | Hit from cloudfront        | 112 | 1   | 7   | 157       | 278   |
| 6   | Santiago     | AS270013 J AND J SPA (INFOFRACTAL)  | finished | 3.166.160.56   | 200  | MIA50-P3     | RefreshHit from cloudfront | 66  | 104 | 109 | 498       | 778   |
| 7   | Curico       | AS52368 ZAM                         | finished | 3.166.160.121  | 200  | MIA50-P3     | Hit from cloudfront        | 71  | 142 | 148 | 454       | 819   |
| 8   | Vina del Mar | AS28099 iHosting Servicios Internet | finished | 13.227.123.117 | 200  | SCL51-P6     | Hit from cloudfront        | 215 | 5   | 12  | 45        | 279   |
| 9   | Santiago     | AS396982 Google                     | finished | 65.8.207.2     | 200  | EZE50-P6     | Hit from cloudfront        | 64  | 22  | 28  | 136       | 252   |
| 10  | Santiago     | AS266713 WMAX                       | finished | 13.227.123.117 | 200  | SCL51-P6     | Hit from cloudfront        | 152 | 1   | 7   | 116       | 277   |

10 de 10 sondas terminaram. `firstByte`: mediana 161 ms (45–613); `total`: mediana 279 ms (251–819).

Antes e depois (segunda leitura): `firstByte` 431 → 161 ms e `total` 766 → 279 ms de mediana; borda
`MIA50` nas 10 sondas antes, depois `SCL51` em 5, `EZE50` em 2, `LIM50` em 1 e `MIA50` em 2. A
borda escolhida depende do resolvedor de cada sonda e não ficou toda em Santiago; registrado como
veio (spec D4: o corte não espera por isso). As duas sondas em `MIA50` (6 e 7) resolveram IPs de
Miami nas duas leituras.

## 2. `sistema` sai da zona (spec D2)

Antes de editar, `pnpm infra:conferir-zona --pos-delegacao` contra a zona viva: saída 0, 21 linhas
`sim`, nenhuma `NÃO`.

### 2.1 Aquecimento

```bash
AWS_PROFILE=lotus node scripts/infra/medir-propagacao.mjs --nome sistema.lotusotec.cl --esperado wordpress --aquecer
```

Nome `sistema.lotusotec.cl`, esperado `wordpress`, aquecimento iniciada em 2026-10-05T03:35:36.569Z

| resolvedor                      | início: A / AAAA (TTL)                           | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | ------------------------------------------------ | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 2567/3600) | —            | —                      | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |

### 2.2 Change set do `lotus-dns`

- Data: 2026-10-05.
- Executou: João.
- Change set: `arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791171347/15ebed03-31ac-4356-a99e-6ba80b7b28d4`
  (stack `lotus-dns`, `us-east-1`).

```text
|  Acao  |   Recurso   | Substituicao   |
|  Modify|  Registros  |  False         |
```

```text
sistema.lotusotec.cl. A
  antes:  {"Type":"A","ResourceRecords":["185.146.167.195"],"TTL":"3600","Name":"sistema.lotusotec.cl."}
  depois: —
sistema.lotusotec.cl. AAAA
  antes:  {"Type":"AAAA","ResourceRecords":["2a07:7800::195"],"TTL":"3600","Name":"sistema.lotusotec.cl."}
  depois: —
```

- `execute-change-set`: 2026-10-05T03:37:34Z (início do `UPDATE_IN_PROGRESS` da stack).
- `UPDATE_COMPLETE` da stack (evento): 2026-10-05T03:38:39Z.

### 2.3 Propagação

```bash
AWS_PROFILE=lotus node scripts/infra/medir-propagacao.mjs --nome sistema.lotusotec.cl --esperado ausente --limite 3900
```

Nome `sistema.lotusotec.cl`, esperado `ausente`, medição iniciada em 2026-10-05T03:39:13.135Z

| resolvedor                      | início: A / AAAA (TTL)          | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | ------------------------------- | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | — / — (TTL —/—)                 | 0 s          | — / — (TTL —/—)        | —                 |
| route53 ns-31.awsdns-03.com     | — / — (TTL —/—)                 | 0 s          | — / — (TTL —/—)        | —                 |
| route53 ns-1889.awsdns-44.co.uk | — / — (TTL —/—)                 | 0 s          | — / — (TTL —/—)        | —                 |
| route53 ns-1507.awsdns-60.org   | — / — (TTL —/—)                 | 0 s          | — / — (TTL —/—)        | —                 |
| google 8.8.8.8                  | — / 2a07:7800::195 (TTL —/3383) | 21 s         | — / — (TTL —/—)        | —                 |
| cloudflare 1.1.1.1              | — / — (TTL —/—)                 | 0 s          | — / — (TTL —/—)        | —                 |
| quad9 9.9.9.9                   | — / 2a07:7800::195 (TTL —/3383) | 3384 s       | — / — (TTL —/—)        | —                 |

Saída 0, às 2026-10-05T04:35:37Z. Os quatro `route53` já respondiam sem o registro no início. Dos
públicos, o Cloudflare já não devolvia nada, o Google largou o `AAAA` em 21 s e o Quad9 o guardou até
o TTL vencer (3384 s). Quem guardou a resposta negativa a guarda por até 900 s, o TTL do SOA (spec
§8).

Depois, `pnpm infra:conferir-zona --pos-delegacao` contra a zona viva e o template novo: saída 0,
19 linhas `sim`, nenhuma `NÃO`, nenhuma linha de `sistema`.

## 3. TTL 60 em apex e `www` (spec D3)

### 3.1 A janela de volta

```bash
echo | openssl s_client -connect 185.146.167.195:443 -servername lotusotec.cl 2>/dev/null \
  | openssl x509 -noout -enddate
curl -sI --resolve lotusotec.cl:443:185.146.167.195 https://lotusotec.cl/ | head -1
```

Às 2026-10-05T10:19:06Z:

```text
notAfter=Nov 10 20:37:55 2026 GMT
HTTP/2 200
```

36 dias à frente; há para onde voltar. Antes de editar, `pnpm infra:conferir-zona --pos-delegacao`
contra a zona viva: saída 0, 19 linhas `sim`, nenhuma `NÃO`.

### 3.2 Antes: aquecimento com o TTL de 3600

```bash
AWS_PROFILE=lotus node scripts/infra/medir-propagacao.mjs --nome lotusotec.cl --esperado wordpress --aquecer
AWS_PROFILE=lotus node scripts/infra/medir-propagacao.mjs --nome www.lotusotec.cl --esperado wordpress --aquecer
```

Nome `lotusotec.cl`, esperado `wordpress`, aquecimento iniciada em 2026-10-05T10:20:47.481Z

| resolvedor                      | início: A / AAAA (TTL)                           | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | ------------------------------------------------ | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 3502/3600) | —            | —                      | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |

Nome `www.lotusotec.cl`, esperado `wordpress`, aquecimento iniciada em 2026-10-05T10:20:48.749Z

| resolvedor                      | início: A / AAAA (TTL)                           | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | ------------------------------------------------ | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |

### 3.3 Change set do `lotus-dns`

- Data: 2026-10-05.
- Executou: João.
- Change set: `arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791195680/efe64cb0-01ec-4038-864c-26bb7f6df9a9`
  (stack `lotus-dns`, `us-east-1`). Parâmetros: `TtlDoCorte=60`, `TtlPadrao=3600`.

```text
|  Acao  |   Recurso   | Substituicao   |
|  Modify|  Registros  |  False         |
```

```text
lotusotec.cl. A
  antes:  {"Type":"A","ResourceRecords":["185.146.167.195"],"TTL":"3600","Name":"lotusotec.cl."}
  depois: {"Type":"A","ResourceRecords":["185.146.167.195"],"TTL":"60","Name":"lotusotec.cl."}
lotusotec.cl. AAAA
  antes:  {"Type":"AAAA","ResourceRecords":["2a07:7800::195"],"TTL":"3600","Name":"lotusotec.cl."}
  depois: {"Type":"AAAA","ResourceRecords":["2a07:7800::195"],"TTL":"60","Name":"lotusotec.cl."}
www.lotusotec.cl. A
  antes:  {"Type":"A","ResourceRecords":["185.146.167.195"],"TTL":"3600","Name":"www.lotusotec.cl."}
  depois: {"Type":"A","ResourceRecords":["185.146.167.195"],"TTL":"60","Name":"www.lotusotec.cl."}
www.lotusotec.cl. AAAA
  antes:  {"Type":"AAAA","ResourceRecords":["2a07:7800::195"],"TTL":"3600","Name":"www.lotusotec.cl."}
  depois: {"Type":"AAAA","ResourceRecords":["2a07:7800::195"],"TTL":"60","Name":"www.lotusotec.cl."}
```

- `execute-change-set`: 2026-10-05T10:37:25Z (início do `UPDATE_IN_PROGRESS` da stack).
- `UPDATE_COMPLETE` da stack (evento): 2026-10-05T10:38:30Z.
- **T0: 2026-10-05T10:38:30Z. O corte não antes de 2026-10-05T11:38:30Z.**

### 3.4 Depois: o TTL novo nos nameservers

Os mesmos dois comandos, logo depois de T0:

Nome `lotusotec.cl`, esperado `wordpress`, aquecimento iniciada em 2026-10-05T10:38:51.153Z

| resolvedor                      | início: A / AAAA (TTL)                         | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | ---------------------------------------------- | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 60/60)   | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 60/60)   | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 60/60)   | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60)   | —            | —                      | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 60/60)   | —            | —                      | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 60/60)   | —            | —                      | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 2516/60) | —            | —                      | —                 |

Nome `www.lotusotec.cl`, esperado `wordpress`, aquecimento iniciada em 2026-10-05T10:38:52.450Z

| resolvedor                      | início: A / AAAA (TTL)                         | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | ---------------------------------------------- | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 60/60)   | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 60/60)   | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 60/60)   | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60)   | —            | —                      | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 2304/60) | —            | —                      | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 60/60)   | —            | —                      | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 2519/60) | —            | —                      | —                 |

Os quatro `route53` respondem com TTL 60/60 e o WordPress. Dos públicos, a cópia antiga com TTL de
3600 resta no `A` do apex no Quad9 (2516 s) e no `A` do `www` no Google (2304 s) e no Quad9
(2519 s); todas vencem antes de T0 + 3600 s.

## 4. `X-Robots-Tag` fora da borda e smoke forçado (spec D5 e D9)

### 4.1 Change set do `lotus-site`

- Data: 2026-10-05.
- Executou: Claude, com autorização explícita de João dada neste passo ("Autorizado, pode rodar",
  em resposta ao portão do Step 6).
- Change set: `arn:aws:cloudformation:sa-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791196886/a6336aea-7b86-423f-8525-cb5cf2621bbb`
  (stack `lotus-site`, `sa-east-1`).

```text
|  Acao  |        Recurso         | Substituicao   |
|  Modify|  PoliticaDeCabecalhos  |  False         |
```

```text
PoliticaDeCabecalhos /Properties/ResponseHeadersPolicyConfig/Comment: "Cabecalhos de seguranca de 7.2.2 e X-Robots-Tag ate 7.2.5. Valores canonicos em scripts/infra/lib/cabecalhos.mjs." -> "Cabecalhos de seguranca de 7.2.2. Valores canonicos em scripts/infra/lib/cabecalhos.mjs."
PoliticaDeCabecalhos /Properties/ResponseHeadersPolicyConfig/CustomHeadersConfig/Items/1/Header: "X-Robots-Tag" -> —
PoliticaDeCabecalhos /Properties/ResponseHeadersPolicyConfig/CustomHeadersConfig/Items/1/Value: "noindex, nofollow" -> —
PoliticaDeCabecalhos /Properties/ResponseHeadersPolicyConfig/CustomHeadersConfig/Items/1/Override: "true" -> —
```

- `execute-change-set`: 2026-10-05T10:48:53Z.
- `UPDATE_COMPLETE` da stack (evento): 2026-10-05T10:49:06Z.
- `Deployed` da distribuição: visto às 2026-10-05T10:49:34Z.
- A partir daqui o domínio do CloudFront e os `/releases/<sha>/` ficam indexáveis (custo aceito em
  D5).

### 4.2 Smoke forçado, com o SHA nomeado

SHA no ar: `ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb`, o último CI verde da `main`
(`gh run list --repo Gatika-CL/lotus-site --workflow CI --branch main --status success --limit 1`,
`updatedAt` 2026-09-28T01:10:23Z).

```bash
SMOKE_URL=https://lotusotec.cl SMOKE_VIA=dhpoztt69jydz.cloudfront.net \
  SMOKE_SHA=ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb pnpm smoke
```

```text
[smoke] SHA no ar: ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb (index.html d3836b522c218bca68d2f7c533189200596a54f109769fb733e0dc4f227fe3cd)
  ✓   1 › 1 · artefato: index.html servido ≡ releases/ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb/index.html
[smoke] lotusotec.cl: TLSv1.3, Amazon, válido até 2027-04-11T23:59:59.000Z
  ✓   2 › 2 · TLS de lotusotec.cl: certificado da Amazon com os dois nomes, ≥ 30 dias, TLS ≥ 1.2
[smoke] www.lotusotec.cl: TLSv1.3, Amazon, válido até 2027-04-11T23:59:59.000Z
  ✓   3 › 2 · TLS de www.lotusotec.cl: certificado da Amazon com os dois nomes, ≥ 30 dias, TLS ≥ 1.2
[smoke] http://lotusotec.cl/ → 301 https://lotusotec.cl/
[smoke] https://www.lotusotec.cl/cursos/?a=1&a=2&b=x%26y → 301 https://lotusotec.cl/cursos/?b=x%26y&a=1&a=2
[smoke] http://www.lotusotec.cl/x?y=1 → 301 https://www.lotusotec.cl/x?y=1
[smoke] https://www.lotusotec.cl/x?y=1 → 301 https://lotusotec.cl/x?y=1
  ✓   4 › 3 · redirects: http → https, www → apex com caminho e query; cadeia registrada
  ✓   5 › 4 · home: 200, H1, âncoras do menu, console limpo, nenhuma resposta ≥ 400 do site
[smoke] 16 assets immutable (HTML 7, CSS 5, JS 6); 3 de nome fixo no-cache
  ✓   6 › 5 · assets: todo asset referenciado 200 e immutable; nome fixo no-cache; fontes carregam
  ✓   7 › 6 · formulário: Turnstile carrega; /api/contacto recusa GET, corpo vazio, token ausente e token falso
  ✓   8 › 7 · SEO técnico: title, description, canonical, og:*, JSON-LD, robots, sitemap, X-Robots-Tag
  ✓   9 › 8 · cabeçalhos: a política de B3 em /, asset, /api/contacto e 404
  ✓  10 › 9 · 404: caminho inexistente devolve 404

  10 passed (12.0s)
```

O item 7 roda com `X_ROBOTS_TAG_PRESENTE = false` e confere o cabeçalho ausente. Conferência
direta, pela borda: `curl -sI --connect-to lotusotec.cl:443:dhpoztt69jydz.cloudfront.net:443
https://lotusotec.cl/` devolve zero linhas `x-robots-tag`.

**Início do congelamento: 2026-10-05T10:50:07Z.** Até o smoke pós-corte da Task 8, nenhum deploy no
corporativo (D9). Se o corte não acontecer até 2026-10-06T10:48:53Z (24 h depois do
`execute-change-set`), o cabeçalho volta (D5, adendo 2).

## 5. Pré-checagens e o corte (spec §5, passos 5 e 6)

### 5.1 Pré-checagens, a partir do "corte não antes de"

Às 2026-10-05T11:38:57Z (o corte não antes de 11:38:30Z):

```text
notAfter=Nov 10 20:37:55 2026 GMT
HTTP/2 200
```

A janela de `rollback-corte.md` §0 vale: 36 dias e o WordPress respondendo.

Aquecimento com o TTL novo, às 11:39:

Nome `lotusotec.cl`, esperado `wordpress`, aquecimento iniciada em 2026-10-05T11:39:40.876Z

| resolvedor                      | início: A / AAAA (TTL)                       | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | -------------------------------------------- | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |

Nome `www.lotusotec.cl`, esperado `wordpress`, aquecimento iniciada em 2026-10-05T11:39:42.075Z

| resolvedor                      | início: A / AAAA (TTL)                       | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | -------------------------------------------- | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |

TTL 60/60 nos quatro `route53` e nos três públicos, apex e `www`.

`pnpm infra:conferir-zona --pos-delegacao` contra o template do commit anterior (os três arquivos
editados guardados em `git stash` durante a leitura): saída 0, 19 linhas `sim`, nenhuma `NÃO`.

Último run do CI corporativo na `main`:

```json
[
  {
    "conclusion": "failure",
    "createdAt": "2026-10-05T01:34:10Z",
    "headSha": "8774aa7e1015d60d3c9329d44378a77cd0533025"
  }
]
```

**Divergência.** O plano espera que o último run seja o SHA no ar. É `8774aa7`, espelho de
`b41e0da` (merge do PR #25), criado antes do início do congelamento (10:50:07Z), com o job `check`
reprovado em "Gates de qualidade" e o `deploy` pulado; o ar segue `ca8f49b`, o último verde, provado
pelo smoke forçado de §4.2. O risco que a checagem guarda, deploy durante o congelamento, não
aconteceu. A divergência foi ao `blocker` do portão do corte como decisão de João, e o corte só seguiu
com a autorização dele dada nesse portão. Às 14:13, nenhum run novo.

### 5.2 Change set do `lotus-dns`

- Data: 2026-10-05.
- Executou: Claude, com autorização explícita de João dada neste passo ("pode rodar para mim", em
  resposta ao portão do Step 9, que trazia a divergência de §5.1).
- Change set: `arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791200409/455a3aef-4264-455f-a643-032bce13a831`
  (stack `lotus-dns`, `us-east-1`). Parâmetros: `DominioDaDistribuicao=dhpoztt69jydz.cloudfront.net`,
  `TtlPadrao=3600`; saem `IpDoWordPress`, `Ipv6DoWordPress` e `TtlDoCorte`.

```text
|  Acao  |   Recurso   | Substituicao   |
|  Modify|  Registros  |  False         |
```

Diff por `Name` e `Type` (19 registros dos dois lados; os outros 15 iguais):

```text
lotusotec.cl. A
  antes:  {"Type":"A","ResourceRecords":["185.146.167.195"],"TTL":"60","Name":"lotusotec.cl."}
  depois: {"AliasTarget":{"HostedZoneId":"Z2FDTNDATAQYW2","DNSName":"dhpoztt69jydz.cloudfront.net","EvaluateTargetHealth":"false"},"Type":"A","Name":"lotusotec.cl."}
lotusotec.cl. AAAA
  antes:  {"Type":"AAAA","ResourceRecords":["2a07:7800::195"],"TTL":"60","Name":"lotusotec.cl."}
  depois: {"AliasTarget":{"HostedZoneId":"Z2FDTNDATAQYW2","DNSName":"dhpoztt69jydz.cloudfront.net","EvaluateTargetHealth":"false"},"Type":"AAAA","Name":"lotusotec.cl."}
www.lotusotec.cl. A
  antes:  {"Type":"A","ResourceRecords":["185.146.167.195"],"TTL":"60","Name":"www.lotusotec.cl."}
  depois: {"AliasTarget":{"HostedZoneId":"Z2FDTNDATAQYW2","DNSName":"dhpoztt69jydz.cloudfront.net","EvaluateTargetHealth":"false"},"Type":"A","Name":"www.lotusotec.cl."}
www.lotusotec.cl. AAAA
  antes:  {"Type":"AAAA","ResourceRecords":["2a07:7800::195"],"TTL":"60","Name":"www.lotusotec.cl."}
  depois: {"AliasTarget":{"HostedZoneId":"Z2FDTNDATAQYW2","DNSName":"dhpoztt69jydz.cloudfront.net","EvaluateTargetHealth":"false"},"Type":"AAAA","Name":"www.lotusotec.cl."}
```

- Aquecimento logo antes do `execute`: 2026-10-05T14:12:21Z (apex) e 14:12:23Z (`www`).
- `execute-change-set`: 2026-10-05T14:12:23Z.
- Início das medições: 2026-10-05T14:12:26Z.
- `UPDATE_COMPLETE` da stack (evento): 2026-10-05T14:13:31Z.

### 5.3 Aquecimento antes do `execute`

Nome `lotusotec.cl`, esperado `wordpress`, aquecimento iniciada em 2026-10-05T14:12:21.526Z

| resolvedor                      | início: A / AAAA (TTL)                       | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | -------------------------------------------- | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |

Nome `www.lotusotec.cl`, esperado `wordpress`, aquecimento iniciada em 2026-10-05T14:12:23.443Z

| resolvedor                      | início: A / AAAA (TTL)                       | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | -------------------------------------------- | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | —            | —                      | —                 |

### 5.4 Propagação

`medir-propagacao.mjs --esperado cloudfront --limite 1800`, as duas com saída 0. O `convergiu em`
conta do início da medição (14:12:26Z), três segundos depois do `execute`.

Nome `lotusotec.cl`, esperado `cloudfront`, medição iniciada em 2026-10-05T14:12:26.341Z

| resolvedor                      | início: A / AAAA (TTL)                       | convergiu em | depois: A / AAAA (TTL)                                                                                                                                                                                                                                                                                                                                                                | erros de consulta |
| ------------------------------- | -------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | 11 s         | 13.227.110.41 13.227.110.33 13.227.110.10 13.227.110.69 / 2600:9000:21ed:c00:13:9e71:75c0:93a1 2600:9000:21ed:1200:13:9e71:75c0:93a1 2600:9000:21ed:a00:13:9e71:75c0:93a1 2600:9000:21ed:400:13:9e71:75c0:93a1 2600:9000:21ed:5e00:13:9e71:75c0:93a1 2600:9000:21ed:6a00:13:9e71:75c0:93a1 2600:9000:21ed:8a00:13:9e71:75c0:93a1 2600:9000:21ed:8600:13:9e71:75c0:93a1 (TTL 60/60)    | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | 15 s         | 13.227.110.33 13.227.110.69 13.227.110.41 13.227.110.10 / 2600:9000:21ed:5000:13:9e71:75c0:93a1 2600:9000:21ed:9e00:13:9e71:75c0:93a1 2600:9000:21ed:8000:13:9e71:75c0:93a1 2600:9000:21ed:e600:13:9e71:75c0:93a1 2600:9000:21ed:4c00:13:9e71:75c0:93a1 2600:9000:21ed:2c00:13:9e71:75c0:93a1 2600:9000:21ed:ee00:13:9e71:75c0:93a1 2600:9000:21ed:6800:13:9e71:75c0:93a1 (TTL 60/60) | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | 11 s         | 13.227.110.33 13.227.110.41 13.227.110.69 13.227.110.10 / 2600:9000:21ed:9400:13:9e71:75c0:93a1 2600:9000:21ed:c000:13:9e71:75c0:93a1 2600:9000:21ed:8e00:13:9e71:75c0:93a1 2600:9000:21ed:cc00:13:9e71:75c0:93a1 2600:9000:21ed:9200:13:9e71:75c0:93a1 2600:9000:21ed:c200:13:9e71:75c0:93a1 2600:9000:21ed:7800:13:9e71:75c0:93a1 2600:9000:21ed:ac00:13:9e71:75c0:93a1 (TTL 60/60) | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | 11 s         | 13.227.110.69 13.227.110.41 13.227.110.10 13.227.110.33 / 2600:9000:21ed:9200:13:9e71:75c0:93a1 2600:9000:21ed:9000:13:9e71:75c0:93a1 2600:9000:21ed:da00:13:9e71:75c0:93a1 2600:9000:21ed:ee00:13:9e71:75c0:93a1 2600:9000:21ed:a600:13:9e71:75c0:93a1 2600:9000:21ed:c600:13:9e71:75c0:93a1 2600:9000:21ed:1c00:13:9e71:75c0:93a1 2600:9000:21ed:3a00:13:9e71:75c0:93a1 (TTL 60/60) | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | 16 s         | 13.227.110.69 13.227.110.33 13.227.110.41 13.227.110.10 / 2600:9000:21ed:2200:13:9e71:75c0:93a1 2600:9000:21ed:be00:13:9e71:75c0:93a1 2600:9000:21ed:a200:13:9e71:75c0:93a1 2600:9000:21ed:6400:13:9e71:75c0:93a1 2600:9000:21ed:3e00:13:9e71:75c0:93a1 2600:9000:21ed:cc00:13:9e71:75c0:93a1 2600:9000:21ed:3400:13:9e71:75c0:93a1 2600:9000:21ed:e400:13:9e71:75c0:93a1 (TTL 60/60) | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 60/56) | 64 s         | 13.227.110.69 13.227.110.10 13.227.110.33 13.227.110.41 / 2600:9000:21ed:4600:13:9e71:75c0:93a1 2600:9000:21ed:8600:13:9e71:75c0:93a1 2600:9000:21ed:5400:13:9e71:75c0:93a1 2600:9000:21ed:3a00:13:9e71:75c0:93a1 2600:9000:21ed:4200:13:9e71:75c0:93a1 2600:9000:21ed:3800:13:9e71:75c0:93a1 2600:9000:21ed:5200:13:9e71:75c0:93a1 2600:9000:21ed:a000:13:9e71:75c0:93a1 (TTL 60/55) | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 60/56) | 59 s         | 13.227.110.33 13.227.110.69 13.227.110.10 13.227.110.41 / 2600:9000:21ed:b000:13:9e71:75c0:93a1 2600:9000:21ed:3a00:13:9e71:75c0:93a1 2600:9000:21ed:7800:13:9e71:75c0:93a1 2600:9000:21ed:1c00:13:9e71:75c0:93a1 2600:9000:21ed:6600:13:9e71:75c0:93a1 2600:9000:21ed:da00:13:9e71:75c0:93a1 2600:9000:21ed:2600:13:9e71:75c0:93a1 2600:9000:21ed:9200:13:9e71:75c0:93a1 (TTL 60/60) | —                 |

Nome `www.lotusotec.cl`, esperado `cloudfront`, medição iniciada em 2026-10-05T14:12:26.342Z

| resolvedor                      | início: A / AAAA (TTL)                       | convergiu em | depois: A / AAAA (TTL)                                                                                                                                                                                                                                                                                                                                                                | erros de consulta |
| ------------------------------- | -------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | 11 s         | 13.227.110.41 13.227.110.33 13.227.110.10 13.227.110.69 / 2600:9000:21ed:e600:13:9e71:75c0:93a1 2600:9000:21ed:c400:13:9e71:75c0:93a1 2600:9000:21ed:8400:13:9e71:75c0:93a1 2600:9000:21ed:fc00:13:9e71:75c0:93a1 2600:9000:21ed:c200:13:9e71:75c0:93a1 2600:9000:21ed:6000:13:9e71:75c0:93a1 2600:9000:21ed:8a00:13:9e71:75c0:93a1 2600:9000:21ed:800:13:9e71:75c0:93a1 (TTL 60/60)  | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | 15 s         | 13.227.110.33 13.227.110.10 13.227.110.41 13.227.110.69 / 2600:9000:21ed:e600:13:9e71:75c0:93a1 2600:9000:21ed:8a00:13:9e71:75c0:93a1 2600:9000:21ed:ae00:13:9e71:75c0:93a1 2600:9000:21ed:c800:13:9e71:75c0:93a1 2600:9000:21ed:2400:13:9e71:75c0:93a1 2600:9000:21ed:2a00:13:9e71:75c0:93a1 2600:9000:21ed:dc00:13:9e71:75c0:93a1 2600:9000:21ed:9600:13:9e71:75c0:93a1 (TTL 60/60) | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | 15 s         | 13.227.110.10 13.227.110.41 13.227.110.69 13.227.110.33 / 2600:9000:21ed:ee00:13:9e71:75c0:93a1 2600:9000:21ed:bc00:13:9e71:75c0:93a1 2600:9000:21ed:8a00:13:9e71:75c0:93a1 2600:9000:21ed:5e00:13:9e71:75c0:93a1 2600:9000:21ed:c200:13:9e71:75c0:93a1 2600:9000:21ed:1400:13:9e71:75c0:93a1 2600:9000:21ed:cc00:13:9e71:75c0:93a1 2600:9000:21ed:d000:13:9e71:75c0:93a1 (TTL 60/60) | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | 11 s         | 13.227.110.41 13.227.110.69 13.227.110.10 13.227.110.33 / 2600:9000:21ed:fe00:13:9e71:75c0:93a1 2600:9000:21ed:e200:13:9e71:75c0:93a1 2600:9000:21ed:1200:13:9e71:75c0:93a1 2600:9000:21ed:fa00:13:9e71:75c0:93a1 2600:9000:21ed:c000:13:9e71:75c0:93a1 2600:9000:21ed:800:13:9e71:75c0:93a1 2600:9000:21ed:f800:13:9e71:75c0:93a1 2600:9000:21ed:ec00:13:9e71:75c0:93a1 (TTL 59/60)  | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | 22 s         | 13.227.110.33 13.227.110.10 13.227.110.69 13.227.110.41 / 2600:9000:21ed:7400:13:9e71:75c0:93a1 2600:9000:21ed:c400:13:9e71:75c0:93a1 2600:9000:21ed:2c00:13:9e71:75c0:93a1 2600:9000:21ed:9800:13:9e71:75c0:93a1 2600:9000:21ed:2800:13:9e71:75c0:93a1 2600:9000:21ed:2400:13:9e71:75c0:93a1 2600:9000:21ed:200:13:9e71:75c0:93a1 2600:9000:21ed:c600:13:9e71:75c0:93a1 (TTL 60/60)  | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 60/60) | 21 s         | 13.227.110.10 13.227.110.69 13.227.110.41 13.227.110.33 / 2600:9000:20bb:1400:13:9e71:75c0:93a1 2600:9000:20bb:8000:13:9e71:75c0:93a1 2600:9000:20bb:c400:13:9e71:75c0:93a1 2600:9000:20bb:5e00:13:9e71:75c0:93a1 2600:9000:20bb:ea00:13:9e71:75c0:93a1 2600:9000:20bb:f000:13:9e71:75c0:93a1 2600:9000:20bb:4c00:13:9e71:75c0:93a1 2600:9000:20bb:5000:13:9e71:75c0:93a1 (TTL 60/60) | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 57/60) | 64 s         | 13.227.110.41 13.227.110.69 13.227.110.33 13.227.110.10 / 2600:9000:21ed:1600:13:9e71:75c0:93a1 2600:9000:21ed:8a00:13:9e71:75c0:93a1 2600:9000:21ed:e00:13:9e71:75c0:93a1 2600:9000:21ed:c000:13:9e71:75c0:93a1 2600:9000:21ed:3a00:13:9e71:75c0:93a1 2600:9000:21ed:f600:13:9e71:75c0:93a1 2600:9000:21ed:1a00:13:9e71:75c0:93a1 2600:9000:21ed:aa00:13:9e71:75c0:93a1 (TTL 18/60)  | —                 |

Os quatro `route53` passaram à borda em 11 a 15 s, com TTL ≤ 60; os públicos saíram do WordPress, com
TTL ≤ 60, e chegaram à borda em 16 a 64 s. Às 14:13:37Z, 71 s depois do `execute`, os sete
resolvedores respondiam a distribuição nos dois nomes.

## 6. Depois do corte (spec §5, passo 7)

### 6.1 Smoke pós-corte, pela resolução pública

Às 2026-10-05T14:14:48Z, 60 s depois de as duas medições de §5.4 convergirem, sem `SMOKE_VIA`:

```bash
SMOKE_URL=https://lotusotec.cl SMOKE_SHA=ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb pnpm smoke
```

```text
[smoke] SHA no ar: ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb (index.html d3836b522c218bca68d2f7c533189200596a54f109769fb733e0dc4f227fe3cd)
  ✓   1 › 1 · artefato: index.html servido ≡ releases/ca8f49bcd3ae1e94b7769de741b26b9daef8cdeb/index.html
[smoke] lotusotec.cl: TLSv1.3, Amazon, válido até 2027-04-11T23:59:59.000Z
  ✓   2 › 2 · TLS de lotusotec.cl: certificado da Amazon com os dois nomes, ≥ 30 dias, TLS ≥ 1.2
[smoke] www.lotusotec.cl: TLSv1.3, Amazon, válido até 2027-04-11T23:59:59.000Z
  ✓   3 › 2 · TLS de www.lotusotec.cl: certificado da Amazon com os dois nomes, ≥ 30 dias, TLS ≥ 1.2
[smoke] http://lotusotec.cl/ → 301 https://lotusotec.cl/
[smoke] https://www.lotusotec.cl/cursos/?a=1&a=2&b=x%26y → 301 https://lotusotec.cl/cursos/?b=x%26y&a=1&a=2
[smoke] http://www.lotusotec.cl/x?y=1 → 301 https://www.lotusotec.cl/x?y=1
[smoke] https://www.lotusotec.cl/x?y=1 → 301 https://lotusotec.cl/x?y=1
  ✓   4 › 3 · redirects: http → https, www → apex com caminho e query; cadeia registrada
  ✓   5 › 4 · home: 200, H1, âncoras do menu, console limpo, nenhuma resposta ≥ 400 do site
[smoke] 16 assets immutable (HTML 7, CSS 5, JS 6); 3 de nome fixo no-cache
[smoke] importados pelo JS: /assets/LOTUS_TRANSP_Fondo-Negro-REC2-boV8wriy.png, /assets/shutterstock_1444636373-1-scaled-Bm9ZLwYf.jpg, /assets/home-office-12-C_nJ1MKt.jpg, /assets/LLVV_00-v1-BN2-BOwYFW68.jpeg, /assets/LLVV_Mantas02-BN2-DB-pMcHr.jpeg, /assets/LOTUS-G2_TRANSP_Fondo-Blanco-B3GzsLLb.png
  ✓   6 › 5 · assets: todo asset referenciado 200 e immutable; nome fixo no-cache; fontes carregam
  ✓   7 › 6 · formulário: Turnstile carrega; /api/contacto recusa GET, corpo vazio, token ausente e token falso
  ✓   8 › 7 · SEO técnico: title, description, canonical, og:*, JSON-LD, robots, sitemap, X-Robots-Tag
  ✓   9 › 8 · cabeçalhos: a política de B3 em /, asset, /api/contacto e 404
  ✓  10 › 9 · 404: caminho inexistente devolve 404
  10 passed
```

O mesmo SHA de §4.2; o item 7 com o `X-Robots-Tag` ausente. Nenhum vermelho nos itens 2 a 6: o
gatilho de rollback de `rollback-corte.md` §2 não disparou.

### 6.2 O resto da zona intacto

`pnpm infra:conferir-zona --pos-delegacao --saida docs/infra/conferencia-zona-2026-10-05.md`: saída
0, 19 linhas `sim`, nenhuma `NÃO`. Apex e `www`, `A` e `AAAA`, com `sim — alias: o IP da borda varia
por resolvedor; a linha confere que ele responde e não é o WordPress`; MX, SPF, DKIM, DMARC, SES,
`app` e os CNAME `sim`; os nomes inventados sem resposta dos dois lados. O relatório completo está
em `docs/infra/conferencia-zona-2026-10-05.md`.

### 6.3 Latência pública, com as sondas da linha de base

```bash
node scripts/infra/medir-latencia.mjs --alvo lotusotec.cl --sondas 2gCnAzOrC1AsubQxh00021G5S
```

Medição `2HgotqDwMinYcrZbK00021GG0` de `lotusotec.cl`, criada em 2026-10-05T14:16:04.090Z; sondas: as mesmas da medição `2gCnAzOrC1AsubQxh00021G5S`.

| #   | sonda        | rede                                | status   | IP resolvido   | HTTP | x-amz-cf-pop | x-cache                    | dns | tcp | tls | firstByte | total |
| --- | ------------ | ----------------------------------- | -------- | -------------- | ---- | ------------ | -------------------------- | --- | --- | --- | --------- | ----- |
| 1   | Santiago     | AS20473 The Constant Company        | finished | 13.227.123.105 | 200  | SCL51-P6     | Hit from cloudfront        | 97  | 1   | 10  | 274       | 383   |
| 2   | Vina del Mar | AS31898 Oracle                      | finished | 13.227.123.105 | 200  | SCL51-P6     | Hit from cloudfront        | 56  | 4   | 13  | 309       | 383   |
| 3   | Santiago     | AS61138 Zappie Host                 | finished | 13.227.123.119 | 200  | SCL51-P6     | Hit from cloudfront        | 59  | 5   | 17  | 294       | 377   |
| 4   | Santiago     | AS136907 HUAWEI CLOUDS              | finished | 65.8.207.78    | 200  | EZE50-P6     | Hit from cloudfront        | 58  | 23  | 35  | 213       | 331   |
| 5   | Santiago     | AS31898 Oracle                      | finished | 65.8.207.29    | 200  | EZE50-P6     | Miss from cloudfront       | 53  | 24  | 35  | 221       | 336   |
| 6   | Santiago     | AS270013 J AND J SPA (INFOFRACTAL)  | finished | 3.167.246.28   | 200  | DFW59-P1     | Miss from cloudfront       | 123 | 127 | 140 | 633       | 1025  |
| 7   | Curico       | AS52368 ZAM                         | finished | 3.167.246.61   | 200  | DFW59-P1     | Hit from cloudfront        | 134 | 159 | 177 | 591       | 1066  |
| 8   | Vina del Mar | AS28099 iHosting Servicios Internet | finished | 54.230.124.29  | 200  | LIM50-P4     | RefreshHit from cloudfront | 64  | 40  | 52  | 900       | 1062  |
| 9   | Santiago     | AS396982 Google                     | finished | 65.8.207.49    | 200  | EZE50-P6     | Hit from cloudfront        | 61  | 21  | 33  | 213       | 330   |
| 10  | Santiago     | AS266713 WMAX                       | finished | 13.227.123.105 | 200  | SCL51-P6     | Miss from cloudfront       | 62  | 1   | 12  | 307       | 384   |

10 de 10 sondas terminaram. `firstByte`: mediana 301 ms (213–900); `total`: mediana 383 ms (330–1066).

HTTP 200 e `x-amz-cf-pop` em toda sonda (spec §7, item 2). Contra a linha de base de §1.1, mesmas
sondas: `total` 74 ms de mediana no WordPress, 383 ms em `lotusotec.cl` pela borda; `firstByte` 5
contra 301 ms. **A condição de `D-65` vale** (mediana de `total` acima da do WordPress); ele nasce
na Task 9. As sondas 6 e 7 resolveram IPs de `DFW59` e a 8 caiu em `LIM50`, acima de 1 s; as outras
sete, em `SCL51` e `EZE50`, entre 330 e 384 ms.

### 6.4 O certificado em uso e renovável

```json
{
  "Estado": "ISSUED",
  "Renovacao": "ELIGIBLE",
  "EmUso": ["arn:aws:cloudfront::760144413534:distribution/E1R7SPH4OLUIEQ"],
  "Ate": "2027-04-11T20:59:59-03:00"
}
```

`ISSUED`, `ELIGIBLE`, em uso pela distribuição `E1R7SPH4OLUIEQ`, até 2027-04-11T23:59:59Z (`D-47`,
spec §7, item 8).

### 6.5 Envio real pelo formulário

João, num navegador comum, sem `hosts` nem resolução forçada:

- cadeado de `https://lotusotec.cl/`: certificado com CN `lotusotec.cl`, emitido por `Amazon RSA
2048 M01` (Amazon), válido de 2026-09-25 a 2027-04-11, SHA-256
  `840f347bca405b65ad71cb43562a8b852c8545363017da3ac04090283c2c3d95`;
- formulário enviado; a chegada em `contacto@lotusotec.cl` foi confirmada pelo cliente, segundo João.

Recebida em `contacto@lotusotec.cl` às 11:24 (UTC−3; 2026-10-05T14:24Z), remetente "Sitio Lotus
OTEC", assunto "Nuevo mensaje desde el sitio de Lotus OTEC", mensagem `corte 7.2.5 2026-10-05`,
rodapé "Enviado desde el formulario de contacto de lotusotec.cl" — captura de tela da caixa de
entrada, mostrada por João (spec §7, item 4). A linha `"desfecho":"enviado"` do log da função não
foi lida: o `aws logs tail` foi recusado pela política de permissão do agente, por trazer dados
pessoais do formulário. A chegada da mensagem prova o caminho inteiro (Turnstile, função, SES,
Workspace), que a linha do log provaria só até o SES.

### 6.6 Validadores (D10)

- **Rich Results Test** (`https://search.google.com/test/rich-results/result?id=ZUgVVcJTSpe3cJ0b93e3bg`,
  2026-10-05 11:30:23 no horário da página): 1 item válido, `Organization`; página elegível; rastreio
  pelo Google Inspection Tool smartphone com 200 e indexação permitida. Nenhum erro de dados
  estruturados. Um recurso de 13 não carregou: `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`,
  marcado como erro de redirecionamento — o script do Turnstile, de terceiro, não o JSON-LD.
- **Schema Markup Validator**: `Organization`, 0 erros, 0 avisos; `name` `LOTUS OTEC`, `url`
  `https://lotusotec.cl/`, `logo` `https://lotusotec.cl/LOTUS-G2_TRANSP_Fondo-Blanco.png`, `email`
  `contacto@lotusotec.cl`.
- **Sharing Debugger do Facebook**: `og:url` `https://lotusotec.cl/`, `og:type` `website`,
  `og:title` `LOTUS | OTEC`, `og:description` "Somos especialistas en entrenamiento en servicios de
  Alta y Media Tensión para líneas de transmisión y subestaciones.", `og:image`
  `https://lotusotec.cl/LOTUS-G2_TRANSP_Fondo-Blanco.png`; os `twitter:*` lidos com os mesmos
  valores; `og:image:alt` vazio. Nenhum erro.
- **Post Inspector do LinkedIn**: URL buscada e canônica `https://lotusotec.cl/`, cadeia de
  redirecionamento de um passo (`206 Success`); `Title` `LOTUS | OTEC`, `Type` `Article`, `Image`
  servida da cópia do LinkedIn (`media.licdn.com`), `Description` igual à do `og:description`;
  "No author found" e "No publication date found", campos de artigo que a página institucional não
  declara. Nenhum erro.

Nenhum validador acusou erro: `D-22` fecha na Task 9.

### 6.7 Fim do congelamento

**2026-10-05T14:48:57Z.** O corporativo volta a poder fazer deploy: o smoke pós-corte de §6.1 passou
(D9). O último run do CI corporativo segue o `8774aa7` reprovado de §5.1; o próximo deploy verde
substitui `ca8f49b` no ar.

## 7. Estabilização (spec D11)

## Limites declarados (spec §7)

- O smoke roda em Chromium.
- As sondas do Globalping são quase todas de datacenter (D7): a medição não é a do visitante
  residencial.
- O X não tem validador público de card desde 2022; os `twitter:*` seguem provados por
  `src/app/head.test.ts` (D10).
- A cauda além dos 60 s, em resolvedores que impõem TTL mínimo próprio, é medida, não controlada.
- O recebimento da mensagem do formulário é declaração de João.
