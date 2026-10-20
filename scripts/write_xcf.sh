#!/usr/bin/env bash
# Write the GAS connector (<app>.xcf) for the demo program.
#   write_xcf.sh <gas appdata/app dir> <bin dir> <fgldir> <app id> <module> [gbc customization] [program argument]
# The optional program argument becomes arg_val(1): the language of the connector.
set -euo pipefail
APPDIR="$1"; BIN="$2"; FGLDIR="$3"; APP="$4"; MODULE="$5"; GBC="${6:-}"; ARG="${7:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE="$HERE/../gas/app.xcf.in"
GBC_LINE=""
[ -n "$GBC" ] && GBC_LINE="    <GBC>$GBC</GBC>
"
PARAMS_LINE=""
[ -n "$ARG" ] && PARAMS_LINE="    <PARAMETERS>
      <PARAMETER>$ARG</PARAMETER>
    </PARAMETERS>
"
mkdir -p "$APPDIR"
# awk instead of sed so the multi-line GBC element needs no escaping
awk -v bin="$BIN" -v fgldir="$FGLDIR" -v app="$APP" -v module="$MODULE" -v gbc="$GBC_LINE" -v params="$PARAMS_LINE" '
  { gsub(/@BIN@/, bin); gsub(/@FGLDIR@/, fgldir); gsub(/@APP@/, app); gsub(/@MODULE@/, module) }
  /^@GBC@/ { printf "%s", gbc; next }
  /^@PARAMS@/ { printf "%s", params; next }
  { print }
' "$TEMPLATE" > "$APPDIR/$APP.xcf"
echo "   wrote $APPDIR/$APP.xcf -> $MODULE"
