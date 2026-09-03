$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot 'backend'
$stdoutLog = Join-Path $projectRoot '.local-backend.stdout.log'
$stderrLog = Join-Path $projectRoot '.local-backend.stderr.log'

& (Join-Path $PSScriptRoot 'init-local.ps1')

$backend = Start-Process -FilePath (Join-Path $backendRoot 'mvnw.cmd') `
  -ArgumentList @('-q', 'spring-boot:run') `
  -WorkingDirectory $backendRoot `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -WindowStyle Hidden `
  -PassThru

try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt += 1) {
    if ($backend.HasExited) { throw "Spring Boot 启动失败，请查看 $stderrLog" }
    try {
      $response = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/api/system/ping' -TimeoutSec 2
      if ($response.status -eq 'UP') { $ready = $true; break }
    } catch {}
    Start-Sleep -Seconds 1
  }
  if (-not $ready) { throw 'Spring Boot 在60秒内未就绪。' }
  Set-Location -LiteralPath $projectRoot
  pnpm dev:lan
} finally {
  if (-not $backend.HasExited) { Stop-Process -Id $backend.Id }
}
