# Evidência — desativação do WordPress e do Moodle (`7.2.7`)

Bloco `B7`, spec `docs/superpowers/specs/2026-10-11-7.2.7-desativar-wordpress-design.md`.
Datas e comandos abaixo são os executados; nada é digitado de memória.

## 1. Backup final

Feito por João no StackCP em 2026-10-11 (estágio 1, spec §4.1); conferido por Claude nas cópias do
Windows, pasta `V1/Backup Site Institucional/Backup final`.

Bancos listados no phpMyAdmin, como João os disse — todos exportados (estrutura e dados, gzip):

| Servidor                    | Banco                  | Usado por                                                                          |
| --------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| `sdb-j.hosting.stackcp.net` | `wordpress-3139304a2e` | WordPress (`DB_NAME`/`DB_HOST` do `wp-config.php`, prefixo `30_`)                  |
| `sdb-k.hosting.stackcp.net` | `moodle41-313931a097`  | Moodle (`$CFG->dbname`/`$CFG->dbhost` de `aulavirtual/config.php`, prefixo `mdl_`) |
| `sdb-l.hosting.stackcp.net` | `wordpress-313932c3a0` | nada: nenhum dos dois `config` o cita, e o banco não tem tabela                    |

O `wordpress-313932c3a0` sai com zero `CREATE TABLE`. O dump está completo (`CREATE DATABASE`,
`USE`, `COMMIT`), e João conferiu no phpMyAdmin em 2026-10-11 que o banco não tem tabelas: é banco
vazio, não exportação falhada.

Raiz da conta, fora de `public_html/`, como João a disse: `.htaccess` e `.rnd` — os mesmos de `B4`.
O `.htaccess` foi baixado (o Windows gravou como `htaccess`, sem o ponto); o `.rnd` é a semente do
OpenSSL, do sistema, e ficou. Nenhum dos dois é apagado no estágio 2. O `.htaccess` da raiz escolhe
o PHP 7.4 (`AddHandler x-httpd-php74 .php`, depois de um `php70` antigo) e traz o bloco
`StackCache` de `Expires`; é a versão de PHP que o ensaio usa.

| Cópia                                                       | SHA-256                                                            | Tamanho (B) | Gerada em  | Onde está                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------ | ----------- | ---------- | ------------------------------------------- |
| Arquivos de `public_html/` (`stackcp-final-2026-10-11.zip`) | `643f18c3ae649214e3fb2e1e5c95c4ed89a6e8474174924426e248c94f56cdf2` | 332603471   | 2026-10-11 | Windows (`Backup final`) e pendrive de `B4` |
| Banco do WordPress (`sdb-j_hosting_stackcp_net.sql.gz`)     | `d200b11f735bfb8fb88983272e1b8c574da640fe2b9fe1b09ce5f60b524b2e6b` | 312339      | 2026-10-11 | Windows (`Backup final`) e pendrive de `B4` |
| Banco do Moodle (`sdb-k_hosting_stackcp_net.sql.gz`)        | `ac807d4ae70991549f457655e57df4c4fe8fba6b3fbb28fa0f187ec11a32215c` | 406919      | 2026-10-11 | Windows (`Backup final`) e pendrive de `B4` |
| Banco vazio (`sdb-l_hosting_stackcp_net.sql.gz`)            | `e3d7ac7ea3615bf052f07d2eaa1a8233301844278a2b51b23ab63435e2782ac1` | 478         | 2026-10-11 | Windows (`Backup final`) e pendrive de `B4` |
| `.htaccess` da raiz da conta (`htaccess`)                   | `523f291b6a258bf692fb9e0b0d89d731789befb2b288e326ab6e0c4b9964f950` | 1053        | 2026-10-11 | Windows (`Backup final`)                    |

Pendrive: declaração de João em 2026-10-11 — os quatro arquivos do StackCP salvos no Windows e no
pendrive. O `.htaccess` foi baixado depois e João o declarou só na pasta `Backup final`. O agente
não leu o pendrive: os hashes acima são das cópias no Windows.

Integridade e conteúdo, medidos nas cópias do Windows em 2026-10-11:

- **Arquivos.** `unzip -tq`: `No errors detected in compressed data`. 51.307 entradas (40.760
  arquivos), 686.291.205 B descompactado. Tem `public_html/wp-config.php`, `public_html/.htaccess`
  e `public_html/.user.ini`; `wp-includes/version.php` diz `$wp_version = '7.1.2';`. Moodle
  presente: 33.683 entradas em `aulavirtual/` e 5.709 em `moodledata/`, além do
  `moodle-latest-401 (1).zip`.
- **Comparação com a cópia de 2026-10-03** (`evidencia-backup-rollback-2026-09-29.md` §1). Os
  "51.306 arquivos" de lá contavam entradas do ZIP, diretórios inclusos; na mesma medida, 51.306
  antes e 51.307 agora (40.759 e 40.760 arquivos). `comm` das duas listas dá uma entrada só, nova:
  `public_html/moodledata/sessions/sess_6138aac98f2d74692f4a5b8e3800c49c`, uma sessão do Moodle.
- **Bancos.** `gzip -t` ok nos três; phpMyAdmin 5.2.3, MariaDB 10.11.18, gerados às 21:47–21:48 do
  relógio do servidor. WordPress: 13 `CREATE TABLE`, as mesmas treze `30_` do dump de 2026-10-03
  (`diff` das listas vazio). Moodle: 470 `CREATE TABLE`, todas `mdl_`, com dados em `mdl_user`,
  `mdl_course` e `mdl_config`. Vazio: zero, como acima.

## 2. Ensaio de restauração

Rodado em 2026-10-11, das 20:51:04Z às 20:52:47Z, no commit `1dc14b6` (o vivo lido pelo IP
`185.146.167.195`, spec D9), sobre o ZIP e o dump do WordPress de §1 — `sha256sum` reconferido
logo antes, igual ao da tabela. O Moodle tem só a prova de integridade de §1 (spec D4).

```bash
source ~/.nvm/nvm.sh >/dev/null && nvm use >/dev/null
B='/mnt/c/Users/jvbat/Desktop/Projetos/Lotus.cl/V1/Backup Site Institucional/Backup final'
ZIP="$B/stackcp-final-2026-10-11.zip"; DMP="$B/sdb-j_hosting_stackcp_net.sql.gz"
LOG=<scratchpad do agente>/ensaio-restauracao-final.log
ENSAIO_DESATIVAR_MU_PLUGINS=wp-stack-cache scripts/wordpress/ensaio-restauracao.sh "$ZIP" "$DMP" > "$LOG" 2>&1; echo "saida: $?"
```

Saída, sem as linhas do `docker compose build`/`up`:

```text
== descompactando /mnt/c/Users/jvbat/Desktop/Projetos/Lotus.cl/V1/Backup Site Institucional/Backup final/stackcp-final-2026-10-11.zip
== docroot: aulavirtual index.php license.txt moodle-latest-401 (1).zip moodledata readme.html wp-activate.php wp-admin wp-blog-header.php wp-comments-post.php wp-config-sample.php wp-config.php wp-content wp-cron.php wp-includes wp-links-opml.php wp-load.php wp-login.php wp-mail.php wp-settings.php wp-signup.php wp-trackback.php xmlrpc.php
== mu-plugin desativado na cópia: wp-stack-cache
wp-config ajustado: /tmp/ensaio-restauracao.vWRzr1/docroot/wp-config.php
== subindo containers
== importando /mnt/c/Users/jvbat/Desktop/Projetos/Lotus.cl/V1/Backup Site Institucional/Backup final/sdb-j_hosting_stackcp_net.sql.gz
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
```

`saida: 0`. A única falha da cópia, `401` em `/wp-json/wp/v2/users/me`, é a mesma que o vivo
responde na mesma URL: chamada de usuário logado, sem sessão nos dois lados.

**Aceite do estágio 1:** hashes, integridade do ZIP e dos três dumps, comparação com 2026-10-03,
ensaio `== ensaio passou` com `saida: 0`, e o pendrive declarado por João.

## 3. Remoção no host

"pode apagar" — João, 2026-10-11T20:58:25Z (horário em que a frase chegou), depois do estágio 1
aceito (spec D8). Pedido junto: medir logo em seguida e prever o risco.

### Antes

Pelo IP, `curl --resolve lotusotec.cl:443:185.146.167.195` (o `aulavirtual` com `-k`), de
2026-10-11T20:58:25Z a 20:58:36Z:

```text
/                      200
/wp-json/              200
/wp-login.php          401
/wp-content/uploads/   403
/aulavirtual/          303
aulavirtual /          200
```

O `403` em `/wp-content/uploads/` já existia antes: listagem de diretório desligada no host.

Resolução normal no mesmo minuto (`getent ahostsv4`): `lotusotec.cl` e `www` na CloudFront
(`13.227.110.*`); `smtp` `185.151.28.68`, `imap` `185.151.28.69/74/84/85`, `pop3` `185.151.28.70`,
`autodiscover` `45.8.227.100`, `ftp` `185.146.165.203/204`; `aulavirtual` sem resposta. Nenhum
nome da StackMail nem o `ftp` aponta para `185.146.167.195`: o IP do site é só do site.

Produção antes: `SMOKE_URL=https://lotusotec.cl pnpm smoke` com `10 passed`;
`lotus-site-5xx` e `lotus-site-indisponivel` em `OK`. As origens da distribuição
(`infra/lotus-site.yaml`) são o bucket e a Function URL do contato; nenhuma é o host do StackCP.

### Remoção

Feita por João no StackCP, "entre 18:00 e agora" no horário de Santiago (UTC−3), relatada às
21:09Z — de 2026-10-11T21:00Z a 21:09Z, sem horário por passo. **`DATA_B7` = 2026-10-11.**

1. Gerenciador de arquivos com os ocultos visíveis: todo o conteúdo de `public_html/` apagado — as
   25 entradas da raiz, `.htaccess` e `.user.ini` inclusos, conferidas contra o print de João e
   contra a raiz do ZIP de §1.
2. Os três bancos de §1 apagados, com os usuários deles (o vazio `wordpress-313932c3a0` também; o
   plano listava só WordPress e Moodle).
3. Cron do Moodle apagado, se existia.
4. `public_html/.htaccess` criado com `Require all denied`.

### Depois

Primeira sonda, 2026-10-11T21:09:00Z a 21:09:03Z, `curl -k --resolve <host>:443:185.146.167.195`:

```text
lotusotec.cl               /                      200 marcas=52
lotusotec.cl               /wp-json/              403 marcas=0
lotusotec.cl               /wp-login.php          401 marcas=0
lotusotec.cl               /wp-content/uploads/   403 marcas=0
lotusotec.cl               /aulavirtual/          403 marcas=0
aulavirtual.lotusotec.cl   /                      403 marcas=0
```

Reprovou na home. O `200` (234.732 B, o mesmo tamanho de antes) vinha do cache de borda da
StackCDN, não da origem: `x-provided-by: StackCDN`, `x-via: IAD1`,
`cache-control: public, s-maxage=216000` (60 h). A mesma URL com `?b7=<epoch>`, `/index.php`,
`/cursos/` e o `www` já davam `403` de 239 B. João rodou "Purgar todo" em "Almacenamiento en caché
de borde" do StackCP; os interruptores de cache dinâmico e de borda global ficaram como estavam.

Segunda sonda, depois do purge, 2026-10-11T21:12:19Z a 21:12:23Z:

```text
lotusotec.cl               /                      403 marcas=0
lotusotec.cl               /wp-json/              403 marcas=0
lotusotec.cl               /wp-login.php          401 marcas=0
lotusotec.cl               /wp-content/uploads/   403 marcas=0
lotusotec.cl               /aulavirtual/          403 marcas=0
aulavirtual.lotusotec.cl   /                      403 marcas=0
www.lotusotec.cl           /                      403 marcas=0
```

Dois assets antigos que a borda guardava por um dia, `/wp-content/uploads/2022/08/feature_img-1-510x382.png`
e `/wp-includes/css/dist/block-library/style.min.css`: `403`, 239 B. A home responde `403` com
`x-cdn-cache-status: MISS` e `x-origin-cache-status: MISS`. O `401` de `/wp-login.php` é o
StackProtect do host (spec D0), aceito pela tabela da spec §4.2; corpo sem marca do WordPress.

## 4. Produção depois

2026-10-11T21:09:21Z, antes do purge, e de novo 2026-10-11T21:12:32Z a 21:12:47Z, depois dele:
`SMOKE_URL=https://lotusotec.cl pnpm smoke` com `10 passed` nas duas;
`aws cloudwatch describe-alarms --region us-east-1` com `lotus-site-5xx` e
`lotus-site-indisponivel` em `OK` nas duas.

StackMail depois da remoção: mensagem de `contabilidad@lotusotec.cl` para um endereço Gmail
externo de João, enviada 2026-10-11T21:14:55Z, chegou à caixa de entrada. Cabeçalhos do "Mostrar
original", colados por João (corpo e assinaturas ARC omitidos):

```text
Received: from shared-external-lhr1.stackcp.com ([45.8.227.175] helo=www.stackmail.com)
  by smtp1.lhr.stackcp.net with esmtpa (Exim 4.99.5) ... Sun, 11 Oct 2026 22:14:56 +0100
Received: from smtp1.mail.stackcp.net ([10.4.12.32] helo=smtp1.lhr.stackcp.net)
  by relay2.stackmail.com with esmtps (TLS1.3) ... Sun, 11 Oct 2026 22:14:56 +0100
Received: from relay2.stackmail.com (relay2.stackmail.com. [185.151.28.66])
  by mx.google.com with ESMTPS ... Sun, 11 Oct 2026 14:14:56 -0700 (PDT)
Received-SPF: pass (google.com: domain of contabilidad@lotusotec.cl designates 185.151.28.66
  as permitted sender) client-ip=185.151.28.66;
Authentication-Results: mx.google.com; spf=pass ... dmarc=pass (p=NONE sp=NONE dis=NONE)
  header.from=lotusotec.cl
X-Authenticated-Sender: contabilidad@lotusotec.cl
```

A mensagem saiu pelo webmail e pelo relay da StackMail (`185.151.28.66`), não pelo Google
Workspace: a remoção não tocou a StackMail (Review Focus 4).
