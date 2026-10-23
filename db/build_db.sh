#!/usr/bin/env bash
# Create the PostgreSQL database if it does not exist, then apply schema.sql and seed.sql.
# Idempotent. Connects as the current OS user through the local socket (peer authentication),
# the same way the Genero runtime does with dbi.database.<name>.source = "<name>".
#   build_db.sh [dbname] [--reset]     --reset drops the database first
set -euo pipefail
DB="${1:-arc_demo}"
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ "${2:-}" = "--reset" ]; then
  dropdb --if-exists "$DB"
fi
if ! psql -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname = '$DB'" 2>/dev/null | grep -q 1; then
  createdb -E UTF8 -T template0 --locale=es_ES.UTF-8 "$DB"
  echo "   created database $DB"
fi
PGOPTIONS='-c client_min_messages=warning' psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$HERE/schema.sql" -f "$HERE/seed.sql"
echo "   database $DB ready: $(psql -d "$DB" -Atc 'SELECT count(*) FROM paises') rows in paises"
