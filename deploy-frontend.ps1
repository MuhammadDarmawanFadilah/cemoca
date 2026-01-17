param(
  [string]$SshPassword
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$hostName = "72.61.208.104"
$userName = "root"

if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
  Write-Error "plink not found. Install PuTTY and ensure plink.exe is in PATH."
  exit 1
}

$authArgs = @()
if ($SshPassword) {
  $authArgs = @("-pw", $SshPassword)
}
elseif ($env:SSH_PASSWORD) {
  $authArgs = @("-pw", $env:SSH_PASSWORD)
}
else {
  throw "Missing SSH auth. Set SSH_PASSWORD env var or pass -SshPassword."
}

echo y | plink -ssh "$userName@$hostName" @authArgs "bash /opt/CEMOCA/redeploy-frontend.sh"
if ($LASTEXITCODE -ne 0) {
  throw "Frontend redeploy failed (plink exit code $LASTEXITCODE)"
}
