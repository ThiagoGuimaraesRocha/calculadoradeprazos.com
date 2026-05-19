<#
.SYNOPSIS
  Transiciona issues do Jira para um status alvo (por nome da transição ou id).

.PARAMETER Keys
  Chaves das issues (ex.: CALC-14, CALC-15).

.PARAMETER TransitionName
  Nome da transição (ex.: "Itens concluídos"). Padrão para fechar tarefas do CALC.

.EXAMPLE
  . .\scripts\jira-load-env.ps1
  .\scripts\jira-transition-issues.ps1 -Keys CALC-14,CALC-15,CALC-16
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string[]]$Keys,

    [string]$TransitionName = '',

    [string]$TransitionId = '31'
)

$ErrorActionPreference = 'Stop'

function Require-Env([string]$name) {
    $v = [Environment]::GetEnvironmentVariable($name, 'Process')
    if (-not $v) { throw "Defina `$env:$name (rode scripts/jira-load-env.ps1)." }
    return $v
}

$base = (Require-Env 'JIRA_BASE_URL').TrimEnd('/')
$email = Require-Env 'JIRA_EMAIL'
$token = Require-Env 'JIRA_API_TOKEN'
$pair = "${email}:${token}"
$basic = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
$hGet = @{
    Authorization = "Basic $basic"
    Accept        = 'application/json'
}
$hPost = @{
    Authorization = "Basic $basic"
    Accept        = 'application/json'
}

foreach ($key in $Keys) {
    $issue = Invoke-RestMethod -Uri "$base/rest/api/3/issue/${key}?fields=status" -Headers $hGet
    $statusAtual = $issue.fields.status.name
    $categoria = $issue.fields.status.statusCategory.key

    if ($categoria -eq 'done') {
        Write-Host "$key ja concluida ($statusAtual)" -ForegroundColor Yellow
        continue
    }

    $transicoes = Invoke-RestMethod -Uri "$base/rest/api/3/issue/${key}/transitions" -Headers $hGet
    $transicao = $null
    if ($TransitionId) {
        $transicao = $transicoes.transitions | Where-Object { $_.id -eq $TransitionId } | Select-Object -First 1
    }
    if (-not $transicao -and $TransitionName) {
        $transicao = $transicoes.transitions | Where-Object { $_.name -eq $TransitionName } | Select-Object -First 1
    }
    if (-not $transicao) {
        $transicao = $transicoes.transitions | Where-Object { $_.to.statusCategory.key -eq 'done' } | Select-Object -First 1
    }

    if (-not $transicao) {
        Write-Host "$key sem transicao para concluir. Disponiveis:" -ForegroundColor Red
        $transicoes.transitions | ForEach-Object { Write-Host "  - $($_.name) (id $($_.id)) -> $($_.to.name)" }
        continue
    }

    $bodyJson = (@{ transition = @{ id = $transicao.id } } | ConvertTo-Json -Compress)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
    Invoke-RestMethod -Uri "$base/rest/api/3/issue/${key}/transitions" -Headers $hPost -Method Post `
        -Body $bytes -ContentType 'application/json; charset=utf-8' | Out-Null

    $depois = Invoke-RestMethod -Uri "$base/rest/api/3/issue/${key}?fields=status" -Headers $hGet
    Write-Host "$key : $statusAtual -> $($depois.fields.status.name)" -ForegroundColor Green
    Start-Sleep -Milliseconds 300
}
