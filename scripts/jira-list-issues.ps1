<#
.SYNOPSIS
  Lista issues do Jira Cloud via JQL (padrão: projeto CALC).

.DESCRIPTION
  Requer variáveis de ambiente JIRA_BASE_URL, JIRA_EMAIL e JIRA_API_TOKEN.
  Usa POST /rest/api/3/search/jql (Jira Cloud API v3).
  Token: https://id.atlassian.com/manage-profile/security/api-tokens

.PARAMETER Jql
  Consulta JQL. Padrão: project = CALC ORDER BY created DESC

.PARAMETER MaxResults
  Máximo de issues por página da API (1–100). Padrão: 50.

.PARAMETER FetchAll
  Se definido, busca todas as páginas até acabar ou atingir o limite da API.

.EXAMPLE
  $env:JIRA_BASE_URL = "https://acme.atlassian.net"
  $env:JIRA_EMAIL = "dev@acme.com"
  $env:JIRA_API_TOKEN = "***"
  .\scripts\jira-list-issues.ps1

.EXAMPLE
  .\scripts\jira-list-issues.ps1 -Jql "project = CALC AND status != Done" -MaxResults 100
#>
[CmdletBinding()]
param(
    [string]$Jql = 'project = CALC ORDER BY created DESC',
    [ValidateRange(1, 100)]
    [int]$MaxResults = 50,
    [switch]$FetchAll
)

$ErrorActionPreference = 'Stop'

function Require-Env([string]$name) {
    $v = [Environment]::GetEnvironmentVariable($name, 'Process')
    if (-not $v) { throw "Defina `$env:$name (veja scripts/jira.env.example)." }
    return $v
}

function Get-FieldName {
    param($Field)
    if ($null -eq $Field) { return '-' }
    if ($Field.PSObject.Properties['name']) { return $Field.name }
    if ($Field.PSObject.Properties['displayName']) { return $Field.displayName }
    return [string]$Field
}

$base = (Require-Env 'JIRA_BASE_URL').TrimEnd('/')
$email = Require-Env 'JIRA_EMAIL'
$token = Require-Env 'JIRA_API_TOKEN'

$pair = "${email}:${token}"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($pair)
$basic = [Convert]::ToBase64String($bytes)

$headers = @{
    Authorization = "Basic $basic"
    Accept        = 'application/json'
}

$uri = "$base/rest/api/3/search/jql"
Write-Host "POST $uri" -ForegroundColor DarkGray
Write-Host "JQL: $Jql" -ForegroundColor DarkGray

$allIssues = @()
$nextPageToken = $null
$page = 0

do {
    $page++
    $body = @{
        jql        = $Jql
        maxResults = $MaxResults
        fields     = @('summary', 'status', 'issuetype', 'priority', 'assignee')
    }
    if ($nextPageToken) {
        $body['nextPageToken'] = $nextPageToken
    }

    $jsonBody = $body | ConvertTo-Json -Compress
    $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $jsonBody -ContentType 'application/json; charset=utf-8'

    if ($response.issues) {
        $allIssues += $response.issues
    }

    $nextPageToken = $response.nextPageToken
    $hasMore = $FetchAll -and $nextPageToken
} while ($hasMore)

if ($allIssues.Count -eq 0) {
    Write-Host "`nNenhuma issue encontrada para o JQL informado." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nIssues ($($allIssues.Count)):" -ForegroundColor Cyan
Write-Host ("{0,-12} | {1,-10} | {2,-12} | {3,-8} | {4} | {5}" -f 'Key', 'Tipo', 'Status', 'Prior.', 'Responsável', 'Resumo') -ForegroundColor DarkCyan

$allIssues | ForEach-Object {
    $key = $_.key
    $f = $_.fields
    $tipo = Get-FieldName $f.issuetype
    $status = Get-FieldName $f.status
    $prio = Get-FieldName $f.priority
    $assignee = Get-FieldName $f.assignee
    $summary = if ($f.summary) { $f.summary } else { '-' }

    Write-Host ("{0,-12} | {1,-10} | {2,-12} | {3,-8} | {4} | {5}" -f $key, $tipo, $status, $prio, $assignee, $summary)
}

if (-not $FetchAll -and $nextPageToken) {
    Write-Host "`nHá mais resultados. Use -FetchAll para buscar todas as páginas." -ForegroundColor Yellow
}
