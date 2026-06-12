#!/bin/bash
# Type-check summary for all packages

TSC="node node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/bin/tsc"
PACKAGES=("packages/db" "packages/shared-lib" "packages/realtime" "packages/auth" "apps/mobile" "apps/web")

echo "=== CRM Monorepo Type-Check Summary ==="
echo ""

PASSED=0
FAILED=0

for pkg in "${PACKAGES[@]}"; do
  printf "%-30s " "$pkg"
  if $TSC --project "$pkg" --noEmit 2>&1 | grep -q "error TS"; then
    echo "❌ FAILED"
    ((FAILED++))
  else
    echo "✅ PASSED"
    ((PASSED++))
  fi
done

echo ""
echo "=== Results: $PASSED passed, $FAILED failed ==="

if [ $FAILED -eq 0 ]; then
  echo "✨ All packages type-check clean!"
  exit 0
else
  exit 1
fi
