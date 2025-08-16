#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="$ROOT_DIR/ssl"
mkdir -p "$CERT_DIR"

# Domains you want for local dev (add your machine hostname if desired)
DOMAINS="localhost 127.0.0.1 ::1 ssc.local"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert not found. Install from https://github.com/FiloSottile/mkcert"
  exit 1
fi

mkcert -install
CRT_FILE="$CERT_DIR/dev-cert.pem"
KEY_FILE="$CERT_DIR/dev-key.pem"
PFX_FILE="$CERT_DIR/dev-cert.pfx"

mkcert -cert-file "$CRT_FILE" -key-file "$KEY_FILE" $DOMAINS

# Generate PFX (empty password) for Kestrel if openssl available
if command -v openssl >/dev/null 2>&1; then
  openssl pkcs12 -export -out "$PFX_FILE" -inkey "$KEY_FILE" -in "$CRT_FILE" -passout pass:""
  echo "Generated PFX for Kestrel: $PFX_FILE"
else
  echo "openssl not found; skipping PFX generation (backend will fall back to HTTP)."
fi

echo "Dev certificates generated in $CERT_DIR (PEM + optional PFX)."