<#
.SYNOPSIS
  Cria cartões Jira (CALC) para reestilização a partir de scripts/data/jira-reestilizacao-issues.json.

.EXAMPLE
  . .\scripts\jira-load-env.ps1
  .\scripts\jira-create-reestilizacao-issues.ps1
#>
$ErrorActionPreference = 'Stop'
$jsonPath = Join-Path $PSScriptRoot 'data/jira-reestilizacao-issues.json'
$createScript = Join-Path $PSScriptRoot 'jira-create-issue.ps1'

$utf8 = New-Object System.Text.UTF8Encoding $false
$json = [System.IO.File]::ReadAllText($jsonPath, $utf8)
$issues = $json | ConvertFrom-Json

$created = @()
foreach ($issue in $issues) {
    if ($issue.key) {
        Write-Host "Ignorando $($issue.key) (ja existe; use jira-sync-reestilizacao-from-json.ps1)." -ForegroundColor Yellow
        continue
    }
    $result = & $createScript -Summary $issue.summary -Description $issue.description -Labels $issue.labels
    $created += $result.key
    Start-Sleep -Milliseconds 300
}

Write-Host "`nTotal criadas: $($created.Count)" -ForegroundColor Cyan
$created | ForEach-Object { Write-Host "  $_" }
