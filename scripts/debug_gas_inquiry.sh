#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DEBUG_DIR="${ROOT_DIR}/debug"
mkdir -p "${DEBUG_DIR}"

extract_url_from_index() {
  grep -E 'inquiryEndpoint:[[:space:]]*"https://script\.google\.com/macros/s/.+/exec"' "${ROOT_DIR}/index.html" \
    | head -1 \
    | sed -E 's/.*inquiryEndpoint:[[:space:]]*"([^"]+)".*/\1/'
}

URL="${1:-}"
if [ -z "${URL}" ]; then
  URL="$(extract_url_from_index || true)"
fi

if [ -z "${URL}" ]; then
  echo "ERROR: Apps Script URL not found. Pass it as the first argument." >&2
  echo "Usage: sh scripts/debug_gas_inquiry.sh \"https://script.google.com/macros/s/.../exec\"" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
RUN_DIR="${DEBUG_DIR}/gas_${STAMP}"
mkdir -p "${RUN_DIR}"

GET_HEADERS="${RUN_DIR}/get_headers.txt"
GET_BODY="${RUN_DIR}/get_body.txt"
POST_STEP1_HEADERS="${RUN_DIR}/post_step1_headers.txt"
POST_REDIRECT_URL="${RUN_DIR}/post_redirect_url.txt"
POST_STEP2_HEADERS="${RUN_DIR}/post_step2_headers.txt"
POST_BODY="${RUN_DIR}/post_body.txt"
SUMMARY="${RUN_DIR}/summary.txt"

echo "Debug run directory: ${RUN_DIR}"
echo "Target URL: ${URL}"

curl -sS -L -D "${GET_HEADERS}" -o "${GET_BODY}" "${URL}"

curl -sS -D "${POST_STEP1_HEADERS}" -o /dev/null "${URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "name=테스트" \
  --data-urlencode "phone=01012345678" \
  --data-urlencode "company=테스트회사" \
  --data-urlencode "email=test@example.com" \
  --data-urlencode "inquiryType=it" \
  --data-urlencode "message=문의테스트메시지입니다12345" \
  --data-urlencode "privacyConsent=true" \
  --data-urlencode "csrfToken=debug" \
  --data-urlencode "honeypot="

awk 'BEGIN{IGNORECASE=1} /^location: /{gsub("\r",""); print substr($0,11)}' "${POST_STEP1_HEADERS}" > "${POST_REDIRECT_URL}"

POST_REDIRECT="$(cat "${POST_REDIRECT_URL}" || true)"
if [ -n "${POST_REDIRECT}" ]; then
  curl -sS -D "${POST_STEP2_HEADERS}" -o "${POST_BODY}" "${POST_REDIRECT}"
else
  : > "${POST_STEP2_HEADERS}"
  echo "NO_REDIRECT_LOCATION_FOUND" > "${POST_BODY}"
fi

GET_FINAL_STATUS="$(grep '^HTTP/' "${GET_HEADERS}" | tail -1 || true)"
POST_STEP1_STATUS="$(grep '^HTTP/' "${POST_STEP1_HEADERS}" | tail -1 || true)"
POST_STEP2_STATUS="$(grep '^HTTP/' "${POST_STEP2_HEADERS}" | tail -1 || true)"

{
  echo "=== GAS Inquiry Debug Summary ==="
  echo "Timestamp: ${STAMP}"
  echo "URL: ${URL}"
  echo
  echo "[GET] final status"
  echo "${GET_FINAL_STATUS}"
  echo
  echo "[POST] step1 status (exec URL)"
  echo "${POST_STEP1_STATUS}"
  echo
  echo "[POST] redirect URL"
  cat "${POST_REDIRECT_URL}" || true
  echo
  echo "[POST] step2 status (googleusercontent URL)"
  echo "${POST_STEP2_STATUS}"
  echo
  echo "[GET BODY head]"
  head -20 "${GET_BODY}"
  echo
  echo "[POST BODY head]"
  head -20 "${POST_BODY}"
  echo
  echo "[POST BODY JSON grep]"
  grep -Eo '\{"ok":[^}]+\}' "${POST_BODY}" | head -5 || true
} > "${SUMMARY}"

cat "${SUMMARY}"

echo
echo "Saved files:"
echo "  ${GET_HEADERS}"
echo "  ${GET_BODY}"
echo "  ${POST_STEP1_HEADERS}"
echo "  ${POST_REDIRECT_URL}"
echo "  ${POST_STEP2_HEADERS}"
echo "  ${POST_BODY}"
echo "  ${SUMMARY}"
