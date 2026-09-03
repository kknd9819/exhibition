$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot 'backend'
Push-Location -LiteralPath $backendRoot
try {
  .\mvnw.cmd -q test
  if ($LASTEXITCODE -ne 0) { throw '后端测试失败。' }
  .\mvnw.cmd -q -DskipTests package
  if ($LASTEXITCODE -ne 0) { throw '后端打包失败。' }
} finally { Pop-Location }
Push-Location -LiteralPath $projectRoot
try {
  pnpm lint
  if ($LASTEXITCODE -ne 0) { throw '前端 lint 失败。' }
  pnpm build
  if ($LASTEXITCODE -ne 0) { throw '前端构建失败。' }
} finally { Pop-Location }
Write-Host '前后端发布前检查通过。'
