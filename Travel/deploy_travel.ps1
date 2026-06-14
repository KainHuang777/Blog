param(
    [string]$CommitMessage = ""
)

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# 1. Stage Travel 目錄
git add Travel/

# 2. Commit
if ($CommitMessage -eq "") {
    $Date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $CommitMessage = "Travel update: $Date"
}
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    exit 0
}

# 3. Push
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDeployed! Netlify auto-deploy triggered." -ForegroundColor Green
} else {
    Write-Host "`nPush failed. Check your connection." -ForegroundColor Red
}
