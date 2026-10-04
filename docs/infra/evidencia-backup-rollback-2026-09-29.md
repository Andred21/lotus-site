# Evidência — backup, restauração exercitada e ensaio do rollback DNS (`7.2.3`)

Bloco `B4`, spec `docs/superpowers/specs/2026-09-28-7.2.3-7.2.4-backup-rollback-smoke-design.md`.
Datas e comandos abaixo são os executados; nada é digitado de memória.

## 1. Cópias e onde estão (spec D3)

| Cópia                                                 | SHA-256                                                            | Tamanho (B) | Gerada em  | WordPress | Onde está                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------ | ----------- | ---------- | --------- | ---------------------------------------------------------------------- |
| WPvivid `backup_all.zip` (segunda cópia)              | `9c4719b99d42292c2554287acc2c8c307cc7175b3b4847d15286638b4651c71a` | 199557444   | 2025-07-25 | 6.8.2     | Windows do João (pasta `V1/Backup Site Institucional`)                 |
| StackCP — arquivos do site (`stackcp-2026-10-03.zip`) | `3a426f3652a433e53b0c543a379f5a6f24ea1e94f87a3ec1f6164f945dcd09bf` | 332602708   | 2026-10-03 | 7.1.2     | Windows do João (pasta `V1/Backup Site Institucional`) e segunda mídia |
| StackCP — dump do banco (`stackcp-2026-10-03.sql.gz`) | `4c056622c1b2fa76af4a2080307eb455ac96f0bcaaf5835165da99fec03e3ca2` | 301150      | 2026-10-04 | 7.1.2     | Windows do João (pasta `V1/Backup Site Institucional`) e segunda mídia |

Segunda mídia, fora do Windows: pendrive Kingston de 16 GB, pasta `Lotus`, com os dois arquivos do
StackCP; cópia feita por João em 2026-10-04 e pendrive já ejetado. O agente não leu o pendrive: os
hashes acima são das cópias no Windows.

Conteúdo, medido nas cópias do Windows em 2026-10-04:

- **Arquivos.** "Descargar como ZIP" do gerenciador de arquivos do StackCP. Só `public_html/`:
  51.306 arquivos, 686.290.054 B descompactado, `unzip -t` sem erro. Tem `wp-config.php`,
  `.htaccess` e `.user.ini`; `wp-includes/version.php` diz `7.1.2`. O `.htaccess` e o `.rnd` da
  raiz da conta ficaram fora. O pacote leva também o Moodle que divide o host (`aulavirtual/`,
  `moodledata/`), com dado próprio — mesma guarda.
- **Banco.** Exportação do phpMyAdmin 5.2.3, estrutura e dados, gzip; servidor MariaDB
  10.11.18. Treze tabelas, todas com prefixo `30_`; collations `utf8mb3_general_ci` e
  `utf8mb4_unicode_520_ci`.

O bucket `lotus-site-prod` está vetado (spec D3): a distribuição serve qualquer chave dele.

## 2. Ensaio de restauração (spec §4.3)

Rodado em 2026-10-04, das 16:36:44Z às 16:37:47Z, no commit `3a45db6`, sobre os dois arquivos do
StackCP de §1 — `sha256sum` reconferido logo antes, igual ao da tabela.

```bash
source ~/.nvm/nvm.sh >/dev/null && nvm use >/dev/null
B='/mnt/c/Users/jvbat/Desktop/Projetos/Lotus.cl/V1/Backup Site Institucional'
ARQ="$B/stackcp-2026-10-03.zip"; DMP="$B/stackcp-2026-10-03.sql.gz"
LOG=<scratchpad do agente>/ensaio-restauracao-4.log
ENSAIO_DESATIVAR_MU_PLUGINS=wp-stack-cache scripts/wordpress/ensaio-restauracao.sh "$ARQ" "$DMP" 2>&1 \
  | tee "$LOG"; echo "saida: ${PIPESTATUS[0]}"
```

O log fica fora de `/tmp/ensaio-restauracao.*`, o padrão que a conferência de limpeza procura.
Saída inteira:

```text
== descompactando /mnt/c/Users/jvbat/Desktop/Projetos/Lotus.cl/V1/Backup Site Institucional/stackcp-2026-10-03.zip
== docroot: aulavirtual index.php license.txt moodle-latest-401 (1).zip moodledata readme.html wp-activate.php wp-admin wp-blog-header.php wp-comments-post.php wp-config-sample.php wp-config.php wp-content wp-cron.php wp-includes wp-links-opml.php wp-load.php wp-login.php wp-mail.php wp-settings.php wp-signup.php wp-trackback.php xmlrpc.php
== mu-plugin desativado na cópia: wp-stack-cache
wp-config ajustado: /tmp/ensaio-restauracao.qst6LI/docroot/wp-config.php
== subindo containers
 Image lotus-ensaio-restauracao-web Building
#1 [internal] load local bake definitions
#1 reading from stdin 572B done
#1 DONE 0.0s

#2 [internal] load build definition from Dockerfile
#2 transferring dockerfile: 861B done
#2 DONE 0.0s

#3 [internal] load metadata for docker.io/library/php:7.4-apache
#3 DONE 1.5s

#4 [internal] load .dockerignore
#4 transferring context: 2B done
#4 DONE 0.0s

#5 [1/4] FROM docker.io/library/php:7.4-apache@sha256:c9d7e608f73832673479770d66aacc8100011ec751d1905ff63fae3fe2e0ca6d
#5 resolve docker.io/library/php:7.4-apache@sha256:c9d7e608f73832673479770d66aacc8100011ec751d1905ff63fae3fe2e0ca6d 0.0s done
#5 DONE 0.0s

#6 [internal] load build context
#6 transferring context: 33B done
#6 DONE 0.0s

#7 [2/4] RUN docker-php-ext-install mysqli   && a2enmod ssl rewrite headers   && openssl req -x509 -nodes -newkey rsa:2048 -days 30        -keyout /etc/ssl/private/ensaio.key        -out /etc/ssl/certs/ensaio.crt        -subj '/CN=lotusotec.cl'        -addext 'subjectAltName=DNS:lotusotec.cl,DNS:www.lotusotec.cl'
#7 CACHED

#8 [3/4] COPY ensaio.conf /etc/apache2/sites-available/ensaio.conf
#8 CACHED

#9 [4/4] RUN a2dissite 000-default && a2ensite ensaio
#9 CACHED

#10 exporting to image
#10 exporting layers done
#10 exporting manifest sha256:1f08d331d955ebb5ba43e70025e31d9e05bb661fa7971124297ea8ba85fd290d done
#10 exporting config sha256:3f6edec200e0c53fee1ae98486e951d4540ac88fa7375e8cf7cba1aef2be6c25 done
#10 exporting attestation manifest sha256:7f2d3b880f97f3c671bfb80899a4a78931c9a2942ad146f38d8bb69083361248
#10 exporting attestation manifest sha256:7f2d3b880f97f3c671bfb80899a4a78931c9a2942ad146f38d8bb69083361248 0.0s done
#10 exporting manifest list sha256:96cd2f3053c2ccf9110c329f1b509bf8df50fb1a78bec074ea696d25f9ce2fe7 0.0s done
#10 naming to docker.io/library/lotus-ensaio-restauracao-web:latest done
#10 unpacking to docker.io/library/lotus-ensaio-restauracao-web:latest 0.0s done
#10 DONE 0.1s

#11 resolving provenance for metadata file
#11 DONE 0.0s
 Image lotus-ensaio-restauracao-web Built
 Network lotus-ensaio-restauracao_default Creating
 Network lotus-ensaio-restauracao_default Creating
 Network lotus-ensaio-restauracao_default Created
 Network lotus-ensaio-restauracao_default Created
 Container lotus-ensaio-restauracao-db-1 Creating
 Container lotus-ensaio-restauracao-db-1 Created
 Container lotus-ensaio-restauracao-web-1 Creating
 Container lotus-ensaio-restauracao-web-1 Created
 Container lotus-ensaio-restauracao-db-1 Starting
 Container lotus-ensaio-restauracao-db-1 Started
 Container lotus-ensaio-restauracao-db-1 Waiting
 Container lotus-ensaio-restauracao-db-1 Healthy
 Container lotus-ensaio-restauracao-web-1 Starting
 Container lotus-ensaio-restauracao-web-1 Started
 Container lotus-ensaio-restauracao-db-1 Waiting
 Container lotus-ensaio-restauracao-web-1 Waiting
 Container lotus-ensaio-restauracao-web-1 Healthy
 Container lotus-ensaio-restauracao-db-1 Healthy
== importando /mnt/c/Users/jvbat/Desktop/Projetos/Lotus.cl/V1/Backup Site Institucional/stackcp-2026-10-03.sql.gz
== tabelas importadas: 13
== home pela cópia
https://lotusotec.cl/ -> 200
== comparando com o WordPress vivo
{
  "vivo": {
    "status": 200,
    "titulo": "LOTUS | OTEC",
    "h1": "LOTUS OTEC"
  },
  "copia": {
    "status": 200,
    "titulo": "LOTUS | OTEC",
    "h1": "LOTUS OTEC",
    "login": 200,
    "falhas": [
      {
        "status": 401,
        "metodo": "GET",
        "url": "https://lotusotec.cl/wp-json/wp/v2/users/me?context=edit&_locale=user"
      }
    ]
  },
  "vivoNaMesmaUrl": {
    "https://lotusotec.cl/wp-json/wp/v2/users/me?context=edit&_locale=user": 401
  },
  "problemas": []
}
== log do Apache/PHP
PHP Fatal error: 0
== ensaio passou
saida: 0
```

Os cinco critérios (§4.3, item 4, com a emenda E1 da spec):

- home restaurada 200 — **passou** (`https://lotusotec.cl/ -> 200`; `copia.status` 200);
- `<title>`, H1 e texto visível iguais aos do vivo — **passou** (`LOTUS | OTEC` e `LOTUS OTEC` dos
  dois lados; nenhuma diferença de texto em `problemas`);
- toda resposta de `lotusotec.cl` na cópia < 400, salvo a que o vivo repete — **passou**: uma
  falha, `401 GET …/wp-json/wp/v2/users/me?context=edit&_locale=user`, e o vivo responde `401` ao
  mesmo `GET` anônimo (`vivoNaMesmaUrl`);
- `wp-login.php` 200 — **passou** (`copia.login` 200);
- zero `PHP Fatal error` — **passou** (`PHP Fatal error: 0`).

Treze tabelas importadas, as treze de §1. Depois da rodada, `docker ps -a --filter name=lotus-ensaio`
vazio, nenhum volume do ensaio e nenhum `/tmp/ensaio-restauracao.*`.

Desvios, todos na cópia ou no verificador — nenhum no host:

- **Quatro rodadas.** As três primeiras reprovaram, cada uma antes da correção que a seguiu:
  1. o lado vivo estourou 30 s esperando `networkidle`: o `api-fetch` do WordPress chama
     `admin-ajax.php?action=rest-nonce`, o host responde 400 e não fecha o stream HTTP/2 no
     Chromium. `verificar-restauracao.mjs` passou a esperar `load` + 1 s (`eae787b`);
  2. a home da cópia parou no aviso de `require(/usr/share/php/wp-stack-cache.php)`: o backup traz
     o mu-plugin `wp-content/mu-plugins/wp-stack-cache.php`, que exige uma biblioteca que só existe
     no host. `ENSAIO_DESATIVAR_MU_PLUGINS` o desativa só na cópia (`f637a62`). Vale para qualquer
     restauração fora do StackCP;
  3. reprovou só pelo `401` de `users/me`, que o vivo dá igual a visitante anônimo. João decidiu a
     emenda E1 da spec (2026-10-04) e o verificador passou a repetir no vivo cada `GET` que falha
     na cópia (`3a45db6`).
- Nenhum plugin desativado e nenhuma troca de collation: o dump do MariaDB 10.11.18 entrou direto
  no MariaDB 10.6.

Limites: a restauração no host de produção não foi exercitada (spec D4). O Moodle que veio junto no
pacote não foi exercitado; o ensaio só olha o WordPress.

## 3. Ensaio do rollback DNS em `ensaio-corte.lotusotec.cl` (spec §4.4)

### 3.1 Estágio 1 — nasce no WordPress

- **Data e quem executou:** 2026-10-04, Claude, com a autorização explícita de João dada neste
  passo ("autorizo executar o change set do estágio 1 (fd567112)").
- **Template:** o `infra/lotus-dns.yaml` deste commit — base `d068959` mais os dois `RecordSet` de
  `ensaio-corte` (`A` `185.146.167.195`, `AAAA` `2a07:7800::195`, TTL `TtlPadrao` = 3600). O corpo
  que `get-template --change-set-name` devolve é igual ao arquivo, salvo três linhas de comentário
  em que os caracteres fora do ASCII voltaram como `?`.
- **Drift antes:** `IN_SYNC`, detecção de 2026-10-04T16:40:56Z.
- **Change set:**
  `arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1790897359/fd567112-6aa8-4c97-b388-612c3a206e6d`,
  criado em 2026-10-01T23:29:20Z; uma linha, `Modify` `Registros` `Substituicao: False`.
- **Execução:** `execute-change-set` às 16:41:52Z, logo depois do aquecimento; `Registros`
  `UPDATE_COMPLETE` às 16:42:57Z; stack `UPDATE_COMPLETE` às 16:42:59Z.

Aquecimento (antes), `medir-propagacao.mjs --nome ensaio-corte.lotusotec.cl --esperado ausente
--aquecer`, saída 0:

Nome `ensaio-corte.lotusotec.cl`, esperado `ausente`, aquecimento iniciada em 2026-10-04T16:41:52.809Z

| resolvedor                      | início: A / AAAA (TTL) | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | ---------------------- | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | — / — (TTL —/—)        | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | — / — (TTL —/—)        | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | — / — (TTL —/—)        | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | — / — (TTL —/—)        | —            | —                      | —                 |
| google 8.8.8.8                  | — / — (TTL —/—)        | —            | —                      | —                 |
| cloudflare 1.1.1.1              | — / — (TTL —/—)        | —            | —                      | —                 |
| quad9 9.9.9.9                   | — / — (TTL —/—)        | —            | —                      | —                 |

Medição (depois), `medir-propagacao.mjs --nome ensaio-corte.lotusotec.cl --esperado wordpress`,
saída 0:

Nome `ensaio-corte.lotusotec.cl`, esperado `wordpress`, medição iniciada em 2026-10-04T16:43:01.377Z

| resolvedor                      | início: A / AAAA (TTL)                           | convergiu em | depois: A / AAAA (TTL)                           | erros de consulta |
| ------------------------------- | ------------------------------------------------ | ------------ | ------------------------------------------------ | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |

Os quatro `route53` convergiram em `0 s`, como esperado. Os três públicos também: já davam o
WordPress, com o TTL 3600 cheio, na primeira consulta da medição — 69 s depois do aquecimento que
tinha recebido NXDOMAIN. O TTL negativo da zona não apareceu: o SOA tem TTL 900 e `minimum` 86400,
então o NXDOMAIN valeria 900 s. A medição não distingue entre a consulta ter caído em outro cache
do mesmo resolvedor (os três são anycast) e o resolvedor ter guardado o NXDOMAIN por menos de 69 s.
Nos dois casos, uma consulta de aquecimento não garante que a seguinte encontre o cache que ela
encheu: nos estágios seguintes, o tempo medido é um piso, e o teto é o TTL do registro antigo.

### 3.2 Estágio 2 — alias para a distribuição (propagação do corte)

- **Data e quem executou:** 2026-10-04, Claude, com a autorização explícita de João dada neste
  passo ("autorizo executar o change set do estágio 2 (5b7a58bc)").
- **Template:** o `infra/lotus-dns.yaml` deste commit — base `2f2ab46` mais o parâmetro
  `DominioDaDistribuicao` (Default `dhpoztt69jydz.cloudfront.net`, o output do stack `lotus-site`)
  e os dois `RecordSet` de `ensaio-corte` trocando `TTL` e `ResourceRecords` por `AliasTarget` da
  distribuição (hosted zone `Z2FDTNDATAQYW2`). O corpo que `get-template --change-set-name` devolve
  é igual ao arquivo, salvo as mesmas três linhas de comentário com `?`.
- **Drift antes:** `IN_SYNC`, detecção de 2026-10-04T17:15:01Z.
- **Change set:**
  `arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791132431/5b7a58bc-54ad-4b3e-a857-e8800072dfca`,
  criado em 2026-10-04T16:47:14Z; uma linha, `Modify` `Registros` `Substituicao: False`.
- **Leitura do change set — o índice do `Path` não aponta o registro:** os `Details` trazem
  `Target.Path` `/Properties/RecordSets/18` e `/Properties/RecordSets/11`. Na lista do template,
  que é a mesma do `BeforeContext` e do `AfterContext`, 18 é `ses.lotusotec.cl.` `TXT` e 11 é
  `pop3.lotusotec.cl.` `CNAME`; mas o `BeforeValue` de `/18/ResourceRecords` é
  `["185.146.167.195"]` e o de `/11/ResourceRecords` é `["2a07:7800::195"]` — os dois registros de
  `ensaio-corte`, que na lista estão em 21 e 22. Comparando `BeforeContext` com `AfterContext` por
  `Name` e `Type` (23 registros nos dois lados), só mudam `ensaio-corte.lotusotec.cl.` `A` e
  `AAAA`, de `ResourceRecords` com TTL 3600 para `AliasTarget`; apex e `www` iguais. A revisão do
  change set do corte (B5) tem de comparar assim, por nome e tipo.
- **Execução:** `execute-change-set` às 17:17:22Z, logo depois do aquecimento; `Registros`
  `UPDATE_COMPLETE` às 17:18:28Z (67 s depois do `execute`); stack `UPDATE_COMPLETE` às 17:18:31Z.
  O Route 53 aceitou o alias com a distribuição sem nenhum nome em `Aliases`
  (`get-distribution-config`: `Quantity: 0`; `lotusotec.cl` e `www` só entram na Task 15): a
  condição de parada de D7 não aconteceu.
- **Apex e `www` depois:** às 17:20:25Z, os quatro nameservers do Route 53 seguiam respondendo
  `185.146.167.195` / `2a07:7800::195`, TTL 3600, para `lotusotec.cl` e `www.lotusotec.cl`.

Aquecimento (antes), `medir-propagacao.mjs --nome ensaio-corte.lotusotec.cl --esperado wordpress
--aquecer`, saída 0:

Nome `ensaio-corte.lotusotec.cl`, esperado `wordpress`, aquecimento iniciada em 2026-10-04T17:17:22.645Z

| resolvedor                      | início: A / AAAA (TTL)                           | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | ------------------------------------------------ | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —            | —                      | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 3600/1540) | —            | —                      | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 3600/1539) | —            | —                      | —                 |

Medição (depois), `medir-propagacao.mjs --nome ensaio-corte.lotusotec.cl --esperado cloudfront
--limite 3900`, saída 0:

Nome `ensaio-corte.lotusotec.cl`, esperado `cloudfront`, medição iniciada em 2026-10-04T17:18:35.547Z

| resolvedor                      | início: A / AAAA (TTL)                                                                                                                                                                                                                                                                                                                                              | convergiu em | depois: A / AAAA (TTL)                                                                                                                                                                                                                                                                                                                                              | erros de consulta |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 3.166.165.48 3.166.165.111 3.166.165.187 3.166.165.85 / 2600:9000:27a4:f800:13:9e71:75c0:21 2600:9000:27a4:6800:13:9e71:75c0:21 2600:9000:27a4:3e00:13:9e71:75c0:21 2600:9000:27a4:7600:13:9e71:75c0:21 2600:9000:27a4:f000:13:9e71:75c0:21 2600:9000:27a4:5600:13:9e71:75c0:21 2600:9000:27a4:fa00:13:9e71:75c0:21 2600:9000:27a4:2a00:13:9e71:75c0:21 (TTL 60/60) | 0 s          | 3.166.165.48 3.166.165.111 3.166.165.187 3.166.165.85 / 2600:9000:27a4:f800:13:9e71:75c0:21 2600:9000:27a4:6800:13:9e71:75c0:21 2600:9000:27a4:3e00:13:9e71:75c0:21 2600:9000:27a4:7600:13:9e71:75c0:21 2600:9000:27a4:f000:13:9e71:75c0:21 2600:9000:27a4:5600:13:9e71:75c0:21 2600:9000:27a4:fa00:13:9e71:75c0:21 2600:9000:27a4:2a00:13:9e71:75c0:21 (TTL 60/60) | —                 |
| route53 ns-31.awsdns-03.com     | 3.166.165.187 3.166.165.48 3.166.165.85 3.166.165.111 / 2600:9000:27a4:7200:13:9e71:75c0:21 2600:9000:27a4:2600:13:9e71:75c0:21 2600:9000:27a4:ec00:13:9e71:75c0:21 2600:9000:27a4:c800:13:9e71:75c0:21 2600:9000:27a4:8600:13:9e71:75c0:21 2600:9000:27a4:9000:13:9e71:75c0:21 2600:9000:27a4:c200:13:9e71:75c0:21 2600:9000:27a4:2400:13:9e71:75c0:21 (TTL 60/60) | 0 s          | 3.166.165.187 3.166.165.48 3.166.165.85 3.166.165.111 / 2600:9000:27a4:7200:13:9e71:75c0:21 2600:9000:27a4:2600:13:9e71:75c0:21 2600:9000:27a4:ec00:13:9e71:75c0:21 2600:9000:27a4:c800:13:9e71:75c0:21 2600:9000:27a4:8600:13:9e71:75c0:21 2600:9000:27a4:9000:13:9e71:75c0:21 2600:9000:27a4:c200:13:9e71:75c0:21 2600:9000:27a4:2400:13:9e71:75c0:21 (TTL 60/60) | —                 |
| route53 ns-1889.awsdns-44.co.uk | 3.166.165.85 3.166.165.48 3.166.165.111 3.166.165.187 / 2600:9000:27a4:ec00:13:9e71:75c0:21 2600:9000:27a4:c00:13:9e71:75c0:21 2600:9000:27a4:3a00:13:9e71:75c0:21 2600:9000:27a4:400:13:9e71:75c0:21 2600:9000:27a4:f000:13:9e71:75c0:21 2600:9000:27a4:a400:13:9e71:75c0:21 2600:9000:27a4:f400:13:9e71:75c0:21 2600:9000:27a4:b600:13:9e71:75c0:21 (TTL 60/60)   | 0 s          | 3.166.165.85 3.166.165.48 3.166.165.111 3.166.165.187 / 2600:9000:27a4:ec00:13:9e71:75c0:21 2600:9000:27a4:c00:13:9e71:75c0:21 2600:9000:27a4:3a00:13:9e71:75c0:21 2600:9000:27a4:400:13:9e71:75c0:21 2600:9000:27a4:f000:13:9e71:75c0:21 2600:9000:27a4:a400:13:9e71:75c0:21 2600:9000:27a4:f400:13:9e71:75c0:21 2600:9000:27a4:b600:13:9e71:75c0:21 (TTL 60/60)   | —                 |
| route53 ns-1507.awsdns-60.org   | 3.166.165.85 3.166.165.111 3.166.165.48 3.166.165.187 / 2600:9000:27a4:de00:13:9e71:75c0:21 2600:9000:27a4:9a00:13:9e71:75c0:21 2600:9000:27a4:8800:13:9e71:75c0:21 2600:9000:27a4:dc00:13:9e71:75c0:21 2600:9000:27a4:e400:13:9e71:75c0:21 2600:9000:27a4:c000:13:9e71:75c0:21 2600:9000:27a4:800:13:9e71:75c0:21 2600:9000:27a4:9200:13:9e71:75c0:21 (TTL 60/60)  | 0 s          | 3.166.165.85 3.166.165.111 3.166.165.48 3.166.165.187 / 2600:9000:27a4:de00:13:9e71:75c0:21 2600:9000:27a4:9a00:13:9e71:75c0:21 2600:9000:27a4:8800:13:9e71:75c0:21 2600:9000:27a4:dc00:13:9e71:75c0:21 2600:9000:27a4:e400:13:9e71:75c0:21 2600:9000:27a4:c000:13:9e71:75c0:21 2600:9000:27a4:800:13:9e71:75c0:21 2600:9000:27a4:9200:13:9e71:75c0:21 (TTL 60/60)  | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2600:9000:27a4:7a00:13:9e71:75c0:21 2600:9000:27a4:6400:13:9e71:75c0:21 2600:9000:27a4:c000:13:9e71:75c0:21 2600:9000:27a4:aa00:13:9e71:75c0:21 2600:9000:27a4:c00:13:9e71:75c0:21 2600:9000:27a4:4800:13:9e71:75c0:21 2600:9000:27a4:9400:13:9e71:75c0:21 2600:9000:27a4:6e00:13:9e71:75c0:21 (TTL 3529/60)                                      | 5 s          | 3.166.165.111 3.166.165.187 3.166.165.48 3.166.165.85 / 2600:9000:27a4:9200:13:9e71:75c0:21 2600:9000:27a4:8600:13:9e71:75c0:21 2600:9000:27a4:a000:13:9e71:75c0:21 2600:9000:27a4:ce00:13:9e71:75c0:21 2600:9000:27a4:1a00:13:9e71:75c0:21 2600:9000:27a4:8a00:13:9e71:75c0:21 2600:9000:27a4:ca00:13:9e71:75c0:21 2600:9000:27a4:5800:13:9e71:75c0:21 (TTL 60/60) | —                 |
| cloudflare 1.1.1.1              | 3.166.165.111 3.166.165.187 3.166.165.85 3.166.165.48 / 2a07:7800::195 (TTL 60/1469)                                                                                                                                                                                                                                                                                | 31 s         | 3.166.165.187 3.166.165.85 3.166.165.48 3.166.165.111 / 2600:9000:27a4:c800:13:9e71:75c0:21 2600:9000:27a4:9200:13:9e71:75c0:21 2600:9000:27a4:1e00:13:9e71:75c0:21 2600:9000:27a4:ee00:13:9e71:75c0:21 2600:9000:27a4:3800:13:9e71:75c0:21 2600:9000:27a4:a200:13:9e71:75c0:21 2600:9000:27a4:d000:13:9e71:75c0:21 2600:9000:27a4:4400:13:9e71:75c0:21 (TTL 29/45) | —                 |
| quad9 9.9.9.9                   | 3.166.165.111 3.166.165.85 3.166.165.48 3.166.165.187 / 2a07:7800::195 (TTL 60/1468)                                                                                                                                                                                                                                                                                | 11 s         | 3.166.165.111 3.166.165.85 3.166.165.48 3.166.165.187 / 2600:9000:27a4:6000:13:9e71:75c0:21 2600:9000:27a4:de00:13:9e71:75c0:21 2600:9000:27a4:ee00:13:9e71:75c0:21 2600:9000:27a4:1600:13:9e71:75c0:21 2600:9000:27a4:7c00:13:9e71:75c0:21 2600:9000:27a4:da00:13:9e71:75c0:21 2600:9000:27a4:6e00:13:9e71:75c0:21 2600:9000:27a4:d000:13:9e71:75c0:21 (TTL 49/60) | —                 |

Por resolvedor:

| resolvedor            | registro antigo na primeira consulta                                    | convergiu em | TTL na resposta nova |
| --------------------- | ----------------------------------------------------------------------- | ------------ | -------------------- |
| `route53` (os quatro) | nenhum                                                                  | 0 s          | 60/60                |
| google 8.8.8.8        | `A` do WordPress, 3529 s restantes (guardado pelo aquecimento)          | 5 s          | 60/60                |
| cloudflare 1.1.1.1    | `AAAA` do WordPress, 1469 s restantes (guardado pela medição do est. 1) | 31 s         | 29/45                |
| quad9 9.9.9.9         | `AAAA` do WordPress, 1468 s restantes (guardado pela medição do est. 1) | 11 s         | 49/60                |

Os quatro `route53` já davam o alias na primeira consulta, 4 s depois do `UPDATE_COMPLETE`, com TTL
60: o que o Route 53 dá a alias de CloudFront, já que o template não define TTL. Os três públicos
convergiram em 5 a 31 s, bem antes do TTL restante que o aquecimento mostrou e que o plano dava como
teto (3600 s; 1540 s no `AAAA` da Cloudflare e da Quad9). A coluna "início" mostra por quê: com o
Route 53 já servindo o alias, a primeira consulta ainda trouxe registros antigos, com o TTL correndo
desde a busca que os guardou — o `A` do aquecimento, 73 s antes, no Google; o `AAAA` da medição do
estágio 1, 35 min antes, na Cloudflare e na Quad9. A resposta nova veio numa consulta seguinte, que
caiu em outro cache do mesmo resolvedor (os três são anycast). E o script para de perguntar a um
resolvedor na primeira resposta nova: não vê se a consulta seguinte volta a cair no cache antigo.

Amostragem fora do plano, só leitura, para ver essa volta: 36 rodadas, uma a cada 5 s, de
17:20:25Z a 17:23:40Z (de 2 a 5 min depois da convergência medida), `A` e `AAAA` a cada público,
com a mesma consulta direta do `medir-propagacao.mjs` (script avulso, não versionado):

| resolvedor tipo | antigo (WordPress) | novo (CloudFront) | erro | TTL do antigo visto |
| --------------- | ------------------ | ----------------- | ---- | ------------------- |
| google A        | 3                  | 33                | 0    | 3297…3234           |
| google AAAA     | 4                  | 32                | 0    | 3414…3250           |
| cloudflare A    | 23                 | 13                | 0    | 1359…1169           |
| cloudflare AAAA | 25                 | 11                | 0    | 1360…1184           |
| quad9 A         | 14                 | 22                | 0    | 3414…1168           |
| quad9 AAAA      | 13                 | 23                | 0    | 1358…1178           |

O registro antigo continuou saindo — em cerca de dois terços das respostas da Cloudflare, pouco
mais de um terço das da Quad9 e uma em dez das do Google —, sempre com o TTL contando desde a busca
original, nunca renovado. Isso fecha o achado do estágio 1: o `convergiu em` é a primeira resposta
nova, não a última antiga. **O número do corte é o TTL do registro antigo:** depois da troca do
apex e do `www` (TTL 3600 hoje), parte das consultas ainda leva ao WordPress por até 3600 s; os 5 a
31 s medidos são o piso.

### 3.3 Estágio 3 — volta pelo caminho principal

- **Data e quem executou:** 2026-10-04, Claude, com a autorização explícita de João dada neste
  passo ("autorizo executar o change set do estágio 3 (2384c734)").
- **Template:** o `infra/lotus-dns.yaml` deste commit é o de `2f2ab46` (estágio 1), restaurado por
  `git checkout 2f2ab46 -- infra/lotus-dns.yaml scripts/infra/lib/zona.mjs`: sai o parâmetro
  `DominioDaDistribuicao`, e os dois registros de `ensaio-corte` voltam de `AliasTarget` a `TTL`
  `TtlPadrao` com o WordPress em `ResourceRecords`. O corpo que `get-template --change-set-name`
  devolve é igual ao arquivo, salvo as mesmas três linhas de comentário com `?`.
- **Change set:**
  `arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791134961/2384c734-41ee-471b-bd82-69c867570811`,
  criado em 2026-10-04T17:29:23Z (o `deploy --no-execute-changeset` levou 7 s, de 17:29:20Z a
  17:29:27Z); uma linha, `Modify` `Registros` `Substituicao: False`. Comparando `BeforeContext` com
  `AfterContext` por `Name` e `Type` (23 registros nos dois lados), só mudam
  `ensaio-corte.lotusotec.cl.` `A` e `AAAA`, de `AliasTarget` para `ResourceRecords` com TTL 3600;
  apex e `www` iguais. Os `Details` voltaram a apontar `/Properties/RecordSets/18` e `/11` (§3.2).
- **Espera antes do `execute`:** o aquecimento do estágio 2 (17:17:22Z) guardou o WordPress, TTL
  3600, nos caches públicos, e o Route 53 trocou até 17:18:28Z. Antes de 18:19Z o "antes" deste
  estágio não seria só alias, e o tempo do rollback sairia misturado com a cauda do estágio 2. O
  script só seguiu depois de 18:19Z (às 18:20:27Z), e a amostragem prévia (tabela abaixo) não achou
  nenhuma resposta antiga: os sete resolvedores, em `A` e `AAAA`, só davam o alias.
- **Drift antes:** `IN_SYNC`, detecção de 2026-10-04T18:20:28Z.
- **Execução:** `execute-change-set` às 18:21:05Z, logo depois do aquecimento; stack
  `UPDATE_IN_PROGRESS` às 18:21:07Z; `Registros` `UPDATE_IN_PROGRESS` às 18:21:10Z e
  `UPDATE_COMPLETE` às 18:22:11Z (66 s depois do `execute`); stack `UPDATE_COMPLETE` às 18:22:13Z;
  o `wait stack-update-complete`, que consulta a cada 30 s, voltou às 18:22:42Z. O
  `LastUpdatedTime` do stack (18:21:07Z) marca o início da atualização, não o fim. A diferença dele
  para o `CreationTime` do change set, que o plano manda anotar como custo do CloudFormation, aqui é
  quase toda a espera deliberada até 18:19Z: o custo do CloudFormation são os 7 s da criação mais os
  66 s do `execute` ao `UPDATE_COMPLETE`.
- **Apex e `www` depois:** às 18:27:46Z, os quatro nameservers do Route 53 seguiam respondendo
  `185.146.167.195` / `2a07:7800::195`, TTL 3600, para `lotusotec.cl` e `www.lotusotec.cl`.

Amostragem prévia (antes, fora do plano), `amostrar.mjs --novo cloudfront --rodadas 6` — o script
avulso de §3.2, agora também com os quatro `route53`; "antigas" conta toda resposta que não é o
alias:

Amostragem `ensaio-corte.lotusotec.cl`, novo `cloudfront`, 6 rodadas de 2026-10-04T18:20:29.201Z a 2026-10-04T18:21:00.419Z; tempos em s desde 2026-10-04T18:20:29.184Z

| resolvedor tipo                      | antigas | novas | erros | primeira nova em | última antiga em | TTL das antigas |
| ------------------------------------ | ------- | ----- | ----- | ---------------- | ---------------- | --------------- |
| route53 ns-904.awsdns-49.net A       | 0       | 6     | 0     | 0                | —                | —               |
| route53 ns-904.awsdns-49.net AAAA    | 0       | 6     | 0     | 0                | —                | —               |
| route53 ns-31.awsdns-03.com A        | 0       | 6     | 0     | 0                | —                | —               |
| route53 ns-31.awsdns-03.com AAAA     | 0       | 6     | 0     | 0                | —                | —               |
| route53 ns-1889.awsdns-44.co.uk A    | 0       | 6     | 0     | 0                | —                | —               |
| route53 ns-1889.awsdns-44.co.uk AAAA | 0       | 6     | 0     | 0                | —                | —               |
| route53 ns-1507.awsdns-60.org A      | 0       | 6     | 0     | 0                | —                | —               |
| route53 ns-1507.awsdns-60.org AAAA   | 0       | 6     | 0     | 0                | —                | —               |
| google A                             | 0       | 6     | 0     | 0                | —                | —               |
| google AAAA                          | 0       | 6     | 0     | 0                | —                | —               |
| cloudflare A                         | 0       | 6     | 0     | 0                | —                | —               |
| cloudflare AAAA                      | 0       | 6     | 0     | 0                | —                | —               |
| quad9 A                              | 0       | 6     | 0     | 0                | —                | —               |
| quad9 AAAA                           | 0       | 6     | 0     | 0                | —                | —               |

Aquecimento (antes), `medir-propagacao.mjs --nome ensaio-corte.lotusotec.cl --esperado cloudfront
--aquecer`, saída 0:

Nome `ensaio-corte.lotusotec.cl`, esperado `cloudfront`, aquecimento iniciada em 2026-10-04T18:21:01.468Z

| resolvedor                      | início: A / AAAA (TTL)                                                                                                                                                                                                                                                                                                                                              | convergiu em | depois: A / AAAA (TTL) | erros de consulta |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------- | ----------------- |
| route53 ns-904.awsdns-49.net    | 3.166.165.85 3.166.165.111 3.166.165.48 3.166.165.187 / 2600:9000:27a4:a00:13:9e71:75c0:21 2600:9000:27a4:b600:13:9e71:75c0:21 2600:9000:27a4:2000:13:9e71:75c0:21 2600:9000:27a4:6a00:13:9e71:75c0:21 2600:9000:27a4:6400:13:9e71:75c0:21 2600:9000:27a4:7200:13:9e71:75c0:21 2600:9000:27a4:d600:13:9e71:75c0:21 2600:9000:27a4:dc00:13:9e71:75c0:21 (TTL 60/60)  | —            | —                      | —                 |
| route53 ns-31.awsdns-03.com     | 3.166.165.85 3.166.165.187 3.166.165.111 3.166.165.48 / 2600:9000:27a4:0:13:9e71:75c0:21 2600:9000:27a4:1c00:13:9e71:75c0:21 2600:9000:27a4:c00:13:9e71:75c0:21 2600:9000:27a4:fe00:13:9e71:75c0:21 2600:9000:27a4:2c00:13:9e71:75c0:21 2600:9000:27a4:3400:13:9e71:75c0:21 2600:9000:27a4:d800:13:9e71:75c0:21 2600:9000:27a4:3000:13:9e71:75c0:21 (TTL 60/60)     | —            | —                      | —                 |
| route53 ns-1889.awsdns-44.co.uk | 3.166.165.111 3.166.165.85 3.166.165.48 3.166.165.187 / 2600:9000:27a4:4c00:13:9e71:75c0:21 2600:9000:27a4:d600:13:9e71:75c0:21 2600:9000:27a4:e00:13:9e71:75c0:21 2600:9000:27a4:ea00:13:9e71:75c0:21 2600:9000:27a4:4e00:13:9e71:75c0:21 2600:9000:27a4:5400:13:9e71:75c0:21 2600:9000:27a4:ba00:13:9e71:75c0:21 2600:9000:27a4:ae00:13:9e71:75c0:21 (TTL 33/60)  | —            | —                      | —                 |
| route53 ns-1507.awsdns-60.org   | 3.166.165.85 3.166.165.111 3.166.165.48 3.166.165.187 / 2600:9000:27a4:b800:13:9e71:75c0:21 2600:9000:27a4:9e00:13:9e71:75c0:21 2600:9000:27a4:bc00:13:9e71:75c0:21 2600:9000:27a4:c200:13:9e71:75c0:21 2600:9000:27a4:da00:13:9e71:75c0:21 2600:9000:27a4:f600:13:9e71:75c0:21 2600:9000:27a4:9600:13:9e71:75c0:21 2600:9000:27a4:2800:13:9e71:75c0:21 (TTL 60/60) | —            | —                      | —                 |
| google 8.8.8.8                  | 3.166.165.187 3.166.165.85 3.166.165.111 3.166.165.48 / 2600:9000:27a4:7200:13:9e71:75c0:21 2600:9000:27a4:b200:13:9e71:75c0:21 2600:9000:27a4:ec00:13:9e71:75c0:21 2600:9000:27a4:f000:13:9e71:75c0:21 2600:9000:27a4:5400:13:9e71:75c0:21 2600:9000:27a4:9000:13:9e71:75c0:21 2600:9000:27a4:1600:13:9e71:75c0:21 2600:9000:27a4:1000:13:9e71:75c0:21 (TTL 60/60) | —            | —                      | —                 |
| cloudflare 1.1.1.1              | 3.166.165.187 3.166.165.85 3.166.165.48 3.166.165.111 / 2600:9000:27a4:7e00:13:9e71:75c0:21 2600:9000:27a4:7200:13:9e71:75c0:21 2600:9000:27a4:6200:13:9e71:75c0:21 2600:9000:27a4:c000:13:9e71:75c0:21 2600:9000:27a4:8c00:13:9e71:75c0:21 2600:9000:27a4:6000:13:9e71:75c0:21 2600:9000:27a4:6c00:13:9e71:75c0:21 2600:9000:27a4:c00:13:9e71:75c0:21 (TTL 60/28)  | —            | —                      | —                 |
| quad9 9.9.9.9                   | 3.166.165.85 3.166.165.48 3.166.165.187 3.166.165.111 / 2600:9000:27a4:9400:13:9e71:75c0:21 2600:9000:27a4:2000:13:9e71:75c0:21 2600:9000:27a4:6600:13:9e71:75c0:21 2600:9000:27a4:1800:13:9e71:75c0:21 2600:9000:27a4:c400:13:9e71:75c0:21 2600:9000:27a4:1200:13:9e71:75c0:21 2600:9000:27a4:4e00:13:9e71:75c0:21 2600:9000:27a4:fe00:13:9e71:75c0:21 (TTL 49/49) | —            | —                      | —                 |

Medição (depois), `medir-propagacao.mjs --nome ensaio-corte.lotusotec.cl --esperado wordpress
--limite 300`, saída 0:

Nome `ensaio-corte.lotusotec.cl`, esperado `wordpress`, medição iniciada em 2026-10-04T18:22:46.753Z

| resolvedor                      | início: A / AAAA (TTL)                           | convergiu em | depois: A / AAAA (TTL)                           | erros de consulta |
| ------------------------------- | ------------------------------------------------ | ------------ | ------------------------------------------------ | ----------------- |
| route53 ns-904.awsdns-49.net    | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |
| route53 ns-31.awsdns-03.com     | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |
| route53 ns-1889.awsdns-44.co.uk | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |
| route53 ns-1507.awsdns-60.org   | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |
| google 8.8.8.8                  | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3600/3600) | —                 |
| cloudflare 1.1.1.1              | 185.146.167.195 / 2a07:7800::195 (TTL 3527/3532) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3527/3532) | —                 |
| quad9 9.9.9.9                   | 185.146.167.195 / 2a07:7800::195 (TTL 3527/3546) | 0 s          | 185.146.167.195 / 2a07:7800::195 (TTL 3527/3546) | —                 |

Os sete convergiram em `0 s`, dentro do esperado (até 60 s mais os 5 s da sondagem). Mas a medição
só começa depois do `wait`, 101 s depois do `execute`, e o TTL do alias é 60: quando ela começou, a
cauda já tinha acabado. O TTL 3527 que a Cloudflare e a Quad9 mostram no `A` diz que elas buscaram
o WordPress 73 s antes, por volta de 28 s depois do `execute` — a primeira resposta nova delas na
amostragem abaixo. Para ver a cauda, a amostragem fora do plano rodou desde o `execute`, como
fariam os visitantes durante o `wait`: 60 rodadas, uma a cada 5 s, tempos contados do `execute`:

Amostragem `ensaio-corte.lotusotec.cl`, novo `wordpress`, 60 rodadas de 2026-10-04T18:21:06.776Z a 2026-10-04T18:26:16.104Z; tempos em s desde 2026-10-04T18:21:05.000Z

| resolvedor tipo                      | antigas | novas | erros | primeira nova em | última antiga em | TTL das antigas |
| ------------------------------------ | ------- | ----- | ----- | ---------------- | ---------------- | --------------- |
| route53 ns-904.awsdns-49.net A       | 2       | 58    | 0     | 13               | 8                | 60…60           |
| route53 ns-904.awsdns-49.net AAAA    | 2       | 58    | 0     | 13               | 8                | 60…60           |
| route53 ns-31.awsdns-03.com A        | 2       | 58    | 0     | 13               | 8                | 60…60           |
| route53 ns-31.awsdns-03.com AAAA     | 2       | 58    | 0     | 13               | 8                | 60…60           |
| route53 ns-1889.awsdns-44.co.uk A    | 2       | 58    | 0     | 13               | 8                | 60…60           |
| route53 ns-1889.awsdns-44.co.uk AAAA | 2       | 58    | 0     | 13               | 8                | 60…60           |
| route53 ns-1507.awsdns-60.org A      | 2       | 58    | 0     | 13               | 8                | 60…22           |
| route53 ns-1507.awsdns-60.org AAAA   | 2       | 58    | 0     | 13               | 8                | 60…60           |
| google A                             | 8       | 52    | 0     | 33               | 43               | 60…2            |
| google AAAA                          | 4       | 56    | 0     | 13               | 43               | 38…2            |
| cloudflare A                         | 7       | 53    | 0     | 28               | 48               | 50…10           |
| cloudflare AAAA                      | 6       | 54    | 0     | 33               | 28               | 23…3            |
| quad9 A                              | 6       | 54    | 0     | 28               | 33               | 38…2            |
| quad9 AAAA                           | 6       | 54    | 0     | 33               | 28               | 43…2            |

- **Route 53:** os quatro nameservers ainda davam o alias nas duas primeiras rodadas (até 8 s) e o
  WordPress de 13 s em diante. A troca chegou aos quatro de 8 a 13 s depois do `execute`, 53 s
  antes do `UPDATE_COMPLETE` do `Registros`; o resto é o CloudFormation esperando a mudança ser dada
  como propagada (`INSYNC`, que não foi lido aqui). O TTL que o próprio Route 53 dá ao alias nem
  sempre é 60 (33 no aquecimento, 22 numa rodada) — provavelmente o que resta, no Route 53, do
  registro da distribuição (não investigado); nunca passou de 60.
- **Públicos:** a última resposta antiga (o alias) saiu de 28 a 48 s depois do `execute`, com o TTL
  se esgotando (até 2 s); depois de 48 s, só o WordPress, sem erro de consulta. Nos três públicos
  o alias ainda voltou depois da primeira resposta nova (outro cache do mesmo resolvedor, como no
  estágio 2), mas aqui o registro antigo é o alias e a cauda acaba com o TTL dele: o teto é a troca
  no Route 53 mais 60 s, cerca de 73 s.

**Rollback pelo caminho principal:** com o change set já criado e lido, 48 s do `execute` até a
última resposta antiga nos públicos (teto de cerca de 73 s: os 13 s do Route 53 mais os 60 s do TTL
do alias). Criar o change set leva 7 s; no corte real, o que domina é o tempo de revisar e
autorizar. O `UPDATE_COMPLETE` (66 s) e a volta do `wait` (97 s) chegam depois do DNS e não servem
de relógio do rollback.

_Tasks 9–11: uma subsecção por estágio._

## 4. Desfecho e procedimento

_Task 12._
