@echo off
echo ===================================================
echo      RESET DATABASE KOPERASI DESA
echo ===================================================

REM Prefer JDK 25 for this project
set "JDK25_1=%USERPROFILE%\.jdk\jdk-25"
set "JDK25_2=%USERPROFILE%\.jdk\jdk-25(1)"
if exist "%JDK25_1%\bin\java.exe" (
	set "JAVA_HOME=%JDK25_1%"
) else if exist "%JDK25_2%\bin\java.exe" (
	set "JAVA_HOME=%JDK25_2%"
)
if not "%JAVA_HOME%"=="" (
	set "PATH=%JAVA_HOME%\bin;%PATH%"
)

echo Dropping existing database...
mysql -u root -e "DROP DATABASE IF EXISTS koperasi_desa;"

echo Creating new database...
mysql -u root -e "CREATE DATABASE koperasi_desa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo Database koperasi_desa has been reset successfully!
echo ===================================================

echo Starting Spring Boot application...
mvn spring-boot:run

pause