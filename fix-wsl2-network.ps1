# PowerShell script to fix WSL2 network access for mobile devices
# Run this script as Administrator in Windows PowerShell

Write-Host "=== WSL2 Network Configuration Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))
{
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Get WSL IP
$wslIP = bash.exe -c "ip addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'"
$windowsIP = "192.168.131.99"
$port = "3005"

Write-Host "🔍 WSL2 IP Address: $wslIP" -ForegroundColor Green
Write-Host "🔍 Windows IP Address: $windowsIP" -ForegroundColor Green
Write-Host "🔍 Port: $port" -ForegroundColor Green
Write-Host ""

# Check existing port proxy rules
Write-Host "📋 Current port proxy rules:" -ForegroundColor Yellow
netsh interface portproxy show v4tov4
Write-Host ""

# Remove old port proxy rule
Write-Host "🗑️  Removing old port proxy rule..." -ForegroundColor Yellow
netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=$port listenaddress=$windowsIP 2>$null
Write-Host ""

# Add new port proxy rules
Write-Host "➕ Adding new port proxy rules..." -ForegroundColor Yellow
# Rule for all interfaces
netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIP
# Rule for specific Windows IP
netsh interface portproxy add v4tov4 listenport=$port listenaddress=$windowsIP connectport=$port connectaddress=$wslIP
Write-Host "✅ Port proxy rules added" -ForegroundColor Green
Write-Host ""

# Show updated rules
Write-Host "📋 Updated port proxy rules:" -ForegroundColor Yellow
netsh interface portproxy show v4tov4
Write-Host ""

# Check firewall rules
Write-Host "🔥 Checking Windows Firewall rules..." -ForegroundColor Yellow
$existingRule = netsh advfirewall firewall show rule name="WSL2 Next.js Port $port" 2>$null
if ($existingRule -match "No rules match") {
    Write-Host "➕ Adding Windows Firewall rule..." -ForegroundColor Yellow
    netsh advfirewall firewall add rule name="WSL2 Next.js Port $port" dir=in action=allow protocol=TCP localport=$port
    Write-Host "✅ Firewall rule added" -ForegroundColor Green
} else {
    Write-Host "✅ Firewall rule already exists" -ForegroundColor Green
}
Write-Host ""

# Additional firewall rule for all profiles
Write-Host "➕ Adding comprehensive firewall rule..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="WSL2 Dev Server $port" dir=in action=allow protocol=TCP localport=$port profile=any 2>$null
Write-Host ""

# Test connectivity
Write-Host "🧪 Testing connectivity..." -ForegroundColor Yellow
Write-Host "Testing localhost:$port..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 2
    Write-Host "✅ localhost:$port is accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ localhost:$port is NOT accessible" -ForegroundColor Red
}

Write-Host "Testing $windowsIP:$port..."
try {
    $response = Invoke-WebRequest -Uri "http://${windowsIP}:$port" -UseBasicParsing -TimeoutSec 2
    Write-Host "✅ ${windowsIP}:$port is accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ ${windowsIP}:$port is NOT accessible" -ForegroundColor Red
}
Write-Host ""

# Kaspersky instructions
Write-Host "⚠️  KASPERSKY CONFIGURATION REQUIRED!" -ForegroundColor Red
Write-Host ""
Write-Host "To allow external access with Kaspersky:" -ForegroundColor Yellow
Write-Host "1. Open Kaspersky Security Center" -ForegroundColor White
Write-Host "2. Go to Settings → Protection → Firewall" -ForegroundColor White
Write-Host "3. Click 'Configure packet rules'" -ForegroundColor White
Write-Host "4. Add a new rule:" -ForegroundColor White
Write-Host "   - Name: WSL2 Development Server" -ForegroundColor White
Write-Host "   - Action: Allow" -ForegroundColor White
Write-Host "   - Direction: Incoming" -ForegroundColor White
Write-Host "   - Protocol: TCP" -ForegroundColor White
Write-Host "   - Local port: $port" -ForegroundColor White
Write-Host "   - Remote addresses: Any" -ForegroundColor White
Write-Host "5. Apply the changes" -ForegroundColor White
Write-Host ""
Write-Host "Alternative: Temporarily disable Kaspersky Firewall for testing" -ForegroundColor Yellow
Write-Host ""

# Network adapter trust
Write-Host "📡 WSL Network Adapter Trust:" -ForegroundColor Yellow
Write-Host "In Kaspersky, you may also need to:" -ForegroundColor White
Write-Host "1. Go to Settings → Protection → Firewall → Networks" -ForegroundColor White
Write-Host "2. Find 'vEthernet (WSL)' adapter" -ForegroundColor White
Write-Host "3. Set it as 'Trusted network'" -ForegroundColor White
Write-Host ""

# Final instructions
Write-Host "📱 TO ACCESS FROM MOBILE DEVICES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ensure your mobile device is on the same Wi-Fi network" -ForegroundColor White
Write-Host "2. In WSL2, start your Next.js server with:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Green
Write-Host "3. On your mobile device, navigate to:" -ForegroundColor White
Write-Host "   http://${windowsIP}:$port" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "If it still doesn't work:" -ForegroundColor Yellow
Write-Host "- Restart WSL2: wsl --shutdown then restart" -ForegroundColor White
Write-Host "- Check if Next.js is binding to 0.0.0.0 (not just localhost)" -ForegroundColor White
Write-Host "- Temporarily disable Kaspersky to isolate the issue" -ForegroundColor White
Write-Host "- Check router settings for AP isolation" -ForegroundColor White