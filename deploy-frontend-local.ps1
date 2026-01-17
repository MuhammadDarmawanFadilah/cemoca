param(
  [string]$SshPassword
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$hostName = "72.61.208.104"
$userName = "root"
$remoteFrontendDir = "/opt/cemoca/app/frontend"

if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
  Write-Error "plink not found. Install PuTTY and ensure plink.exe is in PATH."
  exit 1
}

if (-not (Get-Command pscp -ErrorAction SilentlyContinue)) {
  Write-Error "pscp not found. Install PuTTY and ensure pscp.exe is in PATH."
  exit 1
}

if (-not (Test-Path "c:\PROJEK\CEMOCAPPS\frontend")) {
  Write-Error "Expected frontend folder at c:\\PROJEK\\CEMOCAPPS\\frontend"
  exit 1
}

function Get-AuthArgs {
  if ($SshPassword) {
    return @("-pw", $SshPassword)
  }

  if ($env:SSH_PASSWORD) {
    return @("-pw", $env:SSH_PASSWORD)
  }

  throw "Missing SSH auth. Set SSH_PASSWORD env var or pass -SshPassword."
}

$authArgs = Get-AuthArgs
$puttyBatchArgs = @("-batch")

function Assert-LastExitCode([string]$message) {
  if ($LASTEXITCODE -ne 0) {
    throw $message
  }
}

$localFrontendDir = "c:\PROJEK\CEMOCAPPS\frontend"
$localEnvProductionPath = Join-Path $localFrontendDir ".env.production"
$localEnvProdPath = Join-Path $localFrontendDir ".env.prod"
$createdEnvProductionTemp = $false

try {
  if (-not (Test-Path $localEnvProductionPath)) {
    if (-not (Test-Path $localEnvProdPath)) {
      throw "Missing local prod env. Expected either $localEnvProductionPath or $localEnvProdPath"
    }

    Copy-Item -Force $localEnvProdPath $localEnvProductionPath
    $createdEnvProductionTemp = $true
  }

  Write-Host "Building frontend locally ..."
  Push-Location $localFrontendDir
  $env:NEXT_TELEMETRY_DISABLED = "1"
  $env:NODE_OPTIONS = "--max-old-space-size=4096"

  pnpm install
  Assert-LastExitCode "pnpm install failed"
  pnpm run build
  Assert-LastExitCode "pnpm build failed"

  $tarPath = "c:\PROJEK\CEMOCAPPS\frontend-build.tgz"
  if (Test-Path $tarPath) { Remove-Item -Force $tarPath }

  # Package only build output + public assets
  tar -czf $tarPath -C $localFrontendDir .next public
  Assert-LastExitCode "Failed to create frontend build artifact"
  Pop-Location

  Write-Host "Uploading build artifact ..."
  pscp @puttyBatchArgs @authArgs $tarPath ("${userName}@${hostName}:${remoteFrontendDir}/frontend-build.tgz") | Out-String | Write-Host
  Assert-LastExitCode "Failed to upload frontend build artifact to server"

  Write-Host "Deploying on server (no server-side build) ..."
  $remoteCmd = (@'
set -e;
sudo systemctl stop cemoca-frontend || true;
cd {0};
rm -rf .next;
tar -xzf frontend-build.tgz;
rm -f frontend-build.tgz;
sudo systemctl start cemoca-frontend;
sudo systemctl is-active --quiet cemoca-frontend;
ok=0; for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do if curl -fsS http://localhost:3008 >/dev/null; then ok=1; break; fi; sleep 3; done; if [ "$ok" -ne 1 ]; then echo 'Frontend healthcheck failed (localhost:3008)'; sudo systemctl status cemoca-frontend --no-pager || true; sudo journalctl -u cemoca-frontend -n 200 --no-pager || true; sudo ss -ltnp | grep -E ':3008|:3000' || true; exit 1; fi;
sudo nginx -t;
sudo systemctl reload nginx;
echo 'OK'
'@) -f $remoteFrontendDir
  $remoteCmd = $remoteCmd -replace "`r", ""

  plink @puttyBatchArgs -ssh "$userName@$hostName" @authArgs $remoteCmd
  Assert-LastExitCode "Remote deploy command failed"

  Write-Host "Frontend deployed successfully."
}
finally {
  # Cleanup local secrets/artifacts
  if ($createdEnvProductionTemp -and (Test-Path $localEnvProductionPath)) {
    Remove-Item -Force $localEnvProductionPath
  }
  $tarPath = "c:\PROJEK\CEMOCAPPS\frontend-build.tgz"
  if (Test-Path $tarPath) { Remove-Item -Force $tarPath }
}
