<#
.SYNOPSIS
  Cria uma issue no Jira Cloud (projeto CALC por padrão).

.DESCRIPTION
  Requer JIRA_BASE_URL, JIRA_EMAIL e JIRA_API_TOKEN (veja scripts/jira-load-env.ps1).
  Descrição em Markdown simples é convertida para ADF (parágrafos e headings ##).

.PARAMETER Summary
  Título da issue (campo Summary).

.PARAMETER Description
  Corpo em Markdown: linhas ## viram headings; demais linhas viram parágrafos.

.PARAMETER IssueType
  Nome do tipo no Jira (padrão: Tarefa).

.PARAMETER ProjectKey
  Chave do projeto (padrão: CALC).

.PARAMETER Labels
  Rótulos opcionais.

.EXAMPLE
  . .\scripts\jira-load-env.ps1
  .\scripts\jira-create-issue.ps1 -Summary "Exemplo" -Description "## Contexto`nTexto."
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Summary,

    [Parameter(Mandatory)]
    [string]$Description,

    [string]$IssueType = 'Tarefa',
    [string]$ProjectKey = 'CALC',
    [string[]]$Labels = @()
)

$ErrorActionPreference = 'Stop'

function Require-Env([string]$name) {
    $v = [Environment]::GetEnvironmentVariable($name, 'Process')
    if (-not $v) { throw "Defina `$env:$name (rode scripts/jira-load-env.ps1)." }
    return $v
}

function ConvertTo-Adf([string]$markdown) {
    $content = [System.Collections.Generic.List[object]]::new()
    foreach ($line in ($markdown -split "`r?`n")) {
        if ($line -match '^\s*$') { continue }
        if ($line -match '^##\s+(.+)$') {
            $content.Add(@{
                    type    = 'heading'
                    attrs   = @{ level = 2 }
                    content = @(@{ type = 'text'; text = $matches[1].Trim() })
                })
            continue
        }
        if ($line -match '^###\s+(.+)$') {
            $content.Add(@{
                    type    = 'heading'
                    attrs   = @{ level = 3 }
                    content = @(@{ type = 'text'; text = $matches[1].Trim() })
                })
            continue
        }
        if ($line -match '^-\s+\[\s*\]\s+(.+)$') {
            $content.Add(@{
                    type    = 'bulletList'
                    content = @(
                        @{
                            type    = 'listItem'
                            content = @(
                                @{
                                    type    = 'paragraph'
                                    content = @(@{ type = 'text'; text = $matches[1].Trim() })
                                }
                            )
                        }
                    )
                })
            continue
        }
        $content.Add(@{
                type    = 'paragraph'
                content = @(@{ type = 'text'; text = $line })
            })
    }
    return @{
        type    = 'doc'
        version = 1
        content = $content
    }
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

$fields = @{
    project     = @{ key = $ProjectKey }
    summary     = $Summary
    issuetype   = @{ name = $IssueType }
    description = ConvertTo-Adf $Description
}

if ($Labels.Count -gt 0) {
    $fields['labels'] = $Labels
}

$bodyJson = @{ fields = $fields } | ConvertTo-Json -Depth 20 -Compress
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)

$uri = "$base/rest/api/3/issue"
$response = Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $bodyBytes -ContentType 'application/json; charset=utf-8'

Write-Host "Criada: $($response.key) - $Summary" -ForegroundColor Green
return $response
