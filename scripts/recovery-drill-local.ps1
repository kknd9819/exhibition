param([Parameter(Mandatory=$true)][string]$BackupDirectory)
$ErrorActionPreference = 'Stop'
$resolved = Resolve-Path -LiteralPath $BackupDirectory
$sqlFile = Join-Path $resolved 'exhibition.sql'
$manifestFile = Join-Path $resolved 'manifest.json'
if (-not (Test-Path -LiteralPath $sqlFile) -or -not (Test-Path -LiteralPath $manifestFile)) { throw '备份目录缺少 exhibition.sql 或 manifest.json。' }
$manifest = Get-Content -LiteralPath $manifestFile -Raw | ConvertFrom-Json
$actual = (Get-FileHash -LiteralPath $sqlFile -Algorithm SHA256).Hash
if ($actual -ne $manifest.sha256) { throw '备份文件 SHA-256 校验失败。' }
if ((Get-Item -LiteralPath $sqlFile).Length -le 0) { throw '备份 SQL 文件为空。' }
Write-Host "备份完整性检查通过：$($manifest.file)，$($manifest.bytes) 字节。"
Write-Host '恢复到隔离 MySQL 实例时，请使用独立数据库名并执行该 SQL 文件。'
