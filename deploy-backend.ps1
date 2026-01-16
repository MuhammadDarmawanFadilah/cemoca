Set-StrictMode -Version Latest

$hostName = "72.61.208.104"
$userName = "root"

if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
  Write-Error "plink not found. Install PuTTY and ensure plink.exe is in PATH."
  exit 1
}

$pw = Read-Host -Prompt "SSH Password"

echo y | plink -ssh "$userName@$hostName" -pw $pw "bash /opt/CEMOCA/redeploy-backend.sh"
