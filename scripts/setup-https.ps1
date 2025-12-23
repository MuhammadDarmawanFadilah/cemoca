# Script PowerShell untuk Remote SSH dan Setup HTTPS
# Jalankan dengan: .\setup-https.ps1

$server = "72.61.208.104"
$username = "root"

Write-Host "🔐 Connecting to $server..." -ForegroundColor Cyan

# Command untuk dijalankan di server
$commands = @"
echo '🔐 Starting HTTPS Setup...'
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

echo '🚀 Requesting SSL for cemoca.cloud...'
sudo certbot --nginx -d cemoca.cloud -d www.cemoca.cloud --non-interactive --agree-tos -m admin@cemoca.org --redirect

echo '🔄 Reloading Nginx...'
sudo systemctl reload nginx

echo '✅ HTTPS Setup Completed!'
echo 'Testing HTTPS...'
curl -I https://cemoca.cloud | head -n 5
"@

Write-Host "📝 Commands to execute:" -ForegroundColor Yellow
Write-Host $commands -ForegroundColor Gray
Write-Host ""
Write-Host "🔑 Please enter password when prompted: P@ssw0rdAfan" -ForegroundColor Green
Write-Host ""

# SSH ke server (akan meminta password)
ssh "$username@$server" $commands
