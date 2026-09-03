param([string]$OutputRoot = '.\outputs\backups')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$dump = Get-Command mysqldump -ErrorAction SilentlyContinue
if (-not $dump) { throw '未找到 mysqldump，请安装 MySQL 8 客户端工具。' }
$hostName = if ($env:MYSQL_HOST) { $env:MYSQL_HOST } else { '127.0.0.1' }
$port = if ($env:MYSQL_PORT) { $env:MYSQL_PORT } else { '3306' }
$user = if ($env:MYSQL_USER) { $env:MYSQL_USER } else { 'exhibition' }
$database = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { 'exhibition' }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $OutputRoot "mysql-backup-$stamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$sqlFile = Join-Path $backupDir 'exhibition.sql'
& $dump.Source --host=$hostName --port=$port --user=$user --single-transaction --routines --triggers --default-character-set=utf8mb4 --result-file=$sqlFile $database
if ($LASTEXITCODE -ne 0) { throw 'MySQL 备份失败。' }
$hash = Get-FileHash -LiteralPath $sqlFile -Algorithm SHA256
@{ createdAt = (Get-Date).ToString('o'); database = $database; file = 'exhibition.sql'; sha256 = $hash.Hash; bytes = (Get-Item $sqlFile).Length } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $backupDir 'manifest.json') -Encoding utf8
Write-Host "备份完成：$backupDir"
