param(
  [string]$Token,
  [string]$Owner
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $Token) {
  if ($env:GITHUB_TOKEN) {
    $Token = $env:GITHUB_TOKEN
  }
}

if (-not $Token) {
  throw 'Missing GitHub token. Set GITHUB_TOKEN env var or pass -Token.'
}

$headers = @{
  Authorization = "Bearer $Token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
  'User-Agent' = 'cemoca-script'
}

function Invoke-Gh([string]$method, [string]$uri, $body = $null) {
  if ($null -eq $body) {
    return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers
  }
  $json = $body | ConvertTo-Json
  return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers -ContentType 'application/json' -Body $json
}

# Determine username (owner) if not provided
if (-not $Owner) {
  $me = Invoke-Gh 'Get' 'https://api.github.com/user'
  $Owner = $me.login
}

$perPage = 100
$page = 1
$repos = @()

while ($true) {
  $uri = "https://api.github.com/user/repos?per_page=$perPage&page=$page&affiliation=owner"
  $pageRepos = Invoke-Gh 'Get' $uri
  if (-not $pageRepos -or $pageRepos.Count -eq 0) {
    break
  }
  $repos += $pageRepos
  if ($pageRepos.Count -lt $perPage) {
    break
  }
  $page++
}

$changed = 0
foreach ($r in $repos) {
  if ($r.owner.login -ne $Owner) {
    continue
  }

  if ($r.private -eq $true) {
    continue
  }

  $repoFullName = $r.full_name
  Invoke-Gh 'Patch' ("https://api.github.com/repos/$repoFullName") @{ private = $true } | Out-Null

  $verify = Invoke-Gh 'Get' ("https://api.github.com/repos/$repoFullName")
  if ($verify.private -ne $true) {
    throw "Repo visibility update did not apply for $repoFullName"
  }

  $changed++
}

"OK ($changed repos set to private)"
