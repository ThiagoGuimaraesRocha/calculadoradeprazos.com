#!/usr/bin/env bash
# Transiciona issues Jira Cloud para Done (ou transição configurada).
# Uso no CI: ver .github/workflows/jira-transition-on-merge.yml
set -euo pipefail

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Variável $name não definida." >&2
    exit 1
  fi
}

require_env JIRA_BASE_URL
require_env JIRA_EMAIL
require_env JIRA_API_TOKEN

BASE="${JIRA_BASE_URL%/}"
AUTH="$(printf '%s:%s' "$JIRA_EMAIL" "$JIRA_API_TOKEN" | base64 -w0 2>/dev/null || printf '%s:%s' "$JIRA_EMAIL" "$JIRA_API_TOKEN" | base64)"

transition_issue() {
  local key="$1"
  local status_atual categoria

  status_atual="$(curl -fsS -H "Authorization: Basic $AUTH" -H "Accept: application/json" \
    "$BASE/rest/api/3/issue/${key}?fields=status" | jq -r '.fields.status.name')"
  categoria="$(curl -fsS -H "Authorization: Basic $AUTH" -H "Accept: application/json" \
    "$BASE/rest/api/3/issue/${key}?fields=status" | jq -r '.fields.status.statusCategory.key')"

  if [[ "$categoria" == "done" ]]; then
    echo "$key já concluída ($status_atual)"
    return 0
  fi

  local transitions_json
  transitions_json="$(curl -fsS -H "Authorization: Basic $AUTH" -H "Accept: application/json" \
    "$BASE/rest/api/3/issue/${key}/transitions")"

  local trans_id=""
  if [[ -n "${JIRA_TRANSITION_ID:-}" ]]; then
    trans_id="$(echo "$transitions_json" | jq -r --arg id "$JIRA_TRANSITION_ID" \
      '.transitions[] | select(.id == $id) | .id' | head -n1)"
  fi
  if [[ -z "$trans_id" && -n "${JIRA_TRANSITION_NAME:-}" ]]; then
    trans_id="$(echo "$transitions_json" | jq -r --arg n "$JIRA_TRANSITION_NAME" \
      '.transitions[] | select(.name == $n) | .id' | head -n1)"
  fi
  if [[ -z "$trans_id" ]]; then
    trans_id="$(echo "$transitions_json" | jq -r \
      '.transitions[] | select(.to.statusCategory.key == "done") | .id' | head -n1)"
  fi

  if [[ -z "$trans_id" ]]; then
    echo "$key: nenhuma transição para Done. Disponíveis:" >&2
    echo "$transitions_json" | jq -r '.transitions[] | "  - \(.name) (id \(.id)) -> \(.to.name)"' >&2
    return 1
  fi

  curl -fsS -X POST -H "Authorization: Basic $AUTH" -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -d "{\"transition\":{\"id\":\"$trans_id\"}}" \
    "$BASE/rest/api/3/issue/${key}/transitions" >/dev/null

  local depois
  depois="$(curl -fsS -H "Authorization: Basic $AUTH" -H "Accept: application/json" \
    "$BASE/rest/api/3/issue/${key}?fields=status" | jq -r '.fields.status.name')"
  echo "$key: $status_atual -> $depois"
}

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 CALC-1 [CALC-2 ...]" >&2
  exit 1
fi

for key in "$@"; do
  transition_issue "$key"
  sleep 0.3
done
