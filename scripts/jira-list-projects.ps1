<#
.SYNOPSIS
 Lista projetos Jira Cloud acessíveis ao usuário da API (inclui CALC quando existir e houver permissão).

.DESCRIPTION
 Requer variáveis de ambiente JIRA_BASE_URL, JIRA_EMAIL e JIRA_API_TOKEN.
 Token: https://id.atlassian.com/manage-profile/security/api-tokens

.EXAMPLE
  $env:JIRA_BASE_URL = "https://acme.atlassian.net"
  $env:JIRA_EMAIL = "dev@acme.com"
  $env:JIRA_API_TOKEN = "***"
  .\scripts\jira-list-projects.ps1
#>
$ErrorActionPreference = 'Stop'

function Require-Env([string]$name) {
    $v = [Environment]::GetEnvironmentVariable($name, 'Process')
    if (-not $v) { throw "Defina `$env:$name (veja scripts/jira.env.example)." }
    return $v
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

$uri = "$base/rest/api/3/project"
Write-Host "GET $uri" -ForegroundColor DarkGray

$projects = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get

Write-Host "`nProjetos (key | name | id):" -ForegroundColor Cyan
$projects | Sort-Object key | ForEach-Object {
    Write-Host ("  {0,-8} | {1} | {2}" -f $_.key, $_.name, $_.id)
}

$calc = $projects | Where-Object { $_.key -eq 'CALC' }
if ($calc) {
    Write-Host "`nProjeto CALC encontrado: $($calc.name) (id $($calc.id))" -ForegroundColor Green
}
else {
    Write-Host "`nNenhum projeto com key CALC nesta conta/resposta." -ForegroundColor Yellow
}
