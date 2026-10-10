#!/usr/bin/env sh
# Arma una carpeta lista para un Hugging Face Space de tipo Docker.
# Uso: sh scripts/build-hf-space.sh <carpeta-destino>
set -eu
OUT="${1:?Indica la carpeta de destino}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$OUT"
# Copia el código (sin node_modules ni dist) y la imagen Docker.
for f in package.json package-lock.json tsconfig.base.json Dockerfile .dockerignore; do cp "$ROOT/$f" "$OUT/"; done
for d in shared server client; do
  rm -rf "$OUT/$d"
  mkdir -p "$OUT/$d"
  (cd "$ROOT/$d" && tar --exclude=node_modules --exclude=dist -cf - .) | (cd "$OUT/$d" && tar -xf -)
done
# README con la cabecera YAML que Hugging Face usa para configurar el Space.
cat > "$OUT/README.md" <<'MD'
---
title: Tensión Global
emoji: ☢️
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 8080
pinned: false
short_description: Juego de estrategia de la Guerra Fría al orden multipolar
---

# Tensión Global

Juego web de estrategia para dos bandos (Occidente / Bloque Oriental), 1947–2026: un jugador contra la IA u online 1 contra 1.
El código fuente y la documentación completa están en el repositorio de GitHub del proyecto (carpeta `tension-global/`).
MD
echo "Space preparado en $OUT"
