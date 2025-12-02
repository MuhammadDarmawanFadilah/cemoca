@echo off
echo ===================================================
echo      RESET DATABASE KOPERASI DESA
echo ===================================================

echo Dropping existing database...
mysql -u root -e "DROP DATABASE IF EXISTS koperasi_desa;"

echo Creating new database...
mysql -u root -e "CREATE DATABASE koperasi_desa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo Database koperasi_desa has been reset successfully!
echo ===================================================

echo Starting Spring Boot application...
mvn spring-boot:run

pause