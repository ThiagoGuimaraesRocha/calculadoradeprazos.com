<#
.SYNOPSIS
  Atualiza summary, description e labels de uma issue existente.

.PARAMETER Key
  Chave da issue (ex.: CALC-7).

.PARAMETER Summary
.PARAMETER Description
  Markdown convertido para ADF (mesma regra de jira-create-issue.ps1).

.PARAMETER Labels
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Key,

    [string]$Summary,
    [string]$Description,
    [string[]]$Labels
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
    return @{ type = 'doc'; version = 1; content = $content }
}

$base = (Require-Env 'JIRA_BASE_URL').TrimEnd('/')
$email = Require-Env 'JIRA_EMAIL'
$token = Require-Env 'JIRA_API_TOKEN'
$pair = "${email}:${token}"
$basic = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
$headers = @{ Authorization = "Basic $basic"; Accept = 'application/json' }

$fields = @{}
if ($Summary) { $fields['summary'] = $Summary }
if ($Description) { $fields['description'] = ConvertTo-Adf $Description }
if ($Labels) { $fields['labels'] = $Labels }

if ($fields.Count -eq 0) { throw 'Informe Summary, Description ou Labels.' }

$bodyJson = @{ fields = $fields } | ConvertTo-Json -Depth 20 -Compress
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
$uri = "$base/rest/api/3/issue/$Key"
Invoke-RestMethod -Uri $uri -Headers $headers -Method Put -Body $bodyBytes -ContentType 'application/json; charset=utf-8' | Out-Null
Write-Host "Atualizada: $Key" -ForegroundColor Green
