param([string]$BaseUrl='http://localhost:3000',[int]$Samples=5)

$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$routes=@('/exhibition/2026-morocco','/exhibition/2026-morocco/news','/exhibition/2026-morocco/exhibitors','/exhibition/2026-morocco/register/reg-main')
$rows=@()
foreach($route in $routes){
  $times=@()
  for($i=0;$i -lt $Samples;$i++){$watch=[System.Diagnostics.Stopwatch]::StartNew();$response=Invoke-WebRequest -Uri ($BaseUrl+$route) -UseBasicParsing;$watch.Stop();if($response.StatusCode-ne 200){throw "$route 返回 $($response.StatusCode)"};$times+=[math]::Round($watch.Elapsed.TotalMilliseconds,2)}
  $sorted=$times|Sort-Object;$median=$sorted[[math]::Floor(($sorted.Count-1)/2)];$p95=$sorted[[math]::Min($sorted.Count-1,[math]::Ceiling($sorted.Count*0.95)-1)];$rows+=[ordered]@{route=$route;samples=$Samples;medianMs=$median;p95Ms=$p95;minMs=$sorted[0];maxMs=$sorted[-1]}
}
$outputDir=Join-Path $projectRoot 'outputs\performance';New-Item -ItemType Directory -Path $outputDir -Force|Out-Null;$path=Join-Path $outputDir ("local-sample-"+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.json');[ordered]@{measuredAt=(Get-Date).ToUniversalTime().ToString('o');environment='LOCAL_ALPHA';threshold='TBD';reference='PERFORMANCE-TBD-001';routes=$rows}|ConvertTo-Json -Depth 6|Set-Content -LiteralPath $path -Encoding utf8;$rows|Format-Table|Out-String|Write-Host;Write-Output $path
