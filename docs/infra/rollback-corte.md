# Rollback de `lotusotec.cl` depois de `B7`

> Procedimento, não botão (`D-37`). Desde `B7` (`7.2.7`, 2026-10-11), o WordPress não existe mais no
> host do StackCP, e não há volta de DNS para ele. Os caminhos A (change set) e B (`UPSERT` de
> emergência) deste documento valeram de `B4` a `B7`: o texto deles está em
> `git show dcfeb76:docs/infra/rollback-corte.md`, e os tempos medidos, em
> [`evidencia-backup-rollback-2026-09-29.md`](evidencia-backup-rollback-2026-09-29.md) §3.

## 1. Gatilho

`pnpm smoke` com `SMOKE_URL=https://lotusotec.cl` (sem `SMOKE_VIA`) reprovando em qualquer dos
itens 2 a 6 (TLS, redirects, home, assets, formulário), ou o site fora do ar. Itens 1, 7, 8 e 9
reprovando são regressão que um deploy corrige.

O gatilho também chega sozinho, por e-mail (`B6`): `ALARM: "lotus-site-indisponivel"` e
`ALARM: "lotus-site-5xx"`. Alarme é aviso, não veredito: o smoke decide (`runbook-aws.md` §11.3).

## 2. Primeira resposta: rollback de release

`ADR-SITE-004`, secção "Rollback": devolve à raiz da distribuição um release anterior do bucket,
com invalidação, sem depender do CI. Depois dele, a correção para frente sai pelo CI corporativo,
que precisa estar publicando (`D-62`).

## 3. Desastre: restaurar o site antigo do backup final

Só se a distribuição inteira estiver perdida e for preciso servir alguma coisa noutro host. O
backup final é o de
[`evidencia-desativacao-wordpress-2026-10-11.md`](evidencia-desativacao-wordpress-2026-10-11.md)
§1 (arquivos + um dump por banco, com hashes), e a restauração foi exercitada localmente na §2 do
mesmo arquivo. O host do StackCP continua no ar, vazio (spec de `7.2.7`, D2): arquivos em
`public_html` pelo gerenciador, dump importado pelo phpMyAdmin num banco novo, e o `wp-config.php`
ajustado para ele. Apagar antes o `.htaccess` com `Require all denied`.

Sem login no `wp-admin`, a senha do administrador se recupera pelo phpMyAdmin:

```sql
SELECT ID, user_login FROM 30_users;
UPDATE 30_users SET user_pass = MD5('senha-nova-temporaria') WHERE user_login = '<login>';
```

O WordPress rehasheia no primeiro login. Trocar a senha de novo pelo painel depois.

Fora do StackCP, noutro host, faltam duas peças que são do host, não do backup:

- a biblioteca `/usr/share/php/wp-stack-cache.php`, que o mu-plugin
  `wp-content/mu-plugins/wp-stack-cache.php` do backup exige: sem desativar o mu-plugin, a home
  para num aviso de `require` (o ensaio o renomeia só na cópia);
- a proteção que respondia `401` em `https://lotusotec.cl/wp-login.php` (cabeçalho
  `x-stackprotect-id`), que não é do WordPress. Proteger o `wp-login.php` antes de apontar o DNS
  para o host novo.

O certificado wildcard da 20i vence em 2026-11-10 e não renova (`D-51`): servir o site antigo exige
certificado novo, e a `CAA` da zona, quando existir, precisa aceitar a CA dele (`D-49`).
