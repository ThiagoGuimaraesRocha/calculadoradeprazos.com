<#
.SYNOPSIS
  Cria cartões Jira (CALC) de comarcas/municípios a partir de scripts/data/jira-comarcas-municipios-issues.json.

.EXAMPLE
  . .\scripts\jira-load-env.ps1
  .\scripts\jira-create-comarcas-municipios-issues.ps1
#>
$ErrorActionPreference = 'Stop'
$jsonPath = Join-Path $PSScriptRoot 'data/jira-comarcas-municipios-issues.json'
$createScript = Join-Path $PSScriptRoot 'jira-create-issue.ps1'

$utf8 = New-Object System.Text.UTF8Encoding $false
$json = [System.IO.File]::ReadAllText($jsonPath, $utf8)
$issues = $json | ConvertFrom-Json

$created = @()
foreach ($issue in $issues) {
    $issueType = if ($issue.issueType) { $issue.issueType } else { 'Tarefa' }
    try {
        $result = & $createScript -Summary $issue.summary -Description $issue.description -IssueType $issueType -Labels $issue.labels
    }
    catch {
        if ($issueType -eq 'Spike') {
            Write-Host "Tipo Spike indisponível; recriando como Tarefa: $($issue.summary)" -ForegroundColor Yellow
            $result = & $createScript -Summary $issue.summary -Description $issue.description -IssueType 'Tarefa' -Labels $issue.labels
        }
        else { throw }
    }
    $created += $result.key
    Start-Sleep -Milliseconds 400
}

Write-Host "`nTotal criadas: $($created.Count)" -ForegroundColor Cyan
$created | ForEach-Object { Write-Host "  $_" }
