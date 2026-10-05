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

## 4. `X-Robots-Tag` fora da borda e smoke forçado (spec D5 e D9)

## 5. Pré-checagens e o corte (spec §5, passos 5 e 6)

## 6. Depois do corte (spec §5, passo 7)

## 7. Estabilização (spec D11)

## Limites declarados (spec §7)

- O smoke roda em Chromium.
- As sondas do Globalping são quase todas de datacenter (D7): a medição não é a do visitante
  residencial.
- O X não tem validador público de card desde 2022; os `twitter:*` seguem provados por
  `src/app/head.test.ts` (D10).
- A cauda além dos 60 s, em resolvedores que impõem TTL mínimo próprio, é medida, não controlada.
- O recebimento da mensagem do formulário é declaração de João.
