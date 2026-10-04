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

_Tasks 6–11: uma subsecção por estágio._

## 4. Desfecho e procedimento

_Task 12._
