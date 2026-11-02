#!/bin/sh
set -eu

: "${API_URL:?Falta API_URL (por ejemplo http://<ip-vm-back>:8080/api/v1)}"
: "${USUARIO_FIJO_EMAIL:?Falta USUARIO_FIJO_EMAIL}"
: "${USUARIO_FIJO_ROL:?Falta USUARIO_FIJO_ROL (ADMINISTRADOR, EDITOR o SOLO_LECTURA)}"

case "$USUARIO_FIJO_ROL" in
  ADMINISTRADOR|EDITOR|SOLO_LECTURA) ;;
  *) echo "USUARIO_FIJO_ROL no es válido: $USUARIO_FIJO_ROL (ADMINISTRADOR, EDITOR o SOLO_LECTURA)" >&2; exit 1 ;;
esac

for valor in "$API_URL" "$USUARIO_FIJO_EMAIL"; do
  case "$valor" in
    *\"*|*\\*) echo "API_URL y USUARIO_FIJO_EMAIL no pueden llevar comillas dobles ni barras invertidas" >&2; exit 1 ;;
  esac
done

cat > /usr/share/nginx/html/config.json <<JSON
{
  "apiUrl": "${API_URL}",
  "usuarioFijo": {
    "email": "${USUARIO_FIJO_EMAIL}",
    "rolAcceso": "${USUARIO_FIJO_ROL}"
  }
}
JSON
