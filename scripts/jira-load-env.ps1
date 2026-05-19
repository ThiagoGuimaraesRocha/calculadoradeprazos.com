# Carrega scripts/jira.env (não versionado) para a sessão atual.
$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot 'jira.env'
if (-not (Test-Path $envFile)) {
    throw "Arquivo não encontrado: $envFile (copie de scripts/jira.env.example)."
}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        if ($name) {
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}
