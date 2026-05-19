<#
.SYNOPSIS
  Sincroniza CALC-7..13 a partir de scripts/data/jira-reestilizacao-issues.json (UTF-8).
#>
$ErrorActionPreference = 'Stop'
$jsonPath = Join-Path $PSScriptRoot 'data/jira-reestilizacao-issues.json'
$updateScript = Join-Path $PSScriptRoot 'jira-update-issue.ps1'

$utf8 = New-Object System.Text.UTF8Encoding $false
$json = [System.IO.File]::ReadAllText($jsonPath, $utf8)
$issues = $json | ConvertFrom-Json

foreach ($issue in $issues) {
    & $updateScript -Key $issue.key -Summary $issue.summary -Description $issue.description -Labels $issue.labels
    Start-Sleep -Milliseconds 250
}

Write-Host "`nSincronizadas $($issues.Count) issues." -ForegroundColor Cyan
