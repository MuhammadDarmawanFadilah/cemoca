param(
  [string]$Repo,
  [string]$Token
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-RepoFromOrigin {
  $origin = (git remote get-url origin) 2>$null
  if (-not $origin) {
    throw 'Could not read origin remote.'
  }

  # Supports:
  # - https://github.com/owner/repo.git
  # - git@github.com:owner/repo.git
  if ($origin -match '^https?://github\\.com/(?<owner>[^/]+)/(?<name>[^/]+?)(?:\\.git)?$') {
    return "$($Matches.owner)/$($Matches.name)"
  }
  if ($origin -match '^git@github\\.com:(?<owner>[^/]+)/(?<name>[^/]+?)(?:\\.git)?$') {
    return "$($Matches.owner)/$($Matches.name)"
  }

  throw "Unsupported origin URL: $origin"
}

if (-not $Repo) {
  $Repo = Resolve-RepoFromOrigin
}

if (-not $Token) {
  if ($env:GITHUB_TOKEN) {
    $Token = $env:GITHUB_TOKEN
  }
}

if (-not $Token) {
  throw 'Missing GitHub token. Set GITHUB_TOKEN env var or pass -Token.'
}

$uri = "https://api.github.com/repos/$Repo"
$headers = @{
  Authorization = "Bearer $Token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
  'User-Agent' = 'cemoca-script'
}

$body = @{ private = $true } | ConvertTo-Json

Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -ContentType 'application/json' -Body $body | Out-Null

# Verify
$r = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
if ($r.private -ne $true) {
  throw "Repo visibility update did not apply for $Repo"
}

'OK'
