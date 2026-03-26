param(
  [Alias("vsmImage", "from")]
  [string]$Image,
  [string]$Name = "Table_Manufacturing",
  [string]$ActiveDir = "models/active",
  [string]$Build = "true",
  [string]$IncludeMetrics = "true",
  [string]$IncludeFullApp = "true"
)

$ErrorActionPreference = "Stop"

function Convert-ToBool {
  param(
    [string]$Value,
    [bool]$Fallback = $true
  )

  if ($null -eq $Value) {
    return $Fallback
  }

  switch ($Value.Trim().ToLowerInvariant()) {
    "true" { return $true }
    "1" { return $true }
    "yes" { return $true }
    "false" { return $false }
    "0" { return $false }
    "no" { return $false }
    default { return $Fallback }
  }
}

function Write-Json {
  param(
    [string]$Path,
    [object]$Value
  )
  $Value | ConvertTo-Json -Depth 16 | Set-Content -Path $Path -Encoding UTF8
}

if ([string]::IsNullOrWhiteSpace($Image)) {
  throw "Usage: npm run workflow:vsm:image -- --image <path-to-vsm-image> [--name Table_Manufacturing]"
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location -Path $repoRoot

$imagePath = (Resolve-Path $Image).Path
if (-not (Test-Path -LiteralPath $imagePath -PathType Leaf)) {
  throw "Image file not found: $imagePath"
}

$activeDirPath = (Resolve-Path $ActiveDir).Path
$graphPath = Join-Path $activeDirPath "vsm_graph.json"
$masterPath = Join-Path $activeDirPath "master_data.json"

if (-not (Test-Path -LiteralPath $graphPath -PathType Leaf)) {
  throw "Missing active model file: $graphPath"
}
if (-not (Test-Path -LiteralPath $masterPath -PathType Leaf)) {
  throw "Missing active model file: $masterPath"
}

$buildApp = Convert-ToBool -Value $Build -Fallback $true
$includeMetricsBool = Convert-ToBool -Value $IncludeMetrics -Fallback $true
$includeFullAppBool = Convert-ToBool -Value $IncludeFullApp -Fallback $true
$includeMetricsArg = if ($includeMetricsBool) { "true" } else { "false" }
$includeFullAppArg = if ($includeFullAppBool) { "true" } else { "false" }

$sourceExt = [System.IO.Path]::GetExtension($imagePath)
if ([string]::IsNullOrWhiteSpace($sourceExt)) {
  $sourceExt = ".img"
}
$copiedSourceName = "ingested_vsm_source$($sourceExt.ToLowerInvariant())"
$copiedSourcePath = Join-Path $activeDirPath $copiedSourceName
Copy-Item -LiteralPath $imagePath -Destination $copiedSourcePath -Force

$imageInfo = Get-Item -LiteralPath $imagePath
$ingestionManifestPath = Join-Path $activeDirPath "ingestion_manifest.json"
$ingestionManifest = @{
  workflowVersion = "1.0.0"
  ingestedAt = [DateTime]::UtcNow.ToString("o")
  sourceImage = @{
    providedPath = $imagePath
    copiedPath = $copiedSourcePath
    sizeBytes = $imageInfo.Length
  }
  activeModels = @{
    vsmGraphPath = $graphPath
    masterDataPath = $masterPath
  }
}
Write-Json -Path $ingestionManifestPath -Value $ingestionManifest
Write-Host "Ingestion manifest written: $ingestionManifestPath"

& node scripts/refresh-forecast-active.mjs --activeDir $activeDirPath
if ($LASTEXITCODE -ne 0) {
  throw "refresh-forecast-active failed."
}

if ($buildApp) {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed."
  }
}

$exportOutput = & node scripts/export-scenario-bundle.mjs --name $Name --includeMetrics $includeMetricsArg --includeFullApp $includeFullAppArg --skipBuild true 2>&1
$exportOutput | ForEach-Object { Write-Host $_ }
if ($LASTEXITCODE -ne 0) {
  throw "export-scenario-bundle failed."
}

$bundlePath = $null
foreach ($line in $exportOutput) {
  $text = [string]$line
  if ($text -match '^Bundle path:\s*(.+)$') {
    $bundlePath = $matches[1].Trim()
  }
}
if ([string]::IsNullOrWhiteSpace($bundlePath)) {
  throw "Could not parse bundle path from export output."
}
if (-not (Test-Path -LiteralPath $bundlePath -PathType Container)) {
  throw "Bundle path not found after export: $bundlePath"
}

$bundleSourceImagePath = Join-Path $bundlePath "source_vsm_image$($sourceExt.ToLowerInvariant())"
Copy-Item -LiteralPath $imagePath -Destination $bundleSourceImagePath -Force
Copy-Item -LiteralPath $ingestionManifestPath -Destination (Join-Path $bundlePath "ingestion_manifest.json") -Force

$missingReportPath = Join-Path $repoRoot "models/missing_data_report.md"
if (Test-Path -LiteralPath $missingReportPath -PathType Leaf) {
  Copy-Item -LiteralPath $missingReportPath -Destination (Join-Path $bundlePath "missing_data_report.md") -Force
}

$workflowReport = @{
  workflowVersion = "1.0.0"
  completedAt = [DateTime]::UtcNow.ToString("o")
  sourceImagePath = $imagePath
  activeDir = $activeDirPath
  compiledForecastPath = Join-Path $activeDirPath "compiled_forecast_model.json"
  operationalDiagnosisPath = Join-Path $bundlePath "operational_diagnosis.json"
  exportedBundlePath = $bundlePath
  includeMetrics = $includeMetricsBool
  includeFullApp = $includeFullAppBool
  buildApp = $buildApp
}
Write-Json -Path (Join-Path $bundlePath "workflow_report.json") -Value $workflowReport

$exportsDir = Join-Path $repoRoot "exports"
if (-not (Test-Path -LiteralPath $exportsDir -PathType Container)) {
  New-Item -ItemType Directory -Path $exportsDir -Force | Out-Null
}

Set-Content -Path (Join-Path $exportsDir "LATEST_EXPORT.txt") -Value $bundlePath -Encoding UTF8

$startLatestBat = @'
@echo off
setlocal EnableExtensions
set "LATEST_FILE=%~dp0exports\LATEST_EXPORT.txt"

if not exist "%LATEST_FILE%" (
  echo LATEST_EXPORT.txt not found. Run workflow:vsm:image first.
  pause
  exit /b 1
)

set /p BUNDLE_PATH=<"%LATEST_FILE%"
if "%BUNDLE_PATH%"=="" (
  echo LATEST_EXPORT.txt is empty.
  pause
  exit /b 1
)

if not exist "%BUNDLE_PATH%\start_full_app.bat" (
  echo start_full_app.bat not found in:
  echo %BUNDLE_PATH%
  pause
  exit /b 1
)

call "%BUNDLE_PATH%\start_full_app.bat"
'@
Set-Content -Path (Join-Path $repoRoot "start_latest_export.bat") -Value $startLatestBat -Encoding ASCII

Write-Host "Workflow complete: $bundlePath"
Write-Host "Latest pointer: $(Join-Path $exportsDir 'LATEST_EXPORT.txt')"
Write-Host "Launcher: $(Join-Path $repoRoot 'start_latest_export.bat')"
