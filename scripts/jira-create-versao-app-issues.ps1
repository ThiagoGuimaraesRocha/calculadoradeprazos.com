<#
.SYNOPSIS
  Cria cartões Jira (CALC) de versionamento da app a partir de scripts/data/jira-versao-app-issues.json.

.EXAMPLE
  . .\scripts\jira-load-env.ps1
  .\scripts\jira-create-versao-app-issues.ps1
#>
$ErrorActionPreference = 'Stop'
$jsonPath = Join-Path $PSScriptRoot 'data/jira-versao-app-issues.json'
$createScript = Join-Path $PSScriptRoot 'jira-create-issue.ps1'

$utf8 = New-Object System.Text.UTF8Encoding $false
$json = [System.IO.File]::ReadAllText($jsonPath, $utf8)
$issues = $json | ConvertFrom-Json

$created = @()
foreach ($issue in $issues) {
    $issueType = if ($issue.issueType) { $issue.issueType } else { 'Tarefa' }
    $result = & $createScript -Summary $issue.summary -Description $issue.description -IssueType $issueType -Labels $issue.labels
    $created += $result.key
    Start-Sleep -Milliseconds 400
}

Write-Host "`nTotal criadas: $($created.Count)" -ForegroundColor Cyan
$created | ForEach-Object { Write-Host "  $_" }
