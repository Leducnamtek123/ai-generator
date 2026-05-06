Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Push-Location (Join-Path $PSScriptRoot "..\frontend")
docker build -t ai-generator-web:local .
Pop-Location
