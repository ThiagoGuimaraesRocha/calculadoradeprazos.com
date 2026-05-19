<#
.SYNOPSIS
  Cria cartões Jira (CALC) do piloto combos/cálculo a partir de scripts/data/jira-combos-piloto-issues.json.

.EXAMPLE
  . .\scripts\jira-load-env.ps1
  .\scripts\jira-create-combos-piloto-issues.ps1
#>
$ErrorActionPreference = 'Stop'
$jsonPath = Join-Path $PSScriptRoot 'data/jira-combos-piloto-issues.json'
$createScript = Join-Path $PSScriptRoot 'jira-create-issue.ps1'

$utf8 = New-Object System.Text.UTF8Encoding $false
$json = [System.IO.File]::ReadAllText($jsonPath, $utf8)
$issues = $json | ConvertFrom-Json

$created = @()
foreach ($issue in $issues) {
    $result = & $createScript -Summary $issue.summary -Description $issue.description -Labels $issue.labels
    $created += $result.key
    Start-Sleep -Milliseconds 400
}

Write-Host "`nTotal criadas: $($created.Count)" -ForegroundColor Cyan
$created | ForEach-Object { Write-Host "  $_" }
