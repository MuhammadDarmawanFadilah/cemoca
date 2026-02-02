$ErrorActionPreference = 'Stop'

Set-Location 'C:\PROJEK\CEMOCAPPS\backend'

$jdkCandidates = @(
	"$HOME\.jdk\jdk-25",
	"$HOME\.jdk\jdk-25(1)"
)

$jdkHome = $jdkCandidates | Where-Object { Test-Path (Join-Path $_ 'bin\java.exe') } | Select-Object -First 1
if (-not $jdkHome) {
	Write-Error "JDK 25 not found. Install to $HOME\.jdk\jdk-25 (or set JAVA_HOME to a JDK 25)."
	exit 1
}

$env:JAVA_HOME = $jdkHome
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

$env:SPRING_PROFILES_ACTIVE = 'local'

if (-not $env:HEYGEN_API_KEY -or [string]::IsNullOrWhiteSpace($env:HEYGEN_API_KEY)) {
	Write-Warning "HEYGEN_API_KEY env var is not set. HeyGen API calls will fail until it is provided."
}


java -version
mvn -version

mvn spring-boot:run -DskipTests -e
