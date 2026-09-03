param(
  [string]$BaseUrl = 'http://localhost:3000'
)

$ErrorActionPreference = 'Stop'

$checks = @(
  @{ Name = '登录入口'; Path = '/login'; Expected = 200 },
  @{ Name = '公开门户'; Path = '/exhibition/2026-morocco'; Expected = 200 },
  @{ Name = '公开议程'; Path = '/exhibition/2026-morocco/agenda'; Expected = 200 },
  @{ Name = '公开新闻'; Path = '/exhibition/2026-morocco/news'; Expected = 200 },
  @{ Name = '公开资料'; Path = '/exhibition/2026-morocco/documents'; Expected = 200 },
  @{ Name = '公开企业目录'; Path = '/exhibition/2026-morocco/exhibitors'; Expected = 200 },
  @{ Name = '公开供需洽谈'; Path = '/exhibition/2026-morocco/matching'; Expected = 200 },
  @{ Name = '公开报名'; Path = '/exhibition/2026-morocco/register/reg-main'; Expected = 200 }
  @{ Name = '公众账号登录'; Path = '/exhibition/2026-morocco/login'; Expected = 200 }
  @{ Name = '公众个人中心门禁'; Path = '/exhibition/2026-morocco/me'; Expected = 200 }
  @{ Name = '企业账号登录'; Path = '/company-workspace/login'; Expected = 200 }
  @{ Name = '企业工作台门禁'; Path = '/company-workspace'; Expected = 200 }
  @{ Name = '现场签到权限页'; Path = '/checkin'; Expected = 200 }
  @{ Name = '集团数据资产门禁'; Path = '/data-assets'; Expected = 200 }
)

$failures = 0
foreach ($check in $checks) {
  try {
    $response = Invoke-WebRequest -Uri ($BaseUrl + $check.Path) -MaximumRedirection 0
    $ok = $response.StatusCode -eq $check.Expected
    if (-not $ok) { $failures += 1 }
    Write-Host ('[{0}] {1} {2} -> {3}' -f $(if ($ok) { 'PASS' } else { 'FAIL' }), $check.Name, $check.Path, $response.StatusCode)
  } catch {
    $failures += 1
    Write-Host ('[FAIL] {0} {1} -> {2}' -f $check.Name, $check.Path, $_.Exception.Message)
  }
}

if ($failures -gt 0) { throw "$failures smoke checks failed." }
Write-Host 'Alpha public-route smoke checks passed.'
