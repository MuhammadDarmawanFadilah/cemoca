Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$hostName = "72.61.208.104"
$userName = "root"

if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
  Write-Error "plink not found. Install PuTTY and ensure plink.exe is in PATH."
  exit 1
}

$securePw = Read-Host -Prompt "SSH Password" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePw)
try {
  $pw = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
}
finally {
  [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

echo y | plink -ssh "$userName@$hostName" -pw $pw "bash /opt/CEMOCA/redeploy-backend.sh"
if ($LASTEXITCODE -ne 0) {
  throw "Backend redeploy failed (plink exit code $LASTEXITCODE)"
}
