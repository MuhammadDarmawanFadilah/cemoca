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

$env:ELEVENLABS_API_KEY = "e78d92bd4d6f2122220280ce6ccb8f3380274f1cf9d68e66851789f0a6a5b5f6"

java -version
mvn -version

mvn spring-boot:run -DskipTests -e
