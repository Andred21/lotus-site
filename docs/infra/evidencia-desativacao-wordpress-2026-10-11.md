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
