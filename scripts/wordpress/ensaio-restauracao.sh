#!/usr/bin/env bash
# Ensaio de restauração do backup do WordPress (7.2.3, spec §4.3).
#
# Uso: scripts/wordpress/ensaio-restauracao.sh <arquivos.zip|.tar.gz> <dump.sql|.sql.gz>
#
# Recusa caminho dentro do repositório (o backup nunca entra nele, spec D3),
# descompacta numa pasta temporária, ajusta as constantes de conexão da CÓPIA
# do wp-config.php, sobe Apache+PHP 7.4 e MariaDB, importa o dump, confere a
# home, roda verificar-restauracao.mjs, procura "PHP Fatal error" no log e
# derruba containers, volumes e a pasta temporária — inclusive quando falha.
#
# ENSAIO_DESATIVAR_PLUGINS="a,b" renomeia wp-content/plugins/<a> e <b> NA
# CÓPIA antes de subir (spec §11: plugin de segurança bloqueando acesso
# local). Registrar na evidência; nunca no host.
#
# ENSAIO_DESATIVAR_MU_PLUGINS="a,b" faz o mesmo com wp-content/mu-plugins/
# <a>.php e <b>.php. O backup do StackCP traz wp-stack-cache.php, que exige
# /usr/share/php/wp-stack-cache.php — biblioteca que só existe no host.
set -euo pipefail

AQUI=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO=$(git -C "$AQUI" rev-parse --show-toplevel)
USO="uso: $0 <arquivos.zip|.tar.gz> <dump.sql|.sql.gz>"
ARQUIVOS=$(realpath "${1:?$USO}")
DUMP=$(realpath "${2:?$USO}")

for caminho in "$ARQUIVOS" "$DUMP"; do
  [ -f "$caminho" ] || { echo "não existe: $caminho" >&2; exit 2; }
  case "$caminho" in
    "$REPO"/*) echo "recusado: $caminho está dentro do repositório" >&2; exit 2 ;;
  esac
done

TMP=$(mktemp -d /tmp/ensaio-restauracao.XXXXXX)
export ENSAIO_DOCROOT="$TMP/docroot"
compose() { docker compose -f "$AQUI/compose.yaml" "$@"; }

limpar() {
  local status=$?
  compose down -v --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$TMP"
  exit "$status"
}
trap limpar EXIT

echo "== descompactando $ARQUIVOS"
mkdir -p "$TMP/arquivos"
case "$ARQUIVOS" in
  *.zip) unzip -q "$ARQUIVOS" -d "$TMP/arquivos" ;;
  *.tar.gz|*.tgz) tar -xzf "$ARQUIVOS" -C "$TMP/arquivos" ;;
  *) echo "formato desconhecido: $ARQUIVOS" >&2; exit 2 ;;
esac
CONFIG=$(find "$TMP/arquivos" -maxdepth 4 -name wp-config.php | head -1)
[ -n "$CONFIG" ] || { echo "wp-config.php não encontrado em $ARQUIVOS" >&2; exit 3; }
mv "$(dirname "$CONFIG")" "$ENSAIO_DOCROOT"
echo "== docroot: $(ls "$ENSAIO_DOCROOT" | tr '\n' ' ')"

for plugin in ${ENSAIO_DESATIVAR_PLUGINS:+${ENSAIO_DESATIVAR_PLUGINS//,/ }}; do
  [ -d "$ENSAIO_DOCROOT/wp-content/plugins/$plugin" ] \
    || { echo "plugin não existe na cópia: $plugin" >&2; exit 3; }
  mv "$ENSAIO_DOCROOT/wp-content/plugins/$plugin" \
     "$ENSAIO_DOCROOT/wp-content/plugins/$plugin.desativado"
  echo "== plugin desativado na cópia: $plugin"
done

for mu in ${ENSAIO_DESATIVAR_MU_PLUGINS:+${ENSAIO_DESATIVAR_MU_PLUGINS//,/ }}; do
  [ -f "$ENSAIO_DOCROOT/wp-content/mu-plugins/$mu.php" ] \
    || { echo "mu-plugin não existe na cópia: $mu" >&2; exit 3; }
  mv "$ENSAIO_DOCROOT/wp-content/mu-plugins/$mu.php" \
     "$ENSAIO_DOCROOT/wp-content/mu-plugins/$mu.php.desativado"
  echo "== mu-plugin desativado na cópia: $mu"
done

node "$AQUI/ajustar-wp-config.mjs" "$ENSAIO_DOCROOT/wp-config.php"
chmod -R a+rX "$ENSAIO_DOCROOT"

echo "== subindo containers"
compose up -d --build --wait

echo "== importando $DUMP"
case "$DUMP" in
  *.gz) LER=zcat ;;
  *) LER=cat ;;
esac
# `USE`/`CREATE DATABASE` do host apontariam para o nome original do banco;
# tirar essas linhas não muda um byte de dado (spec D4).
"$LER" "$DUMP" | sed -E '/^(USE |CREATE DATABASE )/d' \
  | compose exec -T db mariadb -uwordpress -pwordpress wordpress
echo "== tabelas importadas: $(compose exec -T db mariadb -uwordpress -pwordpress -N \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'wordpress'")"

echo "== home pela cópia"
STATUS=$(curl -sk --resolve lotusotec.cl:443:127.0.0.1 -o /dev/null -w '%{http_code}' https://lotusotec.cl/)
echo "https://lotusotec.cl/ -> $STATUS"

echo "== comparando com o WordPress vivo"
node "$AQUI/verificar-restauracao.mjs"

echo "== log do Apache/PHP"
FATAIS=$(compose logs web 2>&1 | grep -c 'PHP Fatal error' || true)
echo "PHP Fatal error: $FATAIS"
[ "$FATAIS" = "0" ]
echo "== ensaio passou"
