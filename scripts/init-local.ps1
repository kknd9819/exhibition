$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot 'backend'

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  throw '未找到 Java。请安装 JDK 8，并设置 JAVA_HOME。'
}
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
  throw '当前环境只有 JRE。请安装 JDK 8，并让 JAVA_HOME 指向 JDK 根目录。'
}
if (-not (Test-Path -LiteralPath (Join-Path $backendRoot 'mvnw.cmd'))) {
  throw '缺少 backend\mvnw.cmd，无法构建 Spring Boot 后端。'
}

$mysqlHost = if ($env:MYSQL_HOST) { $env:MYSQL_HOST } else { '127.0.0.1' }
$mysqlPort = if ($env:MYSQL_PORT) { [int]$env:MYSQL_PORT } else { 3306 }
$connection = Test-NetConnection -ComputerName $mysqlHost -Port $mysqlPort -WarningAction SilentlyContinue
if (-not $connection.TcpTestSucceeded) {
  throw "MySQL 8 尚未监听 ${mysqlHost}:${mysqlPort}。可在 backend 目录执行 docker compose up -d mysql。"
}

Push-Location -LiteralPath $backendRoot
try {
  .\mvnw.cmd -q -DskipTests package
  if ($LASTEXITCODE -ne 0) { throw 'Spring Boot 后端构建失败。' }
} finally {
  Pop-Location
}

Write-Host 'JDK 8、MySQL 8 和 Spring Boot 后端检查通过。'
