# PowerShell script to type-check all packages directly (bypasses turbo-pnpm subprocess issue)
# Usage: .\type-check.ps1

$packages = @(
    "packages/db",
    "packages/shared-lib",
    "packages/realtime",
    "packages/auth",
    "apps/web",
    "apps/mobile"
)

$tsc = "node_modules/typescript/bin/tsc"
$failed = @()
$passed = @()

foreach ($pkg in $packages) {
    Write-Host "`n=== Type-checking $pkg ===" -ForegroundColor Cyan
    Push-Location $pkg

    $output = & node "../../$tsc" --noEmit 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        Write-Host "✓ PASS" -ForegroundColor Green
        $passed += $pkg
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red
        Write-Host $output
        $failed += $pkg
    }

    Pop-Location
}

Write-Host "`n`n=== Summary ===" -ForegroundColor Yellow
Write-Host "Passed: $($passed.Count)/$($packages.Count)"
if ($failed.Count -gt 0) {
    Write-Host "Failed: $($failed -join ', ')" -ForegroundColor Red
    exit 1
} else {
    Write-Host "All packages passed!" -ForegroundColor Green
    exit 0
}
