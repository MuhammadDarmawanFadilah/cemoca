param(
  [string]$SshPassword,
  [string]$SshPasswordFile
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
if ($SshPasswordFile) {
  if (-not (Test-Path $SshPasswordFile)) {
    throw "SSH password file not found: $SshPasswordFile"
  }
  $SshPassword = (Get-Content -Raw -Path $SshPasswordFile).Trim()
}
elseif ($env:SSH_PASSWORD_FILE) {
  if (-not (Test-Path $env:SSH_PASSWORD_FILE)) {
    throw "SSH password file not found: $env:SSH_PASSWORD_FILE"
  }
  $SshPassword = (Get-Content -Raw -Path $env:SSH_PASSWORD_FILE).Trim()
}

if ($SshPassword) {
  $authArgs = @("-pw", $SshPassword)
}
elseif ($env:SSH_PASSWORD) {
  $authArgs = @("-pw", $env:SSH_PASSWORD)
}
else {
  throw "Missing SSH auth. Set SSH_PASSWORD / SSH_PASSWORD_FILE env var or pass -SshPassword / -SshPasswordFile."
}

echo y | plink -batch -ssh "$userName@$hostName" @authArgs "bash /opt/CEMOCA/redeploy-backend.sh"
if ($LASTEXITCODE -ne 0) {
  throw "Backend redeploy failed (plink exit code $LASTEXITCODE)"
}

