Set-StrictMode -Version Latest

$hostName = "72.61.208.104"
$userName = "root"
$remoteFrontendDir = "/opt/cemoca/app/frontend"
$remoteEnvProdPath = "/opt/cemoca/app/frontend/.env.prod"

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

$pw = Read-Host -Prompt "SSH Password"

# Pull production env file for a build that matches server configuration
$localFrontendDir = "c:\PROJEK\CEMOCAPPS\frontend"
$localEnvProd = Join-Path $localFrontendDir ".env.production"

try {
  if (Test-Path $localEnvProd) { Remove-Item -Force $localEnvProd }

  Write-Host "Downloading production .env.prod ..."
  pscp -pw $pw ("$userName@$hostName:$remoteEnvProdPath") $localEnvProd | Out-String | Write-Host

  Write-Host "Building frontend locally ..."
  Push-Location $localFrontendDir
  $env:NEXT_TELEMETRY_DISABLED = "1"
  $env:NODE_OPTIONS = "--max-old-space-size=4096"

  pnpm install
  pnpm run build

  $tarPath = "c:\PROJEK\CEMOCAPPS\frontend-build.tgz"
  if (Test-Path $tarPath) { Remove-Item -Force $tarPath }

  # Package only build output + public assets
  tar -czf $tarPath -C $localFrontendDir .next public
  Pop-Location

  Write-Host "Uploading build artifact ..."
  pscp -pw $pw $tarPath ("$userName@$hostName:$remoteFrontendDir/frontend-build.tgz") | Out-String | Write-Host

  Write-Host "Deploying on server (no server-side build) ..."
  $remoteCmd = @(
    "set -e",
    "sudo systemctl stop cemoca-frontend || true",
    "cd $remoteFrontendDir",
    "rm -rf .next",
    "tar -xzf frontend-build.tgz",
    "rm -f frontend-build.tgz",
    "sudo systemctl start cemoca-frontend",
    "sudo systemctl is-active --quiet cemoca-frontend",
    "for i in 1 2 3 4 5; do curl -fsS http://localhost:3008 >/dev/null && break; sleep 2; done",
    "sudo nginx -t",
    "sudo systemctl reload nginx",
    "echo 'OK'"
  ) -join "; "

  echo y | plink -ssh "$userName@$hostName" -pw $pw $remoteCmd

  Write-Host "Frontend deployed successfully."
}
finally {
  # Cleanup local secrets/artifacts
  if (Test-Path $localEnvProd) { Remove-Item -Force $localEnvProd }
  $tarPath = "c:\PROJEK\CEMOCAPPS\frontend-build.tgz"
  if (Test-Path $tarPath) { Remove-Item -Force $tarPath }
}
