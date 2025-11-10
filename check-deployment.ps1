# PowerShell script to check if files are committed and ready for deployment

Write-Host "=== Checking Git Status ===" -ForegroundColor Cyan
git status --short

Write-Host "`n=== Checking if key files are tracked ===" -ForegroundColor Cyan
$keyFiles = @(
    "src/components/admin/AdminSidebar.jsx",
    "src/layouts/AdminLayout.jsx",
    "src/contexts/AuthContext.jsx",
    "src/components/RootRedirect.jsx",
    "src/pages/admin/Analytics.jsx",
    "src/pages/admin/AdminSettings.jsx",
    "src/pages/admin/Security.jsx",
    "src/lib/apiClient.js"
)

foreach ($file in $keyFiles) {
    if (Test-Path $file) {
        $tracked = git ls-files --error-unmatch $file 2>$null
        if ($tracked) {
            Write-Host "✓ $file is tracked" -ForegroundColor Green
        } else {
            Write-Host "✗ $file is NOT tracked - NEEDS TO BE ADDED!" -ForegroundColor Red
        }
    } else {
        Write-Host "? $file does not exist" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Checking for uncommitted changes ===" -ForegroundColor Cyan
$uncommitted = git diff --name-only
if ($uncommitted) {
    Write-Host "⚠ Uncommitted changes found:" -ForegroundColor Yellow
    $uncommitted | ForEach-Object { Write-Host "  - $_" }
} else {
    Write-Host "✓ No uncommitted changes" -ForegroundColor Green
}

Write-Host "`n=== Checking for untracked files ===" -ForegroundColor Cyan
$untracked = git ls-files --others --exclude-standard
if ($untracked) {
    Write-Host "⚠ Untracked files found:" -ForegroundColor Yellow
    $untracked | Select-Object -First 10 | ForEach-Object { Write-Host "  - $_" }
    if ($untracked.Count -gt 10) {
        Write-Host "  ... and $($untracked.Count - 10) more" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ No untracked files" -ForegroundColor Green
}

Write-Host "`n=== Recent Commits ===" -ForegroundColor Cyan
git log --oneline -5

Write-Host "`n=== Recommendations ===" -ForegroundColor Cyan
Write-Host "1. If files are not tracked, run: git add <file>" -ForegroundColor White
Write-Host "2. If there are uncommitted changes, run: git add . && git commit -m 'Your message'" -ForegroundColor White
Write-Host "3. After committing, push: git push" -ForegroundColor White
Write-Host "4. Clear build cache on your deployment platform" -ForegroundColor White
Write-Host "5. Force a new build/deployment" -ForegroundColor White

