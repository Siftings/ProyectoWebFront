#!/bin/sh
set -eu

: "${API_URL:?Falta API_URL (por ejemplo http://<ip-vm-back>:8080/api/v1)}"

case "$API_URL" in
  *\"*|*\\*) echo "API_URL no puede llevar comillas dobles ni barras invertidas" >&2; exit 1 ;;
esac

cat > /usr/share/nginx/html/config.json <<JSON
{
  "apiUrl": "${API_URL}"
}
JSON
